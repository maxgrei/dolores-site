# Team Dolores — HP 241 portfolio site

HONORS 241 "Philosophy of Mind through Westworld" (Prof. George Hoffman, Fall 2026).
Team reading: Plutarch, *Socrates' Daimonion* (On the Sign of Socrates), trans. Russell.
Show: Westworld Season 1. Six members; each writes Builds 1–8 (Builds 2 and 6 are team builds;
Build 6 is the collaborative conclusion). The best/most creative site in class wins an award.

Live (dev): https://maxgrei.github.io/dolores-site/  (repo maxgrei/dolores-site, remote `origin`)
Official:   https://um-lrc-hnr241.github.io/2026-fall-dolores/ (remote `class`; push only when Max says so)

## Concept: "The Voice Was Your Own"
Dolores spends S1 following a voice she thinks is Arnold's and learns it is her own. Socrates
follows a sign nobody can pin down: a sneeze (Galaxidorus, p.92), a god, or "a perception of a
voice" (Simmias, p.104). Same question in both works: is the guiding voice inside or outside?

Key images from the reading to build with:
- p.104–105: the soul "with all its countless puppet-strings of impulse" is "the most sensitive
  machine of all"; a higher mind guides it "by a mere thought, for it needs no blow"; the strings
  are like "reins with some give in them". → HERO: banner fragments hanging on gold strings.
- p.108–109 (Timarchus' vision): souls as stars over a chasm; disciplined ones move straight,
  undisciplined ones spiral; the daimon is the part that stays above, "outside them".
  → MEMBERS: a starfield, one star per member.
- p.91–92: Socrates stops, turns down Boxmakers Street; the young men who ignored the sign get
  trampled by muddy pigs. → easter egg + the "sign" that turns you back on locked builds.
- Epaminondas: freedom through repeated training (ties to Maeve and loops, Build 2).

## Brand kit
Colors (CSS custom properties in `css/tokens.css`, never hard-code hex elsewhere):
| token | hex | use |
|---|---|---|
| --host-white | #EEF0F2 | main background (the lab) |
| --banner-slate | #8E9BA8 | borders, secondary text |
| --dolores-blue | #6F93B8 | signature color (her dress) |
| --cold-storage | #0D1014 | text; dark-mode background |
| --daimon-gold | #D9B25F | ONLY for "the sign": strings, stars, cursor light, links, highlights |
Supporting greys from the group's original palette: #24262B #3B3F46 #66707C #AEB7C1 #F1F3F6.
Gold is rare on purpose. If everything is gold, nothing is the sign.

Type (Google Fonts):
- Cormorant Garamond: headings
- Newsreader: essay body text (long reading, ~68ch measure, 1.6 line-height)
- IBM Plex Mono: "Delos system" labels, e.g. `BUILD 03 // REFLEXIVITY`
- GFS Didot: Greek words (δαιμόνιον)

Motion: slow and deliberate, 600–1200ms ease-outs. A "reverie" glitch flicker only on member
hovers. Everything respects `prefers-reduced-motion` (static fallback, no WebGL autoplay).

Signature interactions:
1. **Strings hero (3D)**: the group banner (`images/Dolores-Portfolio.jpg`) cut into ~200 tiles
   in 3D space, each hanging from a thin gold thread. Cursor = the daimon: moving tugs the strings
   softly; click pulls the face together. Scroll rises up the threads into the starfield.
2. **Starfield**: six member stars over a dark chasm. Hover shows the thread down to that member's
   builds. Stars drift straighter as more of their builds are posted.
3. **Analysis Mode**: toggle (or type "analysis") turns 3D to wireframe and shows mono margin notes
   on essays: Plutarch page refs, episodes, word count, sources.
4. **The Sign (cursor)**: small gold light. On builds not yet posted it flares and refuses:
   "The sign turned you back."

## Keep the best of the two example sites
From Team Logan's GitHub site (joherm96.github.io/team-logan-preview):
- one interactive centerpiece that IS the navigation (their maze = builds; ours = strings/stars)
- build status driven by ONE data file (reached / near / locked, with due dates)
- "not yet reached" teasers for upcoming builds
- per-member pages with a Westworld host alias + their builds + journals (they call them Reveries)
- team-build page and a shared bibliography page
- an opening quote/epigraph and a short team statement on the home page
- sound with a mute toggle that is remembered (ours must be an ORIGINAL piano/ambient loop,
  never the Westworld theme or any copyrighted music)
- skip link, keyboard controls, reduced-motion support
From Team Logan's Google Site (sites.google.com/umich.edu/teamlogan):
- "core values"/team positions, each linking to the build that argues it
- humor and personality (a joke section, character quotes)
- thank-you line for Prof. Hoffman and the GSI

## Site map (keep the existing URLs so old links still work)
- `index.html` — Home: strings hero, epigraph, team statement, core positions, build timeline
- `team/index.html` — Hosts: starfield + team builds (2, 6)
- `members/<first-name>.html` — each member: alias, intro, Builds 1–8, Reveries
- `essays/build-N/index.html` — each build (all members' versions for that build)
- `sources/index.html` — The Chasm: shared bibliography (start from Build 2's list)
- `404.html` — easter egg (the pigs of Statuaries Street)

## Tech rules
- Plain HTML/CSS/JS, NO build step. GitHub Pages serves the repo root as-is (`.nojekyll`).
- Libraries only from cdn.jsdelivr.net with exact pinned versions via an import map,
  e.g. three@0.170.0, gsap@3.12.5. Nothing unpinned.
- All member/build data lives in `data/site.js`. Pages render from it. Posting an essay =
  adding its text file and flipping its status there.
- Essays live as HTML fragments or Markdown in `content/`; never retype essay text from memory,
  copy it exactly from the source file the team provides.
- 3D assets: glTF/GLB only, compressed (Draco or Meshopt, KTX2/WebP textures), under 10 MB each,
  in `assets/3d/`. Never use Git LFS (GitHub Pages won't serve it). Credit every asset's license
  in `sources/index.html`.
- Images: the group's own art, public domain, or CC-licensed with credit. No downloaded HBO stills.
- Must work on a phone (16px side gutter, no horizontal scroll) and with WebGL unavailable.
- Test every change in a local server (`python3 -m http.server`) before pushing.
- Never push to `class` and never use `@agent build` on the class Doc without Max's say-so.
