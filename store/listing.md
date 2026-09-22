# Ditto — store listing copy

Paste-ready text for the Chrome Web Store, Firefox AMO and Edge Add-ons.
The same copy works for all three; only the form layout differs.

---

## Name

```
Ditto – Turn Clicks into Guides
```

(Already in the manifest via `app.store_title` — Chrome fills this automatically.)

---

## Short description (132 char limit — this is 130)

```
Record any browser workflow as a step-by-step guide. Edit, voice-narrate, export to video, PDF or DOCX. Local-first, open source.
```

---

## Category

**Developer Tools** — primary choice.
Productivity is a reasonable alternative if you want a wider audience; Developer Tools is
the more honest fit and a less crowded listing.

---

## Privacy policy URL

```
https://tryskyforge.github.io/ditto/privacy.html
```

---

## Full description

```
Record any browser workflow as a step-by-step guide. Edit, voice-narrate, export to video, PDF or DOCX. Local-first, open source.

Ditto turns any browser workflow into a step-by-step guide with annotated screenshots. Automatic capture, no manual work. Click "Record," do the thing, and stop. Ditto captures each click and keystroke as a step. Each step has a screenshot, the element you clicked, and a description. Edit, replay, or export.

Features
- Auto-capture clicks, typing, and navigation. No more writing steps by hand.
- Annotated screenshots highlight what you clicked. No cropping, no arrow tools.
- Narrate out loud while you record. Ditto turns what you said into the step descriptions.
- Optional AI step descriptions and titles, using your own API key or your own model server.
- Rewrite any step with AI, inline, without leaving the editor.
- Edit screenshots: crop, annotate, and redact before you share.
- Add headings and notes between steps, reorder them, and roll back with version history.
- Guide Me replays any guide on the live page, highlighting each next step. Use it for onboarding or training.
- Export to video, PDF, DOCX, HTML, or Markdown. Files are self-contained, ready to share anywhere.
- Smart Blur hides emails, phone numbers, and card data before the screenshot is taken.
- Available in six languages.

Private by design
- Local by default. Guides, screenshots, and recordings stay in your browser. Nothing is sent to a Ditto server. There is no Ditto server.
- No account, no sign-up, no tracking.
- Site icons are fetched from Google's favicon service, so the domain of each recorded site is sent there. Nothing else is.
- AI and voice are optional. Turn them on with your own key. Requests go from your browser straight to the provider, never to us. AI descriptions are generated from a short text snippet of the page, never from your screenshots.

Open source
Free and MIT-licensed. Source code and issues: https://github.com/tryskyforge/ditto
```

---

## Single purpose statement

```
Ditto records a user's actions on a web page they choose and converts them into a
step-by-step guide with annotated screenshots, which the user can then edit, replay or
export.
```

---

## Permission justifications

Chrome asks for one per permission. Keep each to the point — reviewers read a lot of these.

**host_permissions `<all_urls>`**
```
The user chooses which website to document, so the extension cannot know in advance which
hosts it will need. Ditto only injects its capture overlay into a tab while the user has
explicitly started a recording or a guided replay on that tab. It does not read or act on
any page otherwise.
```

**activeTab**
```
Used to identify the tab the user has chosen to record and to capture its visible area for
each step's screenshot.
```

**tabs**
```
Used to list which of the user's open tabs can be recorded, and to know which tab a
recording belongs to so steps are attributed to the correct page.
```

**scripting**
```
Used to inject the capture overlay, the Smart Blur panel and the Guide Me replay overlay
into the page the user is recording or replaying.
```

**webNavigation**
```
Recordings frequently span multiple pages. This is used to detect navigations so capture
continues across them and each step records the page it happened on.
```

**storage**
```
Used to store the user's settings and preferences locally, including any API key they
choose to enter for the optional AI and voice features.
```

**unlimitedStorage**
```
Guides consist of one screenshot per step and can run to dozens of steps. All of it is
stored locally in IndexedDB, which needs to exceed the default quota. Nothing is uploaded.
```

**sidePanel**
```
The side panel is Ditto's main interface — where the user starts and stops a recording,
reviews captured steps and opens their guide library.
```

**offscreen**
```
Used to record microphone audio for the optional voice narration feature, and to encode
video and GIF exports, both of which require a document context the service worker does
not have.
```

---

## Data use disclosures (Chrome "Privacy practices" tab)

Tick **only** these, and be accurate — mis-declaring is a common rejection reason:

- **Personally identifiable information** — No
- **Health information** — No
- **Financial and payment information** — No
- **Authentication information** — No
- **Personal communications** — No
- **Location** — No
- **Web history** — No
- **User activity** — No
- **Website content** — **Yes.** Screenshots and page text are captured, but stored only
  on the user's device. If the user enables AI descriptions, a short text snippet of page
  context is sent to a provider of their choosing with their own API key.

Then the three certifications:
- Not being sold to third parties — true
- Not being used or transferred for purposes unrelated to the single purpose — true
- Not being used to determine creditworthiness or for lending — true

---

## Firefox AMO extras

Answer **yes** to "does this contain minified or generated code", upload
`ditto-1.0.0-sources.zip`, and give these build instructions:

```
Node 22.22.2
pnpm 10.32.1

pnpm install --frozen-lockfile
pnpm zip:firefox

Artifact: .output/ditto-1.0.0-firefox.zip
```

A reviewer runs exactly this and compares the result to the uploaded file, so build from a
clean checkout of the v1.0.0 tag.

AMO also asks for **Notes to reviewer**. Worth adding:

```
No account or login is required to use any part of the extension. The AI and voice
features are optional, disabled by default, and require the user to supply their own API
key or point the extension at their own model server. Everything else works fully offline.
```

---

## After the first upload

Chrome shows the extension ID in the dashboard URL immediately, before review completes.

- Chrome: `ipcgbegaacaepfkmfllmaojdlenhedao` — filled into README.md
- Edge: CRX ID `empdagcgkgnnppmfdajbmldbghhbnboi` — filled into README.md. Partner Center
  also shows a Store ID (`0RDCKCPT7W05`) and a Product ID
  (`32edfc80-dabe-4df8-bfae-4054db06d9b6`); the CRX ID is the one the store URL and the
  version badge use.
- Firefox: uses the slug `ditto` in its URL, which the existing badge already assumes

The Chrome id is also needed as the `CHROME_EXTENSION_ID` repository secret for
`.github/workflows/submit.yml`.

Firefox uses the slug `ditto` in its URL, which the existing badge already assumes.
