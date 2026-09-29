// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { extractElementMeta } from '@/core/capture/dom/element-meta';

function withRect(el: HTMLElement, rect: { x: number; y: number; width: number; height: number }) {
  el.getBoundingClientRect = () => ({ ...rect, top: rect.y, left: rect.x, right: 0, bottom: 0, toJSON: () => ({}) });
  return el;
}

function menuItem(): HTMLElement {
  const el = document.createElement('button');
  el.textContent = 'Copy link';
  document.body.appendChild(el);
  return el;
}

describe('extractElementMeta', () => {
  it('measures the element when nothing was frozen at event time', () => {
    const el = withRect(menuItem(), { x: 12, y: 34, width: 100, height: 20 });
    expect(extractElementMeta(el).rect).toEqual({ x: 12, y: 34, width: 100, height: 20 });
  });

  it('prefers the live measurement while the element is still laid out', () => {
    const el = withRect(menuItem(), { x: 12, y: 34, width: 100, height: 20 });
    const stale = { x: 999, y: 999, width: 5, height: 5 };
    expect(extractElementMeta(el, stale).rect).toEqual({ x: 12, y: 34, width: 100, height: 20 });
  });

  it('falls back to the click-time rect once the element leaves the layout', () => {
    const el = withRect(menuItem(), { x: 12, y: 34, width: 100, height: 20 });
    const atClick = { x: 12, y: 34, width: 100, height: 20 };
    withRect(el, { x: 0, y: 0, width: 0, height: 0 });
    el.remove();
    expect(extractElementMeta(el, atClick).rect).toEqual(atClick);
  });

  it('still reports a degenerate rect when there is nothing better to offer', () => {
    const el = withRect(menuItem(), { x: 0, y: 0, width: 0, height: 0 });
    expect(extractElementMeta(el).rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('keeps reading the label off a detached element, which needs no layout', () => {
    const el = withRect(menuItem(), { x: 0, y: 0, width: 0, height: 0 });
    el.setAttribute('aria-label', 'Copy link');
    el.remove();
    const meta = extractElementMeta(el, { x: 12, y: 34, width: 100, height: 20 });
    expect(meta.ariaLabel).toBe('Copy link');
    expect(meta.rect).toEqual({ x: 12, y: 34, width: 100, height: 20 });
  });

  describe('a native <select>', () => {
    function selectWithLabel(labelText: string, id = 'state'): HTMLSelectElement {
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = labelText;
      const select = document.createElement('select');
      select.id = id;
      for (const text of ['New', 'In Progress', 'On Hold']) {
        const option = document.createElement('option');
        option.value = text;
        option.textContent = text;
        select.appendChild(option);
      }
      document.body.appendChild(label);
      document.body.appendChild(select);
      return select;
    }

    it("uses the field's own label, not the currently selected option's text", () => {
      const select = selectWithLabel('State', 'state-1');
      select.value = 'New';
      const meta = extractElementMeta(select);
      expect(meta.textContent).toBe('State');
    });

    it('stays on the label even after a later option is selected', () => {
      const select = selectWithLabel('On hold reason', 'state-2');
      select.value = 'On Hold';
      const meta = extractElementMeta(select);
      expect(meta.textContent).toBe('On hold reason');
    });

    it('falls back to null, not the selected option, when no label can be found', () => {
      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = '-- None --';
      option.textContent = '-- None --';
      select.appendChild(option);
      document.body.appendChild(select);
      const meta = extractElementMeta(select);
      expect(meta.textContent).toBeNull();
    });

    it('prefers an explicit aria-label over an associated <label>', () => {
      const select = selectWithLabel('State');
      select.setAttribute('aria-label', 'Incident state');
      const meta = extractElementMeta(select);
      expect(meta.textContent).toBe('Incident state');
    });
  });
});
