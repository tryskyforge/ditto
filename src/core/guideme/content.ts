import { browser } from '#imports';
import type { Step } from '@/core/guides/types';
import { logger } from '@/lib/logger';
import { sendMessage } from '@/lib/messaging';
import { findElement } from './finder';
import { GuideMeOverlay } from './overlay';
import type { GuideMeClaim, GuideMeSession } from './session';
import { ATTACHED_KEY, BLOCKED_KEY, MANUAL_KEY, NAVIGATED_KEY, SESSION_KEY, STEP_KEY } from './session';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 1000;

const NAVIGATE_PAUSE_MS = 1200;

export function isSamePage(current: string, target: string): boolean {
  try {
    const a = new URL(current);
    const b = new URL(target);
    return a.origin === b.origin && a.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '');
  } catch {
    return false;
  }
}

export class GuideMeController {
  private overlay: GuideMeOverlay | null = null;
  private storageListener: ((changes: Record<string, { newValue?: unknown }>) => void) | null = null;
  private clickHandler: ((e: Event) => void) | null = null;
  private clickEvent: 'click' | 'change' | 'contextmenu' = 'click';
  private currentTarget: HTMLElement | null = null;
  private currentStepIndex = -1;
  private watchTimer: ReturnType<typeof setInterval> | null = null;
  private advanceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly frame = crypto.randomUUID();

  constructor(private readonly isTopFrame = window.self === window.top) {
    this.storageListener = (changes) => {
      if (changes[SESSION_KEY] || changes[STEP_KEY]) {
        this.onStorageChange();
        return;
      }
      if (changes[ATTACHED_KEY]) this.onClaim(changes[ATTACHED_KEY].newValue as GuideMeClaim | null);
    };
    browser.storage.local.onChanged.addListener(this.storageListener);
    this.checkForActiveSession();
  }

  dispose() {
    if (this.storageListener) {
      browser.storage.local.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }
    this.stopWatching();
    this.removeActionDetection();
    this.destroyOverlay();
  }

  private async checkForActiveSession() {
    const data = await browser.storage.local.get([SESSION_KEY, STEP_KEY, MANUAL_KEY]);
    const session = data[SESSION_KEY] as GuideMeSession | null;
    const step = data[STEP_KEY] as Step | null;
    if (session?.active && step) {
      this.showStep(step, session.activeStepIndex, data[MANUAL_KEY] === true);
    }
  }

  private async onStorageChange() {
    const data = await browser.storage.local.get([SESSION_KEY, STEP_KEY, MANUAL_KEY]);
    const session = data[SESSION_KEY] as GuideMeSession | null;
    const step = data[STEP_KEY] as Step | null;

    if (!session?.active || !step) {
      this.stopWatching();
      this.removeActionDetection();
      this.destroyOverlay();
      return;
    }

    this.showStep(step, session.activeStepIndex, data[MANUAL_KEY] === true);
  }

  private onClaim(claim: GuideMeClaim | null) {
    if (!claim || claim.stepIndex !== this.currentStepIndex || claim.frame === this.frame) return;
    this.stopWatching();
    this.removeActionDetection();
    this.destroyOverlay();
  }

  private showStep(step: Step, stepIndex: number, requiresManual: boolean) {
    this.removeActionDetection();
    this.destroyOverlay();
    this.stopWatching();
    this.currentStepIndex = stepIndex;

    if (step.action === 'navigate' && step.url && !requiresManual) {
      if (this.isTopFrame && document.visibilityState === 'visible') void this.followNavigateStep(step.url, stepIndex);
      return;
    }

    const meta = step.elementMeta;
    if (!meta || requiresManual) {
      if (this.isTopFrame) this.setBlocked(stepIndex);
      return;
    }

    let attempts = 0;
    const attach = () => {
      const { element } = findElement(meta);
      if (!element) {
        attempts += 1;
        if (attempts === MAX_RETRIES && this.isTopFrame) this.blockUnlessClaimed(stepIndex);
        return;
      }
      this.stopWatching();
      this.claim(stepIndex);
      this.overlay = new GuideMeOverlay();
      this.overlay.show(step.description, stepIndex + 1, element);
      this.setupActionDetection(step, element);
    };

    attach();
    if (!this.overlay) this.watchTimer = setInterval(attach, RETRY_INTERVAL_MS);
  }

  private async followNavigateStep(url: string, stepIndex: number) {
    this.claim(stepIndex);
    const data = await browser.storage.local.get([NAVIGATED_KEY]);
    if (this.currentStepIndex !== stepIndex) return;
    if (!isSamePage(window.location.href, url) && data[NAVIGATED_KEY] !== stepIndex) {
      await browser.storage.local.set({ [NAVIGATED_KEY]: stepIndex });
      window.location.assign(url);
      return;
    }
    this.advanceTimer = setTimeout(() => this.advanceStep(), NAVIGATE_PAUSE_MS);
  }

  private claim(stepIndex: number) {
    const claim: GuideMeClaim = { stepIndex, frame: this.frame };
    browser.storage.local
      .set({ [ATTACHED_KEY]: claim, [BLOCKED_KEY]: null })
      .catch((err) => logger.warn('Failed to claim guide me step', err));
  }

  private async blockUnlessClaimed(stepIndex: number) {
    const data = await browser.storage.local.get([ATTACHED_KEY]);
    const claim = data[ATTACHED_KEY] as GuideMeClaim | null;
    if (claim?.stepIndex === stepIndex || this.currentStepIndex !== stepIndex) return;
    this.setBlocked(stepIndex);
  }

  private setBlocked(stepIndex: number | null) {
    browser.storage.local
      .set({ [BLOCKED_KEY]: stepIndex })
      .catch((err) => logger.warn('Failed to flag guide me roadblock', err));
  }

  private stopWatching() {
    if (this.watchTimer) clearInterval(this.watchTimer);
    this.watchTimer = null;
  }

  private setupActionDetection(step: Step, target: HTMLElement) {
    this.currentTarget = target;

    if (step.action === 'input' && !step.inputValue) {
      this.clickHandler = () => this.advanceStep();
      this.clickEvent = 'change';
      target.addEventListener('change', this.clickHandler, { once: true });
      return;
    }

    if (step.action === 'input' && step.inputValue) {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const proto =
          target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(target, step.inputValue);
        else target.value = step.inputValue;
      } else if (target.getAttribute('contenteditable') !== null) {
        target.textContent = step.inputValue;
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      this.advanceTimer = setTimeout(() => this.advanceStep(), 500);
      return;
    }

    this.clickHandler = () => this.advanceStep();
    this.clickEvent = step.action === 'rightClick' ? 'contextmenu' : 'click';
    target.addEventListener(this.clickEvent, this.clickHandler, { once: true });
  }

  private advanceStep() {
    sendMessage('guideMeStepCompleted', { stepIndex: this.currentStepIndex }).catch((err) =>
      logger.warn('Failed to advance guide me step', err),
    );
  }

  private removeActionDetection() {
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    this.advanceTimer = null;
    if (this.clickHandler && this.currentTarget) {
      this.currentTarget.removeEventListener(this.clickEvent, this.clickHandler);
    }
    this.clickHandler = null;
    this.currentTarget = null;
  }

  private destroyOverlay() {
    this.overlay?.destroy();
    this.overlay = null;
  }
}
