// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { ElementMeta, Step } from '@/core/guides/types';
import { GuideMeController } from '../content';
import { ATTACHED_KEY, BLOCKED_KEY, MANUAL_KEY, SESSION_KEY, STEP_KEY } from '../session';

const meta: ElementMeta = {
  tag: 'button',
  cssSelector: '#none',
  textContent: 'Submit',
  ariaLabel: 'Submit form',
  placeholder: null,
  altText: null,
  name: null,
  role: null,
  href: null,
  inputType: null,
  dataTestId: null,
  rect: { x: 0, y: 0, width: 100, height: 40 },
  devicePixelRatio: 1,
};

const step = {
  id: 's1',
  guideId: 'g1',
  index: 0,
  description: 'Click Submit',
  action: 'click',
  url: '',
  timestamp: 0,
  elementMeta: meta,
} as Step;

function addTarget(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = 'Submit';
  btn.setAttribute('aria-label', 'Submit form');
  Object.defineProperty(btn, 'getBoundingClientRect', {
    value: () => ({ x: 0, y: 0, width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40 }),
  });
  document.body.appendChild(btn);
  return btn;
}

async function startSession() {
  await fakeBrowser.storage.local.set({
    [SESSION_KEY]: { guideId: 'g1', activeStepIndex: 0, totalSteps: 1, active: true },
    [STEP_KEY]: step,
    [MANUAL_KEY]: false,
    [BLOCKED_KEY]: null,
    [ATTACHED_KEY]: null,
  });
}

async function flush(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms);
}

describe('GuideMeController across frames', () => {
  const controllers: GuideMeController[] = [];
  const make = (isTop: boolean) => {
    const c = new GuideMeController(isTop);
    controllers.push(c);
    return c;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    fakeBrowser.reset();
    Element.prototype.scrollIntoView = () => {};
    await startSession();
  });

  afterEach(() => {
    for (const c of controllers.splice(0)) c.dispose();
    document.body.innerHTML = '';
    for (const el of document.querySelectorAll('ditto-guideme')) el.remove();
    vi.useRealTimers();
  });

  it('runs in a child frame and claims the step when it finds the element', async () => {
    addTarget();
    make(false);
    await flush();

    const data = await fakeBrowser.storage.local.get([ATTACHED_KEY, BLOCKED_KEY]);
    expect(data[ATTACHED_KEY]).toMatchObject({ stepIndex: 0 });
    expect(data[BLOCKED_KEY] ?? null).toBeNull();
    expect(document.querySelector('ditto-guideme')).not.toBeNull();
  });

  it('never marks a step blocked from a child frame', async () => {
    make(false);
    await flush(10_000);
    const data = await fakeBrowser.storage.local.get([BLOCKED_KEY]);
    expect(data[BLOCKED_KEY] ?? null).toBeNull();
  });

  it('marks the step blocked from the top frame when no frame claims it', async () => {
    make(true);
    await flush(6_000);
    const data = await fakeBrowser.storage.local.get([BLOCKED_KEY]);
    expect(data[BLOCKED_KEY]).toBe(0);
  });

  it('does not block from the top frame once another frame has claimed the step', async () => {
    make(true);
    await flush(1_000);
    await fakeBrowser.storage.local.set({ [ATTACHED_KEY]: { stepIndex: 0, frame: 'child' } });
    await flush(10_000);
    const data = await fakeBrowser.storage.local.get([BLOCKED_KEY]);
    expect(data[BLOCKED_KEY] ?? null).toBeNull();
  });

  it('stands down when another frame claims the step it is showing', async () => {
    addTarget();
    make(false);
    await flush(1_000);
    expect(document.querySelector('ditto-guideme')).not.toBeNull();

    await fakeBrowser.storage.local.set({ [ATTACHED_KEY]: { stepIndex: 0, frame: 'other' } });
    await flush();
    expect(document.querySelector('ditto-guideme')).toBeNull();
  });
});
