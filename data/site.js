// Team Dolores — the ONE data file. Every page renders from this.
//
// Posting an essay:
//   1. save its text, copied exactly, to content/build-N/<member>.html
//   2. add (or flip) its entry under that build's `entries` below to status: "reached"
//   3. set the build's own `status` to "reached" once any entry is posted
//
// Status values: "reached" (posted) · "near" (due soon, show teaser) · "locked" (not yet).
// A member with no entry for a build counts as locked.

export const site = {
  team: "Team Dolores",
  course: "HONORS 241 · Philosophy of Mind through Westworld",
  term: "Fall 2026",
  professor: "Prof. George Hoffman",
  reading: "Plutarch, Socrates’ Daimonion (On the Sign of Socrates), trans. Russell",
  show: "Westworld, Season 1",
  epigraph: {
    // Verbatim from the passage quoted in Mia's Build 1 essay.
    text: "The human soul, with all its countless puppet-strings of impulse, is by far the most sensitive machine of all.",
    cite: "Plutarch, Socrates’ Daimonion, 104",
  },
};

// Six member slots. PLACEHOLDERS: `alias` (Westworld host alias) and `photo` are stand-ins until
// each member sends theirs. photo = path under images/members/ (e.g. "images/members/kenna.webp") or null.
// `placeholder: true` marks the alias as a stand-in so pages can label it.
export const members = [
  { id: "kenna",  name: "Kenna",  alias: "Host 01", placeholder: true, photo: null, intro: null, reveries: [] },
  { id: "max",    name: "Max",    alias: "Host 02", placeholder: true, photo: null, intro: null, reveries: [] },
  { id: "mia",    name: "Mia",    alias: "Host 03", placeholder: true, photo: null, intro: null, reveries: [] },
  { id: "alexis", name: "Alexis", alias: "Host 04", placeholder: true, photo: null, intro: null, reveries: [] },
  { id: "meer",   name: "Meer",   alias: "Host 05", placeholder: true, photo: null, intro: null, reveries: [] },
  { id: "leo",    name: "Leo",    alias: "Host 06", placeholder: true, photo: null, intro: null, reveries: [] },
];

// Builds 1–8. Builds 2 and 6 are team builds (one entry, id "team").
// `due` is an ISO date string ("2026-12-04") or null.
// `pages` are the Plutarch page refs cited in the essay (for Analysis Mode).
// `words` counts the essay body, not the opening quotation.
// `sources` and `episodes` (Westworld S1 episodes cited, e.g. "S1E10 The Bicameral Mind") feed Analysis Mode.
export const builds = [
  {
    n: 1, title: null, theme: null, team: false, due: null, status: "reached",
    entries: {
      kenna: { status: "reached", title: null, file: "content/build-1/kenna.html", words: 730, pages: ["83", "99", "108", "109", "111"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
      max:   { status: "reached", title: null, file: "content/build-1/max.html",   words: 686, pages: ["92", "92–93", "104"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
      mia:   { status: "reached", title: null, file: "content/build-1/mia.html",   words: 120, pages: ["104–105"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
    },
  },
  { n: 2, title: null, theme: null, team: true,  due: null, status: "locked", entries: {} },
  { n: 3, title: null, theme: null, team: false, due: null, status: "locked", entries: {} },
  { n: 4, title: null, theme: null, team: false, due: null, status: "locked", entries: {} },
  { n: 5, title: null, theme: null, team: false, due: null, status: "locked", entries: {} },
  { n: 6, title: null, theme: null, team: true,  due: null, status: "locked", entries: {} },
  { n: 7, title: null, theme: null, team: false, due: null, status: "locked", entries: {} },
  { n: 8, title: null, theme: null, team: false, due: null, status: "locked", entries: {} },
];

// Core positions: each one links to the build that argues it. Add as the team agrees on them.
// { claim: "…", build: 3 }
export const positions = [];

// The Chasm: shared bibliography + asset credits. Build 2's bibliography goes here when posted.
export const sources = [
  {
    group: "Primary texts",
    items: [
      "Plutarch. <i>Socrates’ Daimonion</i> (<i>On the Sign of Socrates</i>). Translated by D. A. Russell. In <i>Plutarch: Selected Essays and Dialogues</i>. Oxford: Oxford University Press, 1993.",
      "<i>Westworld</i>, Season 1. Created by Jonathan Nolan and Lisa Joy. HBO, 2016.",
    ],
  },
  {
    group: "Site assets",
    items: [
      "Banner artwork (<code>images/Dolores-Portfolio.jpg</code>): Team Dolores.",
      "Typefaces via Google Fonts, SIL Open Font License: Cormorant Garamond, Newsreader, IBM Plex Mono, GFS Didot.",
      "3D rendering: three.js r170 (MIT License), loaded from jsDelivr. The strings hero, threads, stars and film grain are original code.",
    ],
  },
];
