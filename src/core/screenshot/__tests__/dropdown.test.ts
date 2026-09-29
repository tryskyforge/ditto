import { describe, expect, it } from 'vitest';
import type { DropdownPanel, Screenshot } from '@/core/guides/types';
import type { Ctx } from '@/core/screenshot/draw';
import { drawDropdown, dropdownRect } from '@/core/screenshot/dropdown';
import { resolveViewport } from '@/core/screenshot/geometry';

function panel(labels: string[], over: Partial<DropdownPanel> = {}): DropdownPanel {
  return {
    rows: labels.map((label, i) => ({ label, ...(i === 0 ? { selected: true } : {}) })),
    start: 0,
    total: labels.length,
    fontSize: 10,
    ...over,
  };
}

function shot(over: Partial<Screenshot> = {}): Screenshot {
  return {
    id: 's',
    stepId: 'st',
    blob: new Blob(['x']),
    mimeType: 'image/png',
    width: 1000,
    height: 800,
    pixelRatio: 1,
    bounds: { x: 100, y: 100, width: 200, height: 20 },
    dropdown: panel(['One', 'Two', 'Three']),
    ...over,
  };
}

describe('dropdownRect', () => {
  it('opens below the select at the same left edge and at least as wide', () => {
    const rect = dropdownRect(shot());

    expect(rect?.x).toBe(100);
    expect(rect?.y).toBeGreaterThan(120);
    expect(rect?.width).toBeGreaterThanOrEqual(200);
  });

  it('is as tall as its rows and widens for long labels', () => {
    const short = dropdownRect(shot());
    const tall = dropdownRect(shot({ dropdown: panel(['A', 'B', 'C', 'D', 'E', 'F']) }));
    const wide = dropdownRect(shot({ dropdown: panel(['A very long option label that overflows the select']) }));

    expect(tall?.height).toBeGreaterThan(short?.height ?? 0);
    expect(wide?.width).toBeGreaterThan(200);
  });

  it('flips above the select when there is no room below', () => {
    const rect = dropdownRect(shot({ bounds: { x: 100, y: 770, width: 200, height: 20 } }));

    expect(rect && rect.y + rect.height).toBeLessThanOrEqual(770);
  });

  it('stays inside the image when the select sits at the right edge', () => {
    const rect = dropdownRect(shot({ bounds: { x: 900, y: 100, width: 100, height: 20 } }));

    expect(rect && rect.x + rect.width).toBeLessThanOrEqual(1000);
  });

  it('scales with the device pixel ratio', () => {
    const one = dropdownRect(shot());
    const two = dropdownRect(shot({ pixelRatio: 2, width: 2000, height: 1600 }));

    expect(two?.height).toBeCloseTo((one?.height ?? 0) * 2, -1);
  });

  it('is absent without a dropdown, bounds, or rows', () => {
    expect(dropdownRect(shot({ dropdown: undefined }))).toBeNull();
    expect(dropdownRect(shot({ bounds: undefined }))).toBeNull();
    expect(dropdownRect(shot({ dropdown: panel([]) }))).toBeNull();
  });
});

describe('resolveViewport with a dropdown', () => {
  it('frames the list as well as the select', () => {
    const s = shot({
      bounds: { x: 400, y: 100, width: 120, height: 20 },
      dropdown: panel(Array(12).fill('Option'), { fontSize: 20 }),
    });
    const view = resolveViewport(s);
    const list = dropdownRect(s);

    expect(list).not.toBeNull();
    expect(view.y + view.height).toBeGreaterThanOrEqual((list?.y ?? 0) + (list?.height ?? 0));
    expect(view.y).toBeLessThanOrEqual(100);
  });

  it('frames the select alone, as before, when there is no dropdown', () => {
    expect(resolveViewport(shot({ dropdown: undefined }))).toEqual({ x: 0, y: 0, width: 500, height: 400 });
  });

  it('respects an explicit viewport', () => {
    const edits = { viewport: { x: 0, y: 0, width: 300, height: 300 } };

    expect(resolveViewport(shot({ edits }))).toEqual(edits.viewport);
  });
});

function recorder() {
  const texts: string[] = [];
  const fills: unknown[][] = [];
  const state: Record<string, unknown> = {};
  const ctx = new Proxy(
    {
      measureText: (t: string) => ({ width: t.length * 6 }),
      fillText: (t: string) => texts.push(t),
      fillRect: (...a: unknown[]) => fills.push(a),
    } as Record<string, unknown>,
    {
      get: (target, prop: string) => target[prop] ?? state[prop] ?? (() => {}),
      set: (_target, prop: string, value) => {
        state[prop] = value;
        return true;
      },
    },
  );
  return { ctx: ctx as unknown as Ctx, texts, fills, state };
}

describe('drawDropdown', () => {
  it('paints one row per option and highlights only the selected one', () => {
    const r = recorder();
    drawDropdown(r.ctx, shot({ dropdown: panel(['One', 'Two', 'Three']) }));

    expect(r.texts).toEqual(['One', 'Two', 'Three']);
    expect(r.fills).toHaveLength(1);
  });

  it('shortens a label that does not fit the list', () => {
    const r = recorder();
    drawDropdown(r.ctx, shot({ dropdown: panel(['x'.repeat(200)]) }));

    expect(r.texts[0].endsWith('…')).toBe(true);
    expect(r.texts[0].length).toBeLessThan(200);
  });

  it('skips blank labels but still leaves the row', () => {
    const r = recorder();
    drawDropdown(r.ctx, shot({ dropdown: panel(['', 'Two']) }));

    expect(r.texts).toEqual(['Two']);
  });

  it('draws nothing without a dropdown', () => {
    const r = recorder();
    drawDropdown(r.ctx, shot({ dropdown: undefined }));

    expect(r.texts).toEqual([]);
    expect(r.fills).toEqual([]);
  });
});
