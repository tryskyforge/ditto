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

function withRect<T extends HTMLElement>(el: T): T {
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ x: 4, y: 6, top: 6, left: 4, right: 204, bottom: 36, width: 200, height: 30 }),
  });
  document.body.appendChild(el);
  return el;
}

function referenceField(): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  el.setAttribute('role', 'combobox');
  el.setAttribute('aria-haspopup', 'listbox');
  el.setAttribute('aria-label', 'Assigned to');
  return withRect(el);
}

function choiceListTrigger(): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('role', 'combobox');
  el.setAttribute('aria-haspopup', 'listbox');
  el.textContent = 'State';
  return withRect(el);
}

function plainButton(): HTMLButtonElement {
  const el = document.createElement('button');
  el.textContent = 'Save';
  return withRect(el);
}

function openListbox(): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('role', 'listbox');
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ x: 0, y: 40, top: 40, left: 0, right: 200, bottom: 200, width: 200, height: 160 }),
  });
  document.body.appendChild(el);
  return el;
}

function userClick(el: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 10, clientY: 20 });
  Object.defineProperty(event, 'isTrusted', { configurable: true, value: true });
  el.dispatchEvent(event);
}

const calls = (type: string) =>
  vi.mocked(sendMessage).mock.calls.filter(([name]) => name === type) as unknown as Array<
    [string, Record<string, unknown>]
  >;

async function settle(turns = 40) {
  for (let i = 0; i < turns; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = '';
  nextStep = 0;
  vi.mocked(sendMessage).mockReset();
  vi.mocked(sendMessage).mockImplementation(((name: string) =>
    Promise.resolve(name === 'captureStep' ? { stepId: `step-${++nextStep}` } : {})) as unknown as typeof sendMessage);
});

afterEach(() => {
  handle?.stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('async panels on reference and choice fields', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      setTimeout(() => cb(0), 0);
      return 0;
    });
    handle = startCapture('guide-1');
  });

  it('waits for a reference field lookup panel that opens after a server round trip', async () => {
    const field = referenceField();
    userClick(field);
    await vi.advanceTimersByTimeAsync(0); // the 3-frame paint wait lands instantly with the stub above

    expect(calls('captureStep')).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(200); // simulated network delay before the list arrives
    openListbox();
    await vi.advanceTimersByTimeAsync(200);

    expect(calls('captureStep')).toHaveLength(1);
  });

  it('waits for a custom choice-list panel that opens on the next render tick', async () => {
    const trigger = choiceListTrigger();
    userClick(trigger);
    await vi.advanceTimersByTimeAsync(0);
    openListbox();

    await vi.advanceTimersByTimeAsync(200);
    expect(calls('captureStep')).toHaveLength(1);
  });

  it('still proceeds, after its bounded timeout, when the field never opens a panel', async () => {
    const field = referenceField();
    userClick(field);

    await vi.advanceTimersByTimeAsync(2000);
    expect(calls('captureStep')).toHaveLength(1);
  });
});

describe('ordinary fields with no aria-haspopup', () => {
  beforeEach(() => {
    handle = startCapture('guide-1');
  });

  it('adds no delay for an ordinary click', async () => {
    userClick(plainButton());
    await settle();

    expect(calls('captureStep')).toHaveLength(1);
  });

  it('adds no delay for an ordinary text field', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    withRect(input);
    userClick(input);
    await settle();

    expect(calls('captureStep')).toHaveLength(1);
  });
});
