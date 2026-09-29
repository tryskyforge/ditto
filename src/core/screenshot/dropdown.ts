import type { DropdownPanel, Screenshot, ScreenshotBounds } from '@/core/guides/types';
import { type Ctx, drawRoundedRect } from './draw';

export type DropdownSource = Pick<Screenshot, 'bounds' | 'pixelRatio' | 'width' | 'height' | 'dropdown'>;

const ROW_RATIO = 1.6;
const PAD_X_RATIO = 0.8;
const PAD_Y_RATIO = 0.25;
const CHAR_RATIO = 0.52;
const SCROLLBAR_RATIO = 0.9;
const MAX_WIDTH_RATIO = 0.8;
const GAP = 2;
const RADIUS = 4;
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function metrics(panel: DropdownPanel, dpr: number) {
  const fs = panel.fontSize * dpr;
  return {
    fs,
    rowH: Math.round(fs * ROW_RATIO),
    padX: Math.round(fs * PAD_X_RATIO),
    padY: Math.round(fs * PAD_Y_RATIO),
    scrollW: panel.total > panel.rows.length ? Math.round(fs * SCROLLBAR_RATIO) : 0,
  };
}

export function dropdownRect(source: DropdownSource): ScreenshotBounds | null {
  const { bounds, dropdown } = source;
  if (!dropdown || dropdown.rows.length === 0 || !bounds || !(bounds.width > 0) || !(bounds.height > 0)) return null;

  const dpr = source.pixelRatio || 1;
  const m = metrics(dropdown, dpr);
  const selectX = bounds.x * dpr;
  const selectY = bounds.y * dpr;
  const selectW = bounds.width * dpr;
  const selectH = bounds.height * dpr;

  const height = dropdown.rows.length * m.rowH + 2 * m.padY;
  const longest = dropdown.rows.reduce((max, row) => Math.max(max, row.label.length), 0);
  const wanted = longest * m.fs * CHAR_RATIO + 2 * m.padX + m.scrollW;
  const width = Math.min(Math.max(selectW, wanted), Math.max(selectW, source.width * MAX_WIDTH_RATIO));

  const gap = GAP * dpr;
  const x = Math.min(Math.max(selectX, 0), Math.max(source.width - width, 0));
  const below = selectY + selectH + gap;
  const above = selectY - height - gap;
  const y = below + height <= source.height || above < 0 ? below : above;

  return { x, y: Math.min(Math.max(y, 0), Math.max(source.height - height, 0)), width, height };
}

function fitText(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end--;
  return `${text.slice(0, end)}…`;
}

export function drawDropdown(ctx: Ctx, source: DropdownSource) {
  const rect = dropdownRect(source);
  const panel = source.dropdown;
  if (!rect || !panel) return;

  const dpr = source.pixelRatio || 1;
  const m = metrics(panel, dpr);
  const radius = RADIUS * dpr;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 10 * dpr;
  ctx.shadowOffsetY = 2 * dpr;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.clip();

  ctx.textBaseline = 'middle';
  const textWidth = rect.width - 2 * m.padX - m.scrollW;
  panel.rows.forEach((row, i) => {
    const top = rect.y + m.padY + i * m.rowH;
    if (row.selected) {
      ctx.fillStyle = '#dbe7fb';
      ctx.fillRect(rect.x, top, rect.width, m.rowH);
    }
    if (!row.label) return;
    ctx.font = `${row.header ? 700 : 400} ${m.fs}px ${FONT_STACK}`;
    ctx.fillStyle = row.disabled ? '#8d8d8d' : '#1f1f1f';
    ctx.fillText(fitText(ctx, row.label, textWidth), rect.x + m.padX, top + m.rowH / 2);
  });

  if (m.scrollW > 0) {
    const track = rect.height - 2 * m.padY;
    const thumbH = Math.max(m.rowH, (track * panel.rows.length) / panel.total);
    const thumbY = rect.y + m.padY + (track * panel.start) / panel.total;
    const thumbW = Math.max(2, Math.round(m.scrollW * 0.35));
    ctx.fillStyle = '#c1c1c1';
    drawRoundedRect(ctx, rect.x + rect.width - m.scrollW / 2 - thumbW / 2, thumbY, thumbW, thumbH, thumbW / 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = Math.max(1, dpr);
  ctx.strokeStyle = '#c4c4c4';
  drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.stroke();
  ctx.restore();
}
