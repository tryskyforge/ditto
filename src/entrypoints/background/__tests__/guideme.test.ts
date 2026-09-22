import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { Step } from '@/core/guides/types';

const getActiveTab = vi.fn();
const getStepsForGuide = vi.fn();

vi.mock('@/lib/browser-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/browser-api')>()),
  getActiveTab: () => getActiveTab(),
}));

vi.mock('@/core/guides/service', () => ({
  getStepsForGuide: (id: string) => getStepsForGuide(id),
  getScreenshotsForSteps: vi.fn().mockResolvedValue(new Map()),
}));

import { getSession, startSession } from '@/core/guideme/session';
import { followGuideMeAddress } from '../guideme';

const meta = {
  tag: 'a',
  cssSelector: 'a',
  textContent: 'x',
  ariaLabel: null,
  placeholder: null,
  altText: null,
  name: null,
  role: null,
  href: null,
  inputType: null,
  dataTestId: null,
  rect: { x: 0, y: 0, width: 10, height: 10 },
  devicePixelRatio: 1,
};

const step = (index: number, url: string) =>
  ({
    id: `s${index}`,
    guideId: 'g1',
    index,
    description: '',
    action: 'click',
    url,
    timestamp: 0,
    elementMeta: meta,
  }) as Step;

const steps = [
  step(0, 'https://github.com/me'),
  step(1, 'https://github.com/me'),
  step(2, 'https://github.com/me?tab=repositories'),
  step(3, 'https://github.com/me/ditto'),
];

describe('followGuideMeAddress', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    getActiveTab.mockResolvedValue({ id: 7 });
    getStepsForGuide.mockResolvedValue(steps);
    await startSession('g1', steps.length, steps[0], false);
  });

  it('jumps to the step recorded on the page the active tab landed on', async () => {
    expect(await followGuideMeAddress(7, 'https://github.com/me?tab=repositories')).toBe(true);
    expect((await getSession())?.activeStepIndex).toBe(2);
  });

  it('leaves the session alone on the active step page or an unknown page', async () => {
    expect(await followGuideMeAddress(7, 'https://github.com/me')).toBe(false);
    expect(await followGuideMeAddress(7, 'https://github.com/login')).toBe(false);
    expect((await getSession())?.activeStepIndex).toBe(0);
  });

  it('ignores navigations in tabs other than the active one', async () => {
    expect(await followGuideMeAddress(9, 'https://github.com/me/ditto')).toBe(false);
    expect((await getSession())?.activeStepIndex).toBe(0);
  });
});
