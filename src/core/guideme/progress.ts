import type { Step } from '@/core/guides/types';

function normalizeAddress(address: string): string | null {
  try {
    const url = new URL(address);
    url.searchParams.sort();
    return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`;
  } catch {
    return null;
  }
}

export function isSameAddress(current: string, target: string): boolean {
  const a = normalizeAddress(current);
  return a !== null && a === normalizeAddress(target);
}

export function stepForAddress(steps: Pick<Step, 'url'>[], activeIndex: number, address: string): number | null {
  const active = steps[activeIndex];
  if (active?.url && isSameAddress(address, active.url)) return null;
  for (let i = activeIndex + 1; i < steps.length; i++) {
    if (steps[i].url && isSameAddress(address, steps[i].url)) return i;
  }
  return null;
}
