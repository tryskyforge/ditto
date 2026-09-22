import { stepRequiresManual } from '@/core/guideme/manual';
import { stepForAddress } from '@/core/guideme/progress';
import { advanceSession, getSession } from '@/core/guideme/session';
import { actionSteps } from '@/core/guides/blocks';
import { getScreenshotsForSteps, getStepsForGuide } from '@/core/guides/service';
import type { Step } from '@/core/guides/types';
import { getActiveTab, onHistoryStateUpdated, onNavigationCompleted } from '@/lib/browser-api';
import { logger } from '@/lib/logger';

export async function resolveManual(step: Step): Promise<boolean> {
  if (!step.screenshotId) return stepRequiresManual(step, null);
  const screenshots = await getScreenshotsForSteps([step.screenshotId]);
  return stepRequiresManual(step, screenshots.get(step.id));
}

export async function followGuideMeAddress(tabId: number, address: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.active) return false;
  const activeTab = await getActiveTab();
  if (activeTab?.id !== tabId) return false;

  const steps = actionSteps(await getStepsForGuide(session.guideId));
  const target = stepForAddress(steps, session.activeStepIndex, address);
  if (target === null) return false;

  const latest = await getSession();
  if (!latest?.active || latest.activeStepIndex !== session.activeStepIndex) return false;
  logger.debug('Guide Me: page matches step', target + 1, '→ jumping ahead');
  await advanceSession(steps[target], target, await resolveManual(steps[target]));
  return true;
}

export function registerGuideMeListeners() {
  const follow = (details: { tabId: number; frameId: number; url: string }) => {
    if (details.frameId !== 0) return;
    followGuideMeAddress(details.tabId, details.url).catch((err) =>
      logger.warn('Failed to follow Guide Me address', err),
    );
  };
  onNavigationCompleted(follow);
  onHistoryStateUpdated(follow);
}
