#!/usr/bin/env python3
"""Member photos -> Delos host captures.

Takes _inbox/photos/<firstname>[-lab].<ext> (or explicit --src/--name pairs) and writes
images/members/<firstname>[-lab].avif + .jpg:
  - fixes camera rotation (EXIF orientation), then drops ALL metadata (EXIF, GPS, ICC)
  - crops 4:5, centred horizontally and on the upper third vertically (faces sit there)
  - neutral grayscale (R = G = B, no tint) with a light auto-contrast
  - 640 x 800

Run with Pillow from a scratch venv (never installed into the repo):
    <venv>/bin/python tools/photo.py                 # every file in _inbox/photos/
    <venv>/bin/python tools/photo.py --src x.jpg --name max     # one file
    <venv>/bin/python tools/photo.py --check         # verify everything in images/members/

Privacy (CLAUDE.md): output names are first names only. Anything else is refused, so a
surname from an inbox file name can never reach the site.
"""
import argparse, pathlib, re, sys
from PIL import Image, ImageOps, ImageStat

ROOT = pathlib.Path(__file__).resolve().parent.parent
INBOX, OUT = ROOT / "_inbox" / "photos", ROOT / "images" / "members"
MEMBERS = {"kenna", "max", "mia", "alexis", "meer", "leo"}
W, H = 640, 800
NAME = re.compile(r"^(?P<who>[a-z]+)(?P<lab>-lab)?$")


def check_name(stem):
    m = NAME.match(stem.lower())
    if not m or m["who"] not in MEMBERS:
        raise SystemExit(f"refusing '{stem}': output must be <firstname>[-lab] with a first name from {sorted(MEMBERS)}")
    return m["who"] + (m["lab"] or "")


def crop_45(im):
    """Largest 4:5 window, centred horizontally; vertically its centre sits on the upper-third line."""
    w, h = im.size
    if w / h > W / H:                      # too wide: full height, trim the sides
        cw, ch = round(h * W / H), h
    else:                                  # too tall: full width, trim top/bottom
        cw, ch = w, round(w * H / W)
    x = (w - cw) // 2
    y = min(max(round(h / 3 - ch / 2), 0), h - ch)
    return im.crop((x, y, x + cw, y + ch))


def process(src, name):
    name = check_name(name)
    im = ImageOps.exif_transpose(Image.open(src))          # apply rotation before metadata is dropped
    im = crop_45(im.convert("RGB")).resize((W, H), Image.Resampling.LANCZOS)
    g = ImageOps.autocontrast(im.convert("L"), cutoff=0.5)  # neutral grayscale, light contrast
    out = Image.merge("RGB", (g, g, g))                    # identical channels: no tint survives encoding
    clean = Image.frombytes("RGB", out.size, out.tobytes())   # fresh image from raw pixels: no info/exif/icc
    OUT.mkdir(parents=True, exist_ok=True)
    clean.save(OUT / f"{name}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    clean.save(OUT / f"{name}.avif", "AVIF", quality=62, subsampling="4:4:4")
    print(f"{src} -> images/members/{name}.avif / .jpg")


def check():
    ok = True
    for f in sorted(OUT.glob("*")):
        if f.suffix not in (".avif", ".jpg"):
            continue
        im = Image.open(f)
        st = ImageStat.Stat(im.convert("RGB"))
        tint = max(abs(st.mean[0] - st.mean[1]), abs(st.mean[1] - st.mean[2]))
        meta = [k for k in ("exif", "icc_profile", "xmp") if im.info.get(k)] + (["exif"] if len(im.getexif()) else [])
        bad = []
        if im.size != (W, H): bad.append(f"size {im.size}")
        if tint > 1.5: bad.append(f"tint {tint:.1f}")
        if meta: bad.append(f"metadata {sorted(set(meta))}")
        try: check_name(f.stem)
        except SystemExit as e: bad.append(str(e))
        ok &= not bad
        print(f"{'OK ' if not bad else 'BAD'} {f.name}" + (f"  {'; '.join(bad)}" if bad else ""))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src"); ap.add_argument("--name"); ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if a.check: check()
    elif a.src: process(a.src, a.name or pathlib.Path(a.src).stem)
    else:
        files = [f for f in sorted(INBOX.glob("*")) if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".heic", ".webp", ".avif")]
        if not files: print(f"no photos in {INBOX}")
        for f in files: process(f, f.stem)
