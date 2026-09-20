# Installing Ditto from source

While the store listings are in review, you can load Ditto manually. This takes about a
minute and gives you the same build that was submitted to the stores.

Two routes: download a prebuilt zip, or build it yourself.

---

## Download a build

Grab the zip for your browser from the
[latest release](https://github.com/tryskyforge/ditto/releases/latest):

| File | For |
| --- | --- |
| `ditto-1.0.0-chrome.zip` | Chrome, Edge, Brave, Arc, Opera, Vivaldi — any Chromium browser |
| `ditto-1.0.0-firefox.zip` | Firefox |
| `ditto-1.0.0-edge.zip` | Identical to the Chrome build; published separately for the Edge store |
| `ditto-1.0.0-sources.zip` | Source archive published for Firefox review — not an installable extension |

## Or build it

Needs Node 22 and pnpm 10.

```bash
git clone https://github.com/tryskyforge/ditto.git
cd ditto
pnpm install --frozen-lockfile
pnpm zip:all
```

Zips land in `.output/`. For an unpacked build you can load directly without unzipping,
use `pnpm build` (Chromium) or `pnpm build:firefox`, which write to
`.output/chrome-mv3/` and `.output/firefox-mv3/`.

---

## Chrome, Edge, Brave, Arc and other Chromium browsers

1. **Unzip** `ditto-1.0.0-chrome.zip`. You need the folder, not the zip — this is the
   step people miss.
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode**, top right.
4. Click **Load unpacked** and select the unzipped folder — the one containing
   `manifest.json`.
5. Ditto appears in the list. Click the puzzle-piece icon in the toolbar and **pin** it.
6. Click the Ditto icon to open the side panel.

Keep the folder where it is. The browser loads the extension from that path on every
start, so moving or deleting it breaks the install.

### Notes

- Developer mode stays on, and Chrome shows a "Disable developer mode extensions"
  warning on each start. That is Chrome's behaviour for unpacked extensions, not a
  problem with Ditto. It goes away once you install from the store.
- To update, download the new zip, unzip over the old folder, and press the refresh
  icon on Ditto's card in `chrome://extensions`.

---

## Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `ditto-1.0.0-firefox.zip` — Firefox takes the zip directly, no unzipping.
4. Open the sidebar with `Ctrl`/`Cmd`+`B`, or View → Sidebar → Ditto.

### Notes

- **Firefox removes temporary add-ons when it restarts.** You will need to load it again
  each session until the AMO listing is public. This is a Firefox restriction on
  unsigned add-ons, not something the extension controls.
- Ditto lives in the **sidebar** on Firefox, not a side panel, and it does not open
  automatically.
- Firefox asks for host permission the first time you start a recording, rather than at
  install. Accept it or the recording cannot capture the page.
- Voice narration is unavailable on Firefox — it needs Chromium's offscreen API, so
  those entry points are compiled out of the Firefox build.

---

## First run

1. Open any normal website. `chrome://`, `about:` and file:// pages cannot be recorded —
   browsers do not allow extensions to inject there.
2. Open the Ditto panel and click **Start recording**.
3. Click and type on the page. Each action becomes a step with its own screenshot.
4. Click **Finish recording**. The guide opens in the full view, where you can edit,
   annotate, reorder and export it.

Everything works offline with no account. The AI and voice features are optional, off by
default, and need either your own API key or your own model server — see
[self-hosted-ai.md](self-hosted-ai.md).

---

## Troubleshooting

**"Manifest file is missing or unreadable"** — you selected the zip, or a folder one
level too high. Select the folder that directly contains `manifest.json`.

**The side panel is empty or the extension icon is greyed out** — you are probably on a
`chrome://`, `about:` or Web Store page. Switch to a normal site.

**The record button says "Open a website to start capturing"** — same cause. Note that
local `file://` pages are also excluded; serve them over `http://localhost` instead if
you need to document one.

**The extension disappeared after restarting Firefox** — expected for temporary add-ons.
Load it again.

**Something else** — [open an issue](https://github.com/tryskyforge/ditto/issues).
