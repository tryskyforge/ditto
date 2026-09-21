// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMessage } from '@/lib/messaging';
import { type CaptureHandle, startCapture } from '../handlers';

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn(), onMessage: vi.fn() }));

vi.mock('@/lib/browser-api', () => ({
  localStorage: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) },
}));

let releases: Array<() => void>;
let handle: CaptureHandle;
let nextStep: number;

function field(): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  el.setAttribute('aria-label', 'Short description');
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ x: 4, y: 6, top: 6, left: 4, right: 204, bottom: 36, width: 200, height: 30 }),
  });
  document.body.appendChild(el);
  return el;
}

function userClick(el: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 10, clientY: 20 });
  Object.defineProperty(event, 'isTrusted', { configurable: true, value: true });
  el.dispatchEvent(event);
}

function type(el: HTMLInputElement, text: string) {
  for (const ch of text) {
    el.value += ch;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

async function settle(turns = 24) {
  for (let i = 0; i < turns; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function releaseAll() {
  for (let round = 0; round < 5; round++) {
    await settle();
    for (const release of releases.splice(0)) release();
  }
  await settle();
}

const calls = (type: string) =>
  vi.mocked(sendMessage).mock.calls.filter(([name]) => name === type) as unknown as Array<
    [string, Record<string, unknown>]
  >;

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    setTimeout(() => cb(0), 0);
    return 0;
  });
  releases = [];
  nextStep = 0;
  vi.mocked(sendMessage).mockClear();
  vi.mocked(sendMessage).mockImplementation(((name: string) => {
    if (name !== 'captureStep') return Promise.resolve({});
    const stepId = `step-${++nextStep}`;
    return new Promise((resolve) => releases.push(() => resolve({ stepId })));
  }) as unknown as typeof sendMessage);
  handle = startCapture('guide-1');
});

afterEach(() => {
  handle.stop();
  for (const release of releases) release();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('input step start', () => {
  it('records one step when typing starts before the click has been captured', async () => {
    const input = field();
    userClick(input);
    type(input, 'hello');
    await releaseAll();

    expect(calls('captureStep')).toHaveLength(1);
    expect(calls('updateInputStep').at(-1)?.[1]).toMatchObject({ stepId: 'step-1', inputValue: 'hello' });
  });

  it('records one step for fast typing without a click', async () => {
    const input = field();
    type(input, 'hello');
    await releaseAll();

    expect(calls('captureStep')).toHaveLength(1);
    expect(calls('updateInputStep').at(-1)?.[1]).toMatchObject({ stepId: 'step-1', inputValue: 'hello' });
  });
});
