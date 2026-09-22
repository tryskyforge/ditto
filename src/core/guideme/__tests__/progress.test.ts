import { describe, expect, it } from 'vitest';
import { isSameAddress, stepForAddress } from '../progress';

describe('isSameAddress', () => {
  it('matches the same origin, path and query, ignoring the hash, a trailing slash and query order', () => {
    expect(isSameAddress('https://a.com/x/?b=2&a=1#top', 'https://a.com/x?a=1&b=2')).toBe(true);
  });

  it('tells pages apart by their query', () => {
    expect(isSameAddress('https://github.com/me?tab=repositories', 'https://github.com/me')).toBe(false);
  });

  it('does not match another path or origin, or an invalid address', () => {
    expect(isSameAddress('https://a.com/x', 'https://a.com/y')).toBe(false);
    expect(isSameAddress('https://a.com/x', 'https://b.com/x')).toBe(false);
    expect(isSameAddress('', 'https://a.com/x')).toBe(false);
  });
});

describe('stepForAddress', () => {
  const steps = [
    { url: 'https://github.com/me' },
    { url: 'https://github.com/me' },
    { url: 'https://github.com/me?tab=repositories' },
    { url: 'https://github.com/me/ditto' },
    { url: 'https://github.com/me/ditto/pulls' },
  ];

  it('jumps to the first later step recorded on the page the tab landed on', () => {
    expect(stepForAddress(steps, 0, 'https://github.com/me?tab=repositories')).toBe(2);
    expect(stepForAddress(steps, 1, 'https://github.com/me/ditto/pulls')).toBe(4);
  });

  it('stays put while the tab is on the active step page', () => {
    expect(stepForAddress(steps, 0, 'https://github.com/me/')).toBeNull();
  });

  it('never moves backwards', () => {
    expect(stepForAddress(steps, 3, 'https://github.com/me?tab=repositories')).toBeNull();
  });

  it('ignores pages no step was recorded on and steps without an address', () => {
    expect(stepForAddress(steps, 0, 'https://github.com/login')).toBeNull();
    expect(stepForAddress([{ url: 'https://a.com/' }, { url: '' }], 0, 'https://a.com/other')).toBeNull();
  });
});
