// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { sendMessage } from '@/lib/messaging';

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn().mockResolvedValue({}) }));

import type { ElementMeta, Step } from '@/core/guides/types';
import { GuideMeController, isSamePage } from '../content';
import { ATTACHED_KEY, BLOCKED_KEY, MANUAL_KEY, NAVIGATED_KEY, SESSION_KEY, STEP_KEY } from '../session';

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

describe('GuideMeController on right-click steps', () => {
  const controllers: GuideMeController[] = [];

  beforeEach(async () => {
    vi.useFakeTimers();
    fakeBrowser.reset();
    Element.prototype.scrollIntoView = () => {};
    await fakeBrowser.storage.local.set({
      [SESSION_KEY]: { guideId: 'g1', activeStepIndex: 0, totalSteps: 1, active: true },
      [STEP_KEY]: { ...step, action: 'rightClick' },
      [MANUAL_KEY]: false,
      [BLOCKED_KEY]: null,
      [ATTACHED_KEY]: null,
    });
  });

  afterEach(() => {
    for (const c of controllers.splice(0)) c.dispose();
    document.body.innerHTML = '';
    for (const el of document.querySelectorAll('ditto-guideme')) el.remove();
    vi.useRealTimers();
  });

  it('advances on a right-click, not on a left click', async () => {
    const target = addTarget();
    const c = new GuideMeController(true);
    controllers.push(c);
    await vi.advanceTimersByTimeAsync(0);

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);
    expect(sendMessage).not.toHaveBeenCalledWith('guideMeStepCompleted', { stepIndex: 0 });

    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);
    expect(sendMessage).toHaveBeenCalledWith('guideMeStepCompleted', { stepIndex: 0 });
  });
});

describe('isSamePage', () => {
  it('matches the same origin and path, ignoring query, hash and a trailing slash', () => {
    expect(isSamePage('https://a.com/x/?q=1#h', 'https://a.com/x')).toBe(true);
  });

  it('does not match another path or origin', () => {
    expect(isSamePage('https://a.com/x', 'https://a.com/y')).toBe(false);
    expect(isSamePage('https://a.com/x', 'https://b.com/x')).toBe(false);
  });
});

describe('GuideMeController on Go-to steps', () => {
  const controllers: GuideMeController[] = [];
  const make = (isTop: boolean) => {
    const c = new GuideMeController(isTop);
    controllers.push(c);
    return c;
  };

  async function startGoTo(url: string, navigated: number | null = null) {
    await fakeBrowser.storage.local.set({
      [SESSION_KEY]: { guideId: 'g1', activeStepIndex: 0, totalSteps: 2, active: true },
      [STEP_KEY]: { ...step, action: 'navigate', description: 'Go to example.com', url, elementMeta: undefined },
      [MANUAL_KEY]: false,
      [BLOCKED_KEY]: null,
      [ATTACHED_KEY]: null,
      [NAVIGATED_KEY]: navigated,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    fakeBrowser.reset();
    vi.mocked(sendMessage).mockClear();
  });

  afterEach(() => {
    for (const c of controllers.splice(0)) c.dispose();
    vi.useRealTimers();
  });

  const completed = () => vi.mocked(sendMessage).mock.calls.filter(([name]) => name === 'guideMeStepCompleted');

  it('advances when the tab is already on the page', async () => {
    await startGoTo(window.location.href);
    make(true);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(completed()).toHaveLength(1);
    const data = await fakeBrowser.storage.local.get([BLOCKED_KEY]);
    expect(data[BLOCKED_KEY] ?? null).toBeNull();
  });

  it('advances instead of navigating again after a redirect', async () => {
    await startGoTo('https://example.com/start', 0);
    make(true);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(completed()).toHaveLength(1);
  });

  it('leaves Go-to steps to the top frame', async () => {
    await startGoTo(window.location.href);
    make(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(completed()).toHaveLength(0);
    const data = await fakeBrowser.storage.local.get([BLOCKED_KEY]);
    expect(data[BLOCKED_KEY] ?? null).toBeNull();
  });
});
