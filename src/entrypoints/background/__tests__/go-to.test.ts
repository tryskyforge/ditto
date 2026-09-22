import { describe, expect, it } from 'vitest';
import { isTypedNavigation } from '../go-to';

describe('isTypedNavigation', () => {
  it('treats addresses typed or picked from the address bar as Go-to navigations', () => {
    expect(isTypedNavigation('typed')).toBe(true);
    expect(isTypedNavigation('generated')).toBe(true);
    expect(isTypedNavigation('keyword')).toBe(true);
    expect(isTypedNavigation('auto_bookmark')).toBe(true);
    expect(isTypedNavigation('link', ['from_address_bar'])).toBe(true);
  });

  it('leaves navigations caused by the page to the click that triggered them', () => {
    expect(isTypedNavigation('link')).toBe(false);
    expect(isTypedNavigation('form_submit')).toBe(false);
    expect(isTypedNavigation('link', ['client_redirect'])).toBe(false);
  });

  it('ignores reloads and back / forward', () => {
    expect(isTypedNavigation('reload', ['from_address_bar'])).toBe(false);
    expect(isTypedNavigation('typed', ['forward_back'])).toBe(false);
  });
});
