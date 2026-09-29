const PANEL_SELECTOR = '[role="listbox"], [role="menu"], [role="grid"]';
const POLL_MS = 40;
const MAX_POLLS = 20; // ~800ms worst case
const STABLE_POLLS = 3; // ~120ms of the panel staying present before we trust it's actually rendered

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function panelIsOpen(): boolean {
  const panel = document.querySelector(PANEL_SELECTOR);
  return !!panel && panel.getBoundingClientRect().height > 0;
}

/**
 * Some controls open their option list asynchronously rather than having it in the DOM
 * already — a reference/lookup field's typeahead panel after a server round trip, or a
 * custom choice widget's overlay after a render tick — well past the few animation frames
 * capture normally waits. Give a listbox/menu/grid panel a bounded chance to appear and
 * settle before the screenshot is taken, instead of capturing the field half-open or
 * with no list at all. Bails at MAX_POLLS if nothing ever opens, so a click that doesn't
 * open anything never stalls recording for more than that.
 */
export async function waitForOpenPanel(): Promise<void> {
  let streak = 0;
  for (let i = 0; i < MAX_POLLS; i++) {
    if (panelIsOpen()) {
      streak++;
      if (streak >= STABLE_POLLS) return;
    } else {
      streak = 0;
    }
    await sleep(POLL_MS);
  }
}
