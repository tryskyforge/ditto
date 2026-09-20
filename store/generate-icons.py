#!/usr/bin/env python3
"""Regenerate the store listing icons from public/ditto-mark.png.

    python3 store/generate-icons.py

Run this whenever the mark changes so every store keeps the same artwork.
These are listing assets only — the icons shipped inside the extension live in
public/icon{16,32,48,128}.png and are not touched here.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "ditto-mark.png"
OUT = ROOT / "store" / "icons"

# (filename, canvas, artwork) — Chrome asks for the artwork inset inside the
# canvas with transparent margin; the others are full bleed.
TARGETS = [
    ("store-icon-chrome-128.png", 128, 96),
    ("store-icon-amo-128.png", 128, 128),
    ("store-logo-edge-300.png", 300, 300),
    ("store-tile-edge-150.png", 150, 150),
]


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)

    for name, canvas, artwork in TARGETS:
        art = source.resize((artwork, artwork), Image.LANCZOS)
        image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        offset = (canvas - artwork) // 2
        image.paste(art, (offset, offset), art)
        image.save(OUT / name, optimize=True)
        print(f"{name}  {canvas}x{canvas} (artwork {artwork}px)")


if __name__ == "__main__":
    main()
