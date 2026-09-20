// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMessage } from '@/lib/messaging';
import { extractDOMContext } from '../../dom/context';
import { isRedactedField } from '../../dom/element-utils';
import { InputSession } from '../input-session';

vi.mock('@/lib/messaging', () => ({ sendMessage: vi.fn(), onMessage: vi.fn() }));

function blurredInput(value: string): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  el.value = value;
  el.setAttribute('aria-label', 'API key');
  el.setAttribute('data-ditto-blur', 'input');
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.mocked(sendMessage).mockReset();
  vi.mocked(sendMessage).mockResolvedValue({ stepId: 'step-1' } as never);
});

describe('isRedactedField', () => {
  it('reports a field the scanner blurred', () => {
    expect(isRedactedField(blurredInput('sk-live-1'))).toBe(true);
  });

  it('reports a field inside a manually blurred container', () => {
    const box = document.createElement('div');
    box.setAttribute('data-ditto-blur', 'manual');
    const el = document.createElement('input');
    box.appendChild(el);
    document.body.appendChild(box);
    expect(isRedactedField(el)).toBe(true);
  });

  it('does not report an unblurred field', () => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    expect(isRedactedField(el)).toBe(false);
  });
});

describe('DOM context sent to the AI', () => {
  it('masks a blurred value', () => {
    const el = blurredInput('sk-live-abcdef');
    expect(extractDOMContext(el, 'input').target.value).toBe('***');
  });

  it('still carries an unblurred value', () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = 'ada@example.com';
    document.body.appendChild(el);
    expect(extractDOMContext(el, 'input').target.value).toBe('value=ada@example.com');
  });
});

describe('InputSession.update on a blurred field', () => {
  it('stores no value and keeps it out of the description', async () => {
    const el = blurredInput('sk-live-abcdef');
    const session = new InputSession('guide-1');
    await session.start(el);
    vi.mocked(sendMessage).mockClear();

    session.update(el);

    const [, payload] = vi.mocked(sendMessage).mock.calls[0];
    expect(payload).not.toHaveProperty('inputValue');
    expect(JSON.stringify(payload)).not.toContain('sk-live-abcdef');
  });

  it('still stores the value for an unblurred field', async () => {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = 'ada';
    el.setAttribute('aria-label', 'Name');
    document.body.appendChild(el);
    const session = new InputSession('guide-1');
    await session.start(el);
    vi.mocked(sendMessage).mockClear();

    session.update(el);

    const [, payload] = vi.mocked(sendMessage).mock.calls[0];
    expect(payload).toMatchObject({ inputValue: 'ada' });
  });
});
