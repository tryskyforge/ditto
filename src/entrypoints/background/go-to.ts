import { CaptureState } from '@/core/capture/machine';
import {
  getTab,
  localStorage,
  onNavigationCommitted,
  onNavigationCompleted,
  sendMessageToTab,
} from '@/lib/browser-api';
import { logger } from '@/lib/logger';
import { TabMessage } from '@/lib/tab-messages';
import { getActor, waitUntilReady } from './actor';

const TYPED_TRANSITIONS = new Set(['typed', 'generated', 'auto_bookmark', 'keyword', 'keyword_generated']);
const SETTLE_MS = 700;
const ATTEMPTS = 6;
const RETRY_MS = 300;

const pending = new Map<number, ReturnType<typeof setTimeout> | null>();

export async function goToStepsEnabled(): Promise<boolean> {
  const { recordGoToSteps } = await localStorage.get(['recordGoToSteps']);
  return recordGoToSteps !== false;
}

export function isTypedNavigation(transitionType: string, qualifiers: readonly string[] = []): boolean {
  if (transitionType === 'reload' || qualifiers.includes('forward_back')) return false;
  return TYPED_TRANSITIONS.has(transitionType) || qualifiers.includes('from_address_bar');
}

export async function requestPageStep(tabId: number): Promise<boolean> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      const res = (await sendMessageToTab(tabId, { type: TabMessage.CAPTURE_PAGE })) as
        | { captured?: boolean }
        | undefined;
      if (res?.captured) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
  logger.debug('Go-to step not captured on tab', tabId);
  return false;
}

function isRecording() {
  return getActor().getSnapshot().value === CaptureState.RECORDING;
}

function clear(tabId: number) {
  const timer = pending.get(tabId);
  if (timer) clearTimeout(timer);
  pending.delete(tabId);
}

export function registerGoToListeners() {
  onNavigationCommitted(async (details) => {
    if (details.frameId !== 0) return;
    await waitUntilReady();
    if (!isRecording()) return clear(details.tabId);

    const qualifiers = details.transitionQualifiers ?? [];
    if (isTypedNavigation(details.transitionType, qualifiers)) {
      if (!(await goToStepsEnabled())) return;
      clear(details.tabId);
      pending.set(details.tabId, null);
      return;
    }
    if (pending.has(details.tabId) && qualifiers.includes('client_redirect')) {
      clear(details.tabId);
      pending.set(details.tabId, null);
      return;
    }
    clear(details.tabId);
  });

  onNavigationCompleted(async (details) => {
    if (details.frameId !== 0 || !pending.has(details.tabId)) return;
    const tabId = details.tabId;
    clear(tabId);
    pending.set(
      tabId,
      setTimeout(async () => {
        pending.delete(tabId);
        if (!isRecording()) return;
        const tab = await getTab(tabId).catch(() => undefined);
        if (tab?.active) await requestPageStep(tabId);
      }, SETTLE_MS),
    );
  });
}
