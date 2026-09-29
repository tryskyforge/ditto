// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DROPDOWN_MAX_ROWS, extractDropdown } from '@/core/capture/dom/dropdown';
import { extractElementMeta } from '@/core/capture/dom/element-meta';

function select(labels: string[], selectedAt = 0, attrs: Record<string, string> = {}): HTMLSelectElement {
  const el = document.createElement('select');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const label of labels) {
    const option = document.createElement('option');
    option.textContent = label;
    el.appendChild(option);
  }
  el.selectedIndex = selectedAt;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('extractDropdown', () => {
  it('lists every option and marks the selected one', () => {
    const panel = extractDropdown(select(['-- None --', 'New', 'In Progress', 'Resolved'], 2));

    expect(panel?.rows.map((r) => r.label)).toEqual(['-- None --', 'New', 'In Progress', 'Resolved']);
    expect(panel?.rows.filter((r) => r.selected).map((r) => r.label)).toEqual(['In Progress']);
    expect(panel).toMatchObject({ start: 0, total: 4 });
  });

  it('marks disabled options and keeps optgroup titles as header rows', () => {
    const el = document.createElement('select');
    el.innerHTML =
      '<optgroup label="Open"><option>New</option><option disabled>Held</option></optgroup>' +
      '<optgroup label="Closed" disabled><option>Done</option></optgroup>';
    document.body.appendChild(el);

    const rows = extractDropdown(el)?.rows;

    expect(rows).toEqual([
      { label: 'Open', header: true, disabled: true },
      { label: 'New', selected: true },
      { label: 'Held', disabled: true },
      { label: 'Closed', header: true, disabled: true },
      { label: 'Done', disabled: true },
    ]);
  });

  it('skips hidden options and collapses whitespace in labels', () => {
    const el = document.createElement('select');
    el.innerHTML = '<option>  Two   words </option><option hidden>Secret</option><option>Last</option>';
    document.body.appendChild(el);

    expect(extractDropdown(el)?.rows.map((r) => r.label)).toEqual(['Two words', 'Last']);
  });

  it('windows a long list around the selected option and reports where it sits', () => {
    const labels = Array.from({ length: 50 }, (_, i) => `Country ${i}`);
    const panel = extractDropdown(select(labels, 20));

    expect(panel?.rows).toHaveLength(DROPDOWN_MAX_ROWS);
    expect(panel?.rows.some((r) => r.selected && r.label === 'Country 20')).toBe(true);
    expect(panel).toMatchObject({ start: 16, total: 50 });
  });

  it('shows the end of the list when the selection is near it', () => {
    const labels = Array.from({ length: 50 }, (_, i) => `Country ${i}`);
    const panel = extractDropdown(select(labels, 49));

    expect(panel?.start).toBe(50 - DROPDOWN_MAX_ROWS);
    expect(panel?.rows.at(-1)?.label).toBe('Country 49');
  });

  it('leaves out list boxes, which the page already renders open', () => {
    expect(extractDropdown(select(['a', 'b'], 0, { multiple: '' }))).toBeUndefined();
    expect(extractDropdown(select(['a', 'b'], 0, { size: '4' }))).toBeUndefined();
  });

  it('never reads the options of a redacted field', () => {
    const wrap = document.createElement('div');
    wrap.setAttribute('data-ditto-blur', '');
    const el = select(['Alice Smith', 'Bob Jones']);
    wrap.appendChild(el);
    document.body.appendChild(wrap);

    expect(extractDropdown(el)).toBeUndefined();
  });

  it('returns nothing for a select with no options', () => {
    expect(extractDropdown(select([]))).toBeUndefined();
  });
});

describe('extractElementMeta and dropdowns', () => {
  it('carries the option list for a select', () => {
    const meta = extractElementMeta(select(['One', 'Two'], 1));

    expect(meta.dropdown?.rows.map((r) => r.label)).toEqual(['One', 'Two']);
  });

  it('adds no dropdown key for other elements', () => {
    const button = document.createElement('button');
    button.textContent = 'Save';
    document.body.appendChild(button);

    expect('dropdown' in extractElementMeta(button)).toBe(false);
  });
});
