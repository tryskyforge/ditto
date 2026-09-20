import type { DOMContext } from '@/core/capture/dom/context';

export interface DeferredDescription {
  stepId: string;
  domContext: DOMContext;
}

export interface AiDescriptionInput {
  action: string;
  hasDomContext: boolean;
  hasAiKey: boolean;
  narrationCapturing: boolean;
}

const deferred = new Map<string, Map<string, DOMContext>>();

export function shouldQueueAiDescription({
  action,
  hasDomContext,
  hasAiKey,
  narrationCapturing,
}: AiDescriptionInput): boolean {
  return action !== 'input' && hasDomContext && hasAiKey && !narrationCapturing;
}

export function deferDescription(guideId: string, stepId: string, domContext: DOMContext): void {
  const forGuide = deferred.get(guideId) ?? new Map<string, DOMContext>();
  forGuide.set(stepId, domContext);
  deferred.set(guideId, forGuide);
}

export function takeDeferredDescription(guideId: string, stepId: string): DOMContext | undefined {
  const forGuide = deferred.get(guideId);
  if (!forGuide) return undefined;
  const domContext = forGuide.get(stepId);
  forGuide.delete(stepId);
  return domContext;
}

export function takeDeferredDescriptions(guideId: string, narratedStepIds: readonly string[]): DeferredDescription[] {
  const forGuide = deferred.get(guideId);
  if (!forGuide) return [];
  deferred.delete(guideId);

  const narrated = new Set(narratedStepIds);
  return [...forGuide]
    .filter(([stepId]) => !narrated.has(stepId))
    .map(([stepId, domContext]) => ({ stepId, domContext }));
}

export function discardDeferred(guideId: string, stepIds: readonly string[]): void {
  const forGuide = deferred.get(guideId);
  if (!forGuide) return;
  for (const stepId of stepIds) forGuide.delete(stepId);
}

export function clearDeferredDescriptions(guideId: string): void {
  deferred.delete(guideId);
}
