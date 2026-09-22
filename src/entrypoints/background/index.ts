import { browser, defineBackground } from '#imports';
import { rewriteSelection } from '@/core/capture/ai/rewrite';
import { validateApiKey } from '@/core/capture/ai/validate';
import { CaptureState, type PauseReason } from '@/core/capture/machine';
import { isSameAddress } from '@/core/guideme/progress';
import { advanceSession, cancelSession, completeSession, getSession, startSession } from '@/core/guideme/session';
import { actionSteps, isReplayable } from '@/core/guides/blocks';
import { createGuide, createSnapshot, getStepsForGuide, mergeGuideInto } from '@/core/guides/service';
import {
  getActiveTab,
  localStorage,
  sendMessageToTab,
  setSidePanelBehavior,
  toggleSidebar,
  updateTab,
} from '@/lib/browser-api';
import { logger } from '@/lib/logger';
import { onMessage } from '@/lib/messaging';
import { broadcastStateToPanel, setupPortListener } from '@/lib/port';
import { recordUpdate } from '@/lib/update-notice';
import { getActor, getStateUpdate, initActor, initActorFallback, waitUntilReady } from './actor';
import { goToStepsEnabled, registerGoToListeners, requestPageStep } from './go-to';
import { generateDescriptionOnDemand, generateGuideMetaOnStop, settlePendingDescriptions } from './guide-meta';
import { registerGuideMeListeners, resolveManual } from './guideme';
import { registerNavigationListeners } from './navigation';
import {
  handleCapturePageStep,
  handleCaptureStep,
  handleFinalizeInputStep,
  handleUpdateInputStep,
} from './step-pipeline';
import { broadcastStartCapture, broadcastStopCapture, showNotificationOnTab } from './tab-manager';
import {
  canStartNarrationNow,
  getVoiceUpdate,
  registerVoiceListeners,
  startVoiceNarration,
  stopVoiceNarration,
} from './voice';

async function resumeCapture(reason: PauseReason): Promise<boolean> {
  await waitUntilReady();
  const actor = getActor();
  actor.send({ type: 'RESUME', reason });
  const { value, context } = actor.getSnapshot();
  if (value !== CaptureState.RECORDING || !context.currentGuideId) return false;
  await broadcastStartCapture(context.currentGuideId);
  return true;
}

async function startNarrationIfPossible(): Promise<boolean> {
  await waitUntilReady();
  const actor = getActor();
  if (!canStartNarrationNow(String(actor.getSnapshot().value), getVoiceUpdate().phase)) return false;
  const activeTab = await getActiveTab();
  await startVoiceNarration(activeTab?.id);
  return getVoiceUpdate().phase === 'recording';
}

export default defineBackground(() => {
  logger.info('Background service worker started');

  browser.runtime.onInstalled.addListener(async (details) => {
    await recordUpdate(details.reason);
    if (details.reason !== 'install') return;
    if (import.meta.env.BROWSER === 'firefox') {
      // Firefox MV3 bug 1758306: the <all_urls> grant lands in the origin
      // store but is missed by _setupStartupPermissions when populating the
      // API-permission resolution table that captureVisibleTab consults.
      // Result: permissions.contains() returns true but captureVisibleTab
      // silently rejects. Removing the permission here forces a clean state
      // so the user-gesture permissions.request() in onboarding's "Get
      // Started" / sidepanel's "Start Recording" goes through the working
      // re-grant code path. Remove this when Mozilla ships:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1758306
      try {
        await browser.permissions.remove({ origins: ['<all_urls>'] });
      } catch (err) {
        logger.warn('Failed to clear stale host permission on install', err);
      }
    }
    browser.tabs.create({ url: browser.runtime.getURL('/onboarding.html') });
  });

  setSidePanelBehavior(true);
  if (import.meta.env.BROWSER === 'firefox') {
    browser.action.onClicked.addListener(() => {
      toggleSidebar();
    });
  }
  initActor().catch(initActorFallback);
  cancelSession();
  registerNavigationListeners();
  registerGoToListeners();
  registerGuideMeListeners();
  registerVoiceListeners(startNarrationIfPossible);

  setupPortListener((port) => {
    logger.debug('Panel connected via port');
    waitUntilReady().then(() => {
      try {
        port.postMessage(getStateUpdate());
        port.postMessage(getVoiceUpdate());
      } catch {}
    });

    port.onDisconnect.addListener(() => {
      getSession().then((session) => {
        if (session?.active) {
          cancelSession();
          logger.debug('Guide Me cancelled: sidepanel closed');
        }
      });
    });
  });

  waitUntilReady().then(() => {
    getActor().subscribe(() => broadcastStateToPanel(getStateUpdate()));
  });

  onMessage('getState', async () => {
    await waitUntilReady();
    return getStateUpdate();
  });

  onMessage('startRecording', async ({ data }) => {
    await waitUntilReady();
    const actor = getActor();
    actor.send({
      type: 'START_RECORDING',
      url: data.url,
      insertTargetGuideId: data.insertTargetGuideId,
      insertAtIndex: data.insertAtIndex,
    });
    const guideId = actor.getSnapshot().context.currentGuideId!;

    await createGuide(guideId, data.insertTargetGuideId !== undefined);

    const activeTab = await getActiveTab();
    if (activeTab?.id) await showNotificationOnTab(activeTab.id);

    await startVoiceNarration(activeTab?.id);

    await broadcastStartCapture(guideId);
    if (activeTab?.id && data.insertTargetGuideId === undefined && (await goToStepsEnabled())) {
      void requestPageStep(activeTab.id);
    }
    return { guideId };
  });

  onMessage('stopRecording', async () => {
    await waitUntilReady();
    const actor = getActor();
    const { currentGuideId: guideId, insertTargetGuideId, insertAtIndex } = actor.getSnapshot().context;
    await broadcastStopCapture();
    actor.send({ type: 'STOP_RECORDING' });

    if (guideId) void stopVoiceNarration(guideId);

    if (guideId && insertTargetGuideId !== null && insertAtIndex !== null) {
      await settlePendingDescriptions(guideId);
      await createSnapshot(insertTargetGuideId);
      await mergeGuideInto(guideId, insertTargetGuideId, insertAtIndex);
      return { success: true, guideId: insertTargetGuideId, inserted: true };
    }

    if (guideId) generateGuideMetaOnStop(guideId).catch(() => {});

    return { success: true, guideId: guideId ?? undefined, inserted: false };
  });

  onMessage('startNarration', async () => ({ started: await startNarrationIfPossible() }));

  onMessage('enterBlurMode', async () => {
    await waitUntilReady();
    getActor().send({ type: 'PAUSE', reason: 'blur' });
    await broadcastStopCapture();
    const activeTab = await getActiveTab();
    if (activeTab?.id) {
      sendMessageToTab(activeTab.id, { type: 'START_BLUR' }).catch(() => {});
    }
    return { entered: true };
  });

  onMessage('exitBlurMode', async () => {
    await waitUntilReady();
    await localStorage.set({ dittoBlurMode: false });
    await resumeCapture('blur');
    return { exited: true };
  });

  onMessage('pauseRecording', async () => {
    await waitUntilReady();
    const actor = getActor();
    if (actor.getSnapshot().value !== CaptureState.RECORDING) return { paused: false };
    actor.send({ type: 'PAUSE', reason: 'user' });
    await broadcastStopCapture();
    return { paused: true };
  });

  onMessage('resumeRecording', async () => ({ resumed: await resumeCapture('user') }));

  onMessage('generateGuideDescription', ({ data }) => generateDescriptionOnDemand(data.guideId));

  onMessage('validateApiKey', ({ data }) => validateApiKey(data.provider, data.apiKey, data.baseUrl, data.model));

  onMessage('rewriteSelection', ({ data }) => rewriteSelection(data.text, data.instruction));

  onMessage('captureStep', async ({ data }) => {
    await waitUntilReady();
    return handleCaptureStep(data);
  });

  onMessage('capturePageStep', async ({ data }) => {
    await waitUntilReady();
    return handleCapturePageStep(data);
  });

  onMessage('updateInputStep', async ({ data }) => {
    await waitUntilReady();
    await handleUpdateInputStep(data.stepId, data.description, data.inputValue);
    return { updated: true };
  });

  onMessage('finalizeInputStep', async ({ data }) => {
    await waitUntilReady();
    await handleFinalizeInputStep(data.stepId, data.elementMeta, data.domContext);
    return { updated: true };
  });

  onMessage('startGuideMe', async ({ data }) => {
    const steps = actionSteps(await getStepsForGuide(data.guideId));
    if (steps.length === 0) return { started: false, error: 'No steps' };

    if (!steps.some(isReplayable)) return { started: false, error: 'Guide lacks element metadata' };
    const firstStep = steps[0];

    await startSession(data.guideId, steps.length, firstStep, await resolveManual(firstStep));

    const activeTab = await getActiveTab();
    if (activeTab?.id && firstStep.url && !isSameAddress(activeTab.url ?? '', firstStep.url)) {
      await updateTab(activeTab.id, { url: firstStep.url });
    }

    return { started: true };
  });

  onMessage('guideMeStepCompleted', async ({ data }) => {
    const sessionData = await localStorage.get(['guideMeSession']);
    const session = sessionData.guideMeSession as { guideId: string; activeStepIndex: number } | undefined;
    if (!session || session.activeStepIndex !== data.stepIndex) return { advanced: false };

    const steps = actionSteps(await getStepsForGuide(session.guideId));
    const nextIndex = data.stepIndex + 1;

    if (nextIndex >= steps.length) {
      await completeSession();
      return { advanced: true, completed: true };
    }

    const nextStep = steps[nextIndex];
    if (!nextStep) {
      await completeSession();
      return { advanced: true, completed: true };
    }
    await advanceSession(nextStep, nextIndex, await resolveManual(nextStep));

    const currentTab = await getActiveTab();
    if (currentTab?.id && nextStep.url && nextStep.url !== currentTab.url) {
      await updateTab(currentTab.id, { url: nextStep.url });
    }

    return { advanced: true };
  });

  onMessage('guideMeCancel', async () => {
    await cancelSession();
    return { cancelled: true };
  });

  onMessage('guideMeGoTo', async ({ data }) => {
    const sessionData = await localStorage.get(['guideMeSession']);
    const session = sessionData.guideMeSession as { guideId: string } | undefined;
    if (!session) return { moved: false };

    const steps = actionSteps(await getStepsForGuide(session.guideId));
    const target = steps[data.stepIndex];
    if (!target) return { moved: false };
    await advanceSession(target, data.stepIndex, await resolveManual(target));

    const currentTab = await getActiveTab();
    if (currentTab?.id && target.url && target.url !== currentTab.url) {
      await updateTab(currentTab.id, { url: target.url });
    }

    return { moved: true };
  });
});
