# Follow-ups

Things known to be outstanding, with enough context to act on them without
re-deriving the reasoning. Delete an entry once it is done.

---

## Swap the store badges back when each store publishes

The three version badges in `README.md` are static grey **in review** placeholders. The
real shields query live store APIs, which return an error while a listing is unpublished
— rendering as a red "not found" rather than a blank badge.

Each badge definition has its live URL directly beneath it in an HTML comment. When a
store goes live:

1. Swap that store's `[*-version-shield]` line for the commented one below it.
2. Drop the `*(pending)*` note from that row of the install table.

Do them one at a time as each store publishes — they will not go live together. Edge is
usually fastest, Chrome slowest.

The Edge badge is a URL-encoded `dynamic/json` query against
`getproductdetailsbycrxid`; it is the one you would not want to reconstruct by hand,
hence keeping it verbatim in the comment.

**Store identifiers** (also in `store/listing.md`):

| Store | Identifier |
| --- | --- |
| Chrome | `ipcgbegaacaepfkmfllmaojdlenhedao` |
| Firefox | slug `ditto-skyforgeai` |
| Edge | CRX ID `empdagcgkgnnppmfdajbmldbghhbnboi` |

---

## Repo About panel

Needs setting by hand — a PAT cannot edit repo metadata without Administration
permission.

- **Description:** Record any browser workflow into a step-by-step guide with annotated
  screenshots. Local-first — no account, no cloud, no tracking.
- **Website:** https://tryskyforge.github.io/ditto/
- **Topics:** browser-extension, chrome-extension, firefox-addon, documentation,
  screenshots, step-by-step-guide, sop, manifest-v3, local-first, privacy, typescript,
  react, wxt, onboarding

Topics drive GitHub's own browse and search, so they are worth filling in.

---

## Update the site once the stores publish

`site/install.html` exists because the listings are in review. When they go live:

- Replace the manual-install lead with store buttons, and keep the manual route lower
  down for people who want it.
- `site/index.html` says "in review" under **Getting it** — update that too.
- Version numbers in the file table (`ditto-1.0.0-*.zip`) are hardcoded and will go
  stale on the next release.

---

## Onboarding pin screenshot does not match its copy

`public/pin-screenshot.png` shows the `chrome://extensions` management card, but the
copy beside it in `src/ui/onboarding/App.tsx` walks through a different flow — click the
puzzle icon, find Ditto in the dropdown, click the pin icon. None of that is in the
image.

Fix: capture the puzzle-piece dropdown with Ditto's row and its pin icon visible, then
replace the file. One image covers all three steps.

The alternative — rewriting `pinTitle`, `pinMessage`, the three step pairs and
`pinScreenshotAlt` across six locales — is more work and loses the pin instruction,
which is the useful part, since Chrome hides unpinned extensions behind the puzzle icon.

---

## `submit.yml` has no Edge target and no store credentials

`.github/workflows/submit.yml` submits to Chrome and Firefox only. `pnpm zip:edge`
exists but nothing uses it, and none of the store secrets are configured, so the
workflow cannot actually run.

Needed as repository secrets:

- Chrome: `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`,
  `CHROME_REFRESH_TOKEN`
- Firefox: `FIREFOX_EXTENSION_ID`, `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`
- Edge: Partner Center API credentials, plus an `edge` branch in the `targets` input

Until this is done, every release repeats the manual upload to three dashboards.

---

## Provider screens have no render test

`SettingsView.tsx` and `onboarding/App.tsx` now share `AiProviderFields`, which removed
the duplication that caused two shipped bugs — the self-hosted provider missing from
onboarding entirely, and the full view hiding its AI actions for a keyless provider.

Neither screen is rendered by any test, so nothing would catch a repeat. A test
asserting "keyless provider shows the server URL field and enables Check" would have
caught both original bugs in seconds.

---

## `AGENTS.md` and `CLAUDE.md` came from upstream

Both files predate the rebrand and may still describe Mimik's architecture and
conventions rather than Ditto's. Worth a read-through; they are what an agent or a new
contributor reads first.

---

## `text-purple` is an alias for the accent

`--color-purple` resolves to `#3D6B47`, the same as `--color-accent`. It is a leftover
name from the indigo palette and is mostly used where a muted grey is meant, so caption
text and resting icon states render at full accent weight — and icons that hover to
`text-accent` hover to the colour they already are.

Fixed in `GuideEditor` and `RecordingView`. Still present in roughly 25 sites across
`fullview/`, `GuideMeView`, `LibraryView` and `InsertBlockMenu`. The alias itself should
go rather than being replaced site by site.

---

## Chrome's "remote code" answer

The Chrome listing form defaults this to **Yes**. The correct answer is **No** — nothing
in the extension's own source uses `eval`, the `Function` constructor, remote `<script>`
tags or dynamic `import()` of a URL; Poppins is bundled via `@fontsource` rather than a
CDN, and API calls return data, not executable code.

Worth confirming what the v1.0.0 submission actually recorded, and correcting it on the
next version if it went in as Yes. Answering Yes triggers a deeper review and invites a
reviewer to look for remote code that is not there.
