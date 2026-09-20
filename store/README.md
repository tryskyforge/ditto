# Store assets

Everything needed to fill in a store listing. Nothing here ships inside the extension —
`zip.excludeSources` keeps `store/**` out of the AMO sources zip.

```
store/
  listing.md              copy: descriptions, single purpose, permission justifications
  generate-icons.py       rebuilds icons/ from public/ditto-mark.png
  icons/                  listing icons
  screenshots/            1280x800, 24-bit RGB, no alpha
  promo/                  Chrome promo tiles, 24-bit RGB, no alpha
  firefox/                AMO-specific: plain-text privacy policy, reviewer notes
```

AMO differs enough from the Chromium stores to need its own notes — see
[`firefox/README.md`](firefox/README.md).

## Where each file goes

| File | Chrome | Firefox | Edge |
| --- | --- | --- | --- |
| `icons/store-icon-chrome-128.png` | Store icon | — | — |
| `icons/store-icon-amo-128.png` | — | Add-on icon | — |
| `icons/store-logo-edge-300.png` | — | — | Store logo (300x300) |
| `icons/store-tile-edge-150.png` | — | — | Small tile (optional) |
| `screenshots/*.png` | Screenshots (1–5) | Screenshots | Screenshots |
| `promo/promo-small-440x280.png` | Small promo tile | — | — |
| `promo/promo-marquee-1400x560.png` | Marquee promo tile | — | — |

The Chrome store icon insets the artwork to 96px inside a 128px transparent canvas, which
is what Google's image guidelines ask for. `public/icon128.png` is full-bleed and is the
icon shipped in the extension — do not upload that one as the store icon, it renders
oversized next to other listings.

Screenshots and promo tiles are flattened to 24-bit RGB because both stores reject alpha.
The icons keep their transparency, which is allowed for icon fields.

## Screenshots

Suggested order — it follows the product's own loop:

1. `1-recording.png` — capture in progress, steps stacking up in the side panel
2. `2-guide.png` — the finished guide with the step rail
3. `3-blur.png` — Smart Blur masking a customer record
4. `4-export.png` — export preview with every format
5. `5-guideme.png` — Guide Me replaying on a live page

Sources were 1918x1050 screen recordings, cropped to 1680x1050 and scaled to 1280x800.
Most are centre-cropped; `3-blur.png` is anchored left because the blur panel sits at the
page's left edge and a centred crop cuts it in half.

## Regenerating

Icons, after changing `public/ditto-mark.png`:

```bash
python3 store/generate-icons.py
```

Screenshots and promo tiles were made by hand from screen recordings. Re-record at
1918x1050 or wider, then crop to 1.6:1 and scale to 1280x800.

## After each store publishes

The three version badges in README.md are static "in review" placeholders while the
listings are unpublished — the live shields query store APIs that return an error until
the extension is public, which renders as a red "not found" rather than a blank.

Each badge definition has the live URL directly beneath it in an HTML comment. When a
store goes live, swap that store's line for the commented one and drop the *(pending)*
note from its row in the install table.
