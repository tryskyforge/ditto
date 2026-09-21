const ELEMENT_TAG = 'ditto-guideme';
const PAD = 6;

const STYLES = `
  :host {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
    font-family: 'Poppins', system-ui, sans-serif;
  }

  .highlight {
    position: fixed;
    border: 2px solid #3D6B47;
    border-radius: 4px;
    box-shadow: 0 0 0 3px rgba(61, 107, 71, 0.15), 0 0 12px rgba(61, 107, 71, 0.2);
    pointer-events: none;
    transition: all 0.3s ease;
  }

  .label {
    position: fixed;
    background: white;
    border-radius: 10px;
    padding: 10px 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 320px;
    pointer-events: none;
  }

  .label .num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #23362B;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #CFE0C8;
    flex-shrink: 0;
  }

  .label .text {
    font-size: 12px;
    font-weight: 600;
    color: #23362B;
    line-height: 1.35;
  }
`;

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export class GuideMeOverlay {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private highlightEl: HTMLDivElement | null = null;
  private labelEl: HTMLDivElement | null = null;
  private currentTarget: HTMLElement | null = null;
  private frameRequest: number | null = null;
  private lastRect = '';

  constructor() {
    this.host = document.createElement(ELEMENT_TAG);
    this.host.setAttribute('data-ditto-ignore', '');
    this.shadow = this.host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    document.documentElement.appendChild(this.host);
  }

  show(description: string, stepNumber: number, targetElement: HTMLElement | null): void {
    this.cleanup();
    this.currentTarget = targetElement;

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.render(description, stepNumber, targetElement), 400);
    }
  }

  private render(description: string, stepNumber: number, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();

    this.highlightEl = document.createElement('div');
    this.highlightEl.className = 'highlight';
    this.positionHighlight(rect);
    this.shadow.appendChild(this.highlightEl);

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'label';
    this.labelEl.innerHTML = `<span class="num">${stepNumber}</span><span class="text">${escapeHtml(description)}</span>`;
    this.shadow.appendChild(this.labelEl);
    this.positionLabel(rect);

    this.track();
  }

  private track(): void {
    this.reposition();
    this.frameRequest = requestAnimationFrame(() => this.track());
  }

  private positionHighlight(rect: DOMRect): void {
    if (!this.highlightEl) return;
    this.highlightEl.style.left = `${rect.left - PAD}px`;
    this.highlightEl.style.top = `${rect.top - PAD}px`;
    this.highlightEl.style.width = `${rect.width + PAD * 2}px`;
    this.highlightEl.style.height = `${rect.height + PAD * 2}px`;
  }

  private positionLabel(rect: DOMRect): void {
    if (!this.labelEl) return;
    const gap = 10;
    const labelRect = this.labelEl.getBoundingClientRect();
    const belowY = rect.bottom + PAD + gap;
    const aboveY = rect.top - PAD - gap - labelRect.height;
    const leftX = Math.max(8, Math.min(rect.left, window.innerWidth - labelRect.width - 8));

    if (belowY + labelRect.height < window.innerHeight) {
      this.labelEl.style.top = `${belowY}px`;
      this.labelEl.style.left = `${leftX}px`;
    } else if (aboveY > 0) {
      this.labelEl.style.top = `${aboveY}px`;
      this.labelEl.style.left = `${leftX}px`;
    } else {
      this.labelEl.style.top = `${rect.top}px`;
      this.labelEl.style.left = `${rect.right + PAD + gap}px`;
    }
  }

  private reposition(): void {
    if (!this.currentTarget) return;
    const rect = this.currentTarget.getBoundingClientRect();
    const key = `${rect.left},${rect.top},${rect.width},${rect.height},${window.innerWidth},${window.innerHeight}`;
    if (key === this.lastRect) return;
    this.lastRect = key;
    this.positionHighlight(rect);
    this.positionLabel(rect);
  }

  private cleanup(): void {
    if (this.frameRequest !== null) cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
    this.lastRect = '';
    this.highlightEl?.remove();
    this.highlightEl = null;
    this.labelEl?.remove();
    this.labelEl = null;
  }

  destroy(): void {
    this.cleanup();
    this.host.remove();
  }
}
