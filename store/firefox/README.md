# Firefox (AMO) submission

Fields that differ from Chrome and Edge. Shared copy — summary, description, screenshots
— comes from [`../listing.md`](../listing.md) and `../screenshots/`.

AMO account email is not shown publicly; the **Display Name** on the developer profile is
what users see. Chrome is the opposite — its contact email appears on the listing.

## Upload

| Field | Value |
| --- | --- |
| Distribution | **On this site** (listed) — not "On your own", which is self-distribution |
| Package | `.output/ditto-1.0.0-firefox.zip` — not the Chrome zip, the manifests differ |
| Compatible with | Firefox only. **Not** Firefox for Android — the add-on uses `sidebar_action`, which Android does not support |
| Source code | Required. `.output/ditto-1.0.0-sources.zip` |
| Icon | `../icons/store-icon-amo-128.png` (full bleed — not Chrome's inset version) |
| License | MIT |
| Categories | Web Development, Privacy & Security |
| Support email | ditto@skyforgeai.app |
| Support website | https://tryskyforge.github.io/ditto/ |

## Build instructions

AMO requires these because the package is bundled. A reviewer runs them and diffs the
result against the uploaded artifact, so build from a clean checkout of the tag.

```
Node 22.22.2
pnpm 10.32.1

pnpm install --frozen-lockfile
pnpm zip:firefox

Artifact: .output/ditto-1.0.0-firefox.zip
Source tag: v1.0.0
```

## Privacy policy

AMO wants the policy **pasted as text**, not a URL — the opposite of Chrome.

Use [`privacy-policy.txt`](privacy-policy.txt). It is the hosted policy converted to plain
text, with two Firefox-specific corrections:

- `sidePanel` and `offscreen` are removed from the permissions list — neither is in the
  Firefox manifest. Firefox gets `storage, activeTab, tabs, scripting, unlimitedStorage,
  webNavigation`, and the mic and offscreen entrypoints are compiled out of that build.
- A note that host access is requested **optionally, when a recording starts**, rather
  than granted at install. True of the Firefox build, which uses
  `optional_host_permissions` rather than `host_permissions`.

Regenerate it if `site/privacy.html` changes, keeping both corrections.

## Notes to Reviewer

The validator raises two warnings that "can lead to rejections". Neither is a real
finding, but answering them up front saves a review round trip.

```
Validator warnings:

- innerHTML: all assignments are in our own code. Any user-controlled text is passed
  through escapeHtml() (a textContent round-trip) before interpolation; the remaining
  uses inject static SVG icons and literal markup with no dynamic input.

- Function constructor: not present in our source. It comes from a bundled export
  dependency (jsPDF / docx / mediabunny), used to generate PDF, DOCX and video exports
  entirely client-side.

No account or login is required to use any part of the extension, so no test credentials
are needed. The AI and voice features are optional, disabled by default, and require the
user to supply their own API key or point the extension at their own model server.
Everything else works fully offline.

Build instructions are in the source package and repeated in the source code step.
```

## Data collection permissions

The Firefox manifest declares, under `browser_specific_settings.gecko`:

- required: `websiteActivity`
- optional: `websiteContent`, `personallyIdentifyingInfo`

AMO surfaces these to users and may ask you to justify them. The declaration is accurate —
Ditto records what the user does on sites they choose, and screenshots can contain
personal data. Do not soften it to look better.

## Slug

The README badge assumes `https://addons.mozilla.org/en-US/firefox/addon/ditto/`. AMO
auto-suggests a slug from the add-on name and may append a suffix if `ditto` is taken. If
the final slug is not `ditto`, update `[firefox-link]` and `[firefox-version-shield]` in
README.md to match.
