// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { extractDOMContext } from '../context';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('extractDOMContext', () => {
  it("strips a screen-reader position hint from the target's accessible name", () => {
    const el = document.createElement('li');
    el.setAttribute('role', 'option');
    el.setAttribute('aria-label', 'All, 6 of 9');
    document.body.appendChild(el);

    const ctx = extractDOMContext(el, 'click');
    expect(ctx.target.name).toBe('All');
  });

  it('leaves an ordinary accessible name untouched', () => {
    const el = document.createElement('button');
    el.setAttribute('aria-label', 'Save');
    document.body.appendChild(el);

    const ctx = extractDOMContext(el, 'click');
    expect(ctx.target.name).toBe('Save');
  });

  it("strips the same position hint from a sibling's accessible name", () => {
    const nav = document.createElement('nav');
    const sibling = document.createElement('button');
    sibling.setAttribute('aria-label', 'Overview, 5 of 9');
    const target = document.createElement('button');
    target.setAttribute('aria-label', 'All, 6 of 9');
    nav.appendChild(sibling);
    nav.appendChild(target);
    document.body.appendChild(nav);

    const ctx = extractDOMContext(target, 'click');
    expect(ctx.siblings.find((s) => s.name === 'Overview')).toBeTruthy();
  });
});
