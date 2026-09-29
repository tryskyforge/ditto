// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForOpenPanel } from '../panel-wait';

function withRect<T extends HTMLElement>(el: T, height = 40): T {
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ x: 0, y: 0, top: 0, left: 0, right: 100, bottom: height, width: 100, height }),
  });
  return el;
}

function panel(role = 'listbox'): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('role', role);
  withRect(el);
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('waitForOpenPanel', () => {
  it('returns once a panel has stayed open for a few polls', async () => {
    let resolved = false;
    const done = waitForOpenPanel().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(40);
    panel();
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(200);
    await done;
    expect(resolved).toBe(true);
  });

  it('gives up after its bounded timeout when nothing ever opens', async () => {
    let resolved = false;
    const done = waitForOpenPanel().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    await done;
    expect(resolved).toBe(true);
  });

  it('resets its streak if the panel flickers away before settling', async () => {
    let resolved = false;
    const done = waitForOpenPanel().then(() => {
      resolved = true;
    });

    const el = panel();
    await vi.advanceTimersByTimeAsync(80);
    el.remove();
    await vi.advanceTimersByTimeAsync(80);
    panel();

    await vi.advanceTimersByTimeAsync(80);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(80);
    await done;
    expect(resolved).toBe(true);
  });

  it('ignores a panel with zero height', async () => {
    let resolved = false;
    const done = waitForOpenPanel().then(() => {
      resolved = true;
    });

    const zero = document.createElement('div');
    zero.setAttribute('role', 'menu');
    withRect(zero, 0);
    document.body.appendChild(zero);

    await vi.advanceTimersByTimeAsync(1000);
    await done;
    expect(resolved).toBe(true);
  });
});
