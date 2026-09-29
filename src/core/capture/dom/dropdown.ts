import type { DropdownPanel, DropdownRow } from '@/core/guides/types';
import { isRedactedField } from './element-utils';

export const DROPDOWN_MAX_ROWS = 12;
const LEADING_ROWS = 4;
const LABEL_MAX = 80;
const DEFAULT_FONT_SIZE = 13.333;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, LABEL_MAX);
}

export function extractDropdown(select: HTMLSelectElement): DropdownPanel | undefined {
  if (select.multiple || select.size > 1 || isRedactedField(select)) return undefined;

  const all: DropdownRow[] = [];
  for (const el of Array.from(select.querySelectorAll('option, optgroup'))) {
    if (el instanceof HTMLOptGroupElement) {
      all.push({ label: clean(el.label), header: true, disabled: true });
      continue;
    }
    if (!(el instanceof HTMLOptionElement) || el.hidden) continue;
    const row: DropdownRow = { label: clean(el.label || el.text) };
    if (el.selected) row.selected = true;
    if (el.disabled || el.closest('optgroup')?.disabled) row.disabled = true;
    all.push(row);
  }
  if (all.length === 0) return undefined;

  const selectedAt = Math.max(
    0,
    all.findIndex((row) => row.selected),
  );
  const start = Math.min(Math.max(selectedAt - LEADING_ROWS, 0), Math.max(all.length - DROPDOWN_MAX_ROWS, 0));

  return {
    rows: all.slice(start, start + DROPDOWN_MAX_ROWS),
    start,
    total: all.length,
    fontSize: Number.parseFloat(getComputedStyle(select).fontSize) || DEFAULT_FONT_SIZE,
  };
}
