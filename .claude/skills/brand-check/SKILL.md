---
name: brand-check
description: Audit a page of the Dolores site against the brand kit in CLAUDE.md. Use before pushing, or when asked to check, polish or review a page.
---
Check and fix, then report a short list:
- Colors only via tokens in `css/tokens.css`; gold used only for "the sign" elements
- Fonts: Cormorant Garamond headings, Newsreader body, IBM Plex Mono labels, GFS Didot Greek
- Text contrast meets WCAG AA in light and dark
- `prefers-reduced-motion` gives a calm static version; page works without WebGL
- Phone width: no horizontal scroll, 16px gutters, tap targets ≥ 44px
- All CDN scripts pinned to exact versions; no 404s in the console
- Every image/3D asset has a credit in sources; no copyrighted music or HBO stills
Take screenshots (desktop + 390px phone) to verify rather than guessing.
