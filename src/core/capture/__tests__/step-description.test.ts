import { describe, expect, it } from 'vitest';
import type { ElementMeta } from '@/core/guides/types';
import { buildFallbackDescription } from '../step-description';

function makeMeta(overrides: Partial<ElementMeta> = {}): ElementMeta {
  return {
    tag: 'button',
    textContent: null,
    ariaLabel: null,
    placeholder: null,
    altText: null,
    name: null,
    role: null,
    href: null,
    inputType: null,
    cssSelector: 'button.submit',
    dataTestId: null,
    rect: { x: 0, y: 0, width: 0, height: 0 },
    devicePixelRatio: 1,
    ...overrides,
  };
}

describe('buildFallbackDescription', () => {
  it('generates click description using textContent', () => {
    const result = buildFallbackDescription('click', makeMeta({ textContent: 'Submit' }));
    expect(result).toBe('steps.click[Submit]');
  });

  it('generates click link description when href is present', () => {
    const result = buildFallbackDescription('click', makeMeta({ textContent: 'Home', href: '/home' }));
    expect(result).toBe('steps.clickLink[Home]');
  });

  it('generates checkbox toggle for input[type=checkbox]', () => {
    const result = buildFallbackDescription(
      'click',
      makeMeta({ tag: 'input', inputType: 'checkbox', ariaLabel: 'Accept terms' }),
    );
    expect(result).toBe('steps.toggleCheckbox[Accept terms]');
  });

  it('generates radio select for input[type=radio]', () => {
    const result = buildFallbackDescription(
      'click',
      makeMeta({ tag: 'input', inputType: 'radio', ariaLabel: 'Option A' }),
    );
    expect(result).toBe('steps.selectRadio[Option A]');
  });

  it('generates switch toggle for role=switch', () => {
    const result = buildFallbackDescription('click', makeMeta({ role: 'switch', ariaLabel: 'Dark mode' }));
    expect(result).toBe('steps.toggleSwitch[Dark mode]');
  });

  it('generates type description with input type', () => {
    const result = buildFallbackDescription('input', makeMeta({ inputType: 'email', placeholder: 'Email' }));
    expect(result).toBe('steps.typeIntoField[email,Email]');
  });

  it('generates generic type description without input type', () => {
    const result = buildFallbackDescription('input', makeMeta({ ariaLabel: 'Search' }));
    expect(result).toBe('steps.typeInto[Search]');
  });

  it('generates navigate description', () => {
    const result = buildFallbackDescription('navigate', makeMeta());
    expect(result).toBe('steps.navigate');
  });

  it('generates keydown description', () => {
    const result = buildFallbackDescription('keydown:Enter', makeMeta({ ariaLabel: 'Search field' }));
    expect(result).toBe('steps.pressKey[Enter,Search field]');
  });

  it('generates copy description', () => {
    const result = buildFallbackDescription('copy', makeMeta({ ariaLabel: 'Code block' }));
    expect(result).toBe('steps.copyFrom[Code block]');
  });

  it('generates paste description', () => {
    const result = buildFallbackDescription('paste', makeMeta({ ariaLabel: 'Input field' }));
    expect(result).toBe('steps.pasteInto[Input field]');
  });

  it('generates drag description', () => {
    const result = buildFallbackDescription('drag', makeMeta({ ariaLabel: 'Card' }));
    expect(result).toBe('steps.drag[Card]');
  });

  it('falls back to tag when no label is available', () => {
    const result = buildFallbackDescription('click', makeMeta({ tag: 'div' }));
    expect(result).toBe('steps.click[div]');
  });

  it('uses default action for unknown actions', () => {
    const result = buildFallbackDescription('focus', makeMeta({ ariaLabel: 'Menu' }));
    expect(result).toBe('steps.defaultAction[focus,Menu]');
  });

  it('prefers ariaLabel over textContent', () => {
    const result = buildFallbackDescription('click', makeMeta({ ariaLabel: 'Close dialog', textContent: 'X' }));
    expect(result).toBe('steps.click[Close dialog]');
  });

  it('truncates long textContent to 80 chars', () => {
    const longText = 'A'.repeat(100);
    const result = buildFallbackDescription('click', makeMeta({ textContent: longText }));
    expect(result).toBe(`steps.click[${'A'.repeat(80)}]`);
  });
});
