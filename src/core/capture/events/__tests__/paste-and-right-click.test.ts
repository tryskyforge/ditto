// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMessage } from '@/lib/messaging';
import { type CaptureHandle, startCapture } from '../handlers';

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn(), onMessage: vi.fn() }));

vi.mock('@/lib/browser-api', () => ({
  localStorage: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) },
}));

let handle: CaptureHandle;
let nextStep: number;

function rect(el: Element) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ x: 4, y: 6, top: 6, left: 4, right: 204, bottom: 36, width: 200, height: 30 }),
  });
}

function field(type = 'password'): HTMLInputElement {
  const el = document.createElement('input');
  el.type = type;
  el.name = 'user_password';
  rect(el);
  document.body.appendChild(el);
  return el;
}

function mouse(el: Element, type: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 10, clientY: 20, ...init });
  Object.defineProperty(event, 'isTrusted', { configurable: true, value: true });
  el.dispatchEvent(event);
}

function paste(el: HTMLElement, text: string) {
  el.dispatchEvent(new Event('paste', { bubbles: true }));
  if (el instanceof HTMLInputElement) el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function settle(turns = 24) {
  for (let i = 0; i < turns; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

const calls = (name: string) =>
  vi.mocked(sendMessage).mock.calls.filter(([type]) => type === name) as unknown as Array<
    [string, Record<string, unknown>]
  >;

const captured = () => calls('captureStep').map(([, data]) => data.action);

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    setTimeout(() => cb(0), 0);
    return 0;
  });
  nextStep = 0;
  vi.mocked(sendMessage).mockClear();
  vi.mocked(sendMessage).mockImplementation((async (name: string) =>
    name === 'captureStep' ? { stepId: `step-${++nextStep}` } : {}) as unknown as typeof sendMessage);
  handle = startCapture('guide-1');
});

afterEach(() => {
  handle.stop();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('pasting into a field', () => {
  it('records one step, not a type step and a paste step', async () => {
    paste(field(), 'hunter2');
    await settle();

    expect(captured()).toEqual(['input']);
  });

  it('still records a paste outside an editable field', async () => {
    const box = document.createElement('div');
    rect(box);
    document.body.appendChild(box);
    box.dispatchEvent(new Event('paste', { bubbles: true }));
    await settle();

    expect(captured()).toEqual(['paste']);
  });

  it('keeps copy steps as they are', async () => {
    const input = field('text');
    input.dispatchEvent(new Event('copy', { bubbles: true }));
    await settle();

    expect(captured()).toEqual(['copy']);
  });
});

describe('right-clicking', () => {
  it('records a right-click step', async () => {
    const link = document.createElement('a');
    link.href = '/incident';
    link.textContent = 'INC0009009';
    rect(link);
    document.body.appendChild(link);

    mouse(link, 'contextmenu', { button: 2 });
    await settle();

    expect(captured()).toEqual(['rightClick']);
    expect(calls('captureStep')[0][1]).toMatchObject({
      elementMeta: expect.objectContaining({ clickPoint: { x: 10, y: 20 } }),
    });
  });

  it('does not record the right button twice when auxclick follows', async () => {
    const link = document.createElement('a');
    rect(link);
    document.body.appendChild(link);

    mouse(link, 'contextmenu', { button: 2 });
    mouse(link, 'auxclick', { button: 2 });
    await settle();

    expect(captured()).toEqual(['rightClick']);
  });

  it('still records a middle click', async () => {
    const link = document.createElement('a');
    rect(link);
    document.body.appendChild(link);

    mouse(link, 'auxclick', { button: 1 });
    await settle();

    expect(captured()).toEqual(['auxclick']);
  });
});
