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
  course: "HONORS 241 · What Westworld Teaches us about Being Human",
  term: "Fall 2026",
  professor: "Prof. George Hoffman",
  gsi: "Israa Khalifa",
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
    n: 1, title: null, theme: "Engagement with a short passage", team: false, due: "2026-09-11", status: "reached",
    entries: {
      kenna: { status: "reached", title: null, file: "content/build-1/kenna.html", words: 730, pages: ["83", "99", "108", "109", "111"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
      max:   { status: "reached", title: null, file: "content/build-1/max.html",   words: 686, pages: ["92", "92–93", "104"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
      mia:   { status: "reached", title: null, file: "content/build-1/mia.html",   words: 120, pages: ["104–105"],
             sources: ["Plutarch, Socrates’ Daimonion, trans. Russell"], episodes: [] },
    },
  },
  {
    n: 2, title: null, theme: "Applying the team reading to Westworld", team: true, due: "2026-09-25", status: "reached",
    entries: {
      // Copied verbatim from the team's final Build 2 PDF (bibliography moved to `sources` below).
      // The essay quotes no page numbers; `pages` are the Plutarch passages it discusses.
      team: { status: "reached", title: null, file: "content/build-2/team.html", words: 933,
              pages: ["91", "98–99", "104–105", "111"],
              sources: ["Plutarch, Socrates’ Daimonion, trans. Russell", "Westworld, Season 1"],
              episodes: ["S1E7 Trompe L’Oeil", "S1E10 The Bicameral Mind"] },
    },
  },
  { n: 3, title: null, theme: "Thematic analysis", team: false, due: "2026-10-09", status: "locked", entries: {} },
  { n: 4, title: null, theme: "Objection & modification", team: false, due: "2026-10-23", status: "locked", entries: {} },
  { n: 5, title: null, theme: "Compare & contrast", team: false, due: "2026-11-06", status: "locked", entries: {} },
  { n: 6, title: null, theme: "Team conclusion", team: true,  due: "2026-11-20", status: "near", entries: {} },
  { n: 7, title: null, theme: "Personal reflections: transitions from the Log", team: false, due: "2026-12-11", status: "locked", entries: {} },
  { n: 8, title: null, theme: "Overall conclusion", team: false, due: "2026-12-18", status: "locked", entries: {} },
];

// Humor: the team's jokes and favorite character lines for the home page. Left empty on purpose:
// the team fills these in. Quote lines exactly; no invented quotes.
// jokes:  ["…"]
// quotes: [{ text: "…", who: "Dr. Ford", episode: "S1E1 The Original" }]
export const humor = { jokes: [], quotes: [] };

// Core positions: each one links to the build that argues it. Add as the team agrees on them.
// { claim: "…", build: 3 }
export const positions = [];

// The Chasm: shared bibliography + asset credits. The Build 2 group is copied verbatim from the team PDF;
// its Plutarch entry (Russell, Selected Essays and Dialogues, Oxford UP, 1993) matches "Primary texts".
export const sources = [
  {
    group: "Primary texts",
    items: [
      "Plutarch. <i>Socrates’ Daimonion</i> (<i>On the Sign of Socrates</i>). Translated by D. A. Russell. In <i>Plutarch: Selected Essays and Dialogues</i>. Oxford: Oxford University Press, 1993.",
      "<i>Westworld</i>, Season 1. Created by Jonathan Nolan and Lisa Joy. HBO, 2016.",
    ],
  },
  {
    group: "Build 2 bibliography (team)",
    items: [
      "Aristotle. <i>Topics</i>. C. 330 BCE. <i>Metaphysics</i>. C. 350 BCE. <i>The Basic Works of Aristotle</i>. Ed. Richard McKeon. New York: Random House, 1941.",
      "Augustine of Hippo, Saint. <i>Confessiones</i>. 398. Trans. F. J. Sheed. <i>The Confessions of St. Augustine.</i> New York: Sheed &amp; Ward, 1943.",
      "Baars, Bernard J. “The Global Workspace Theory of Consciousness Predictions and Results.” <i>The Blackwell Companion to Consciousness.</i> Eds. Susan Schneider and Max Velmans. 2nd edn. Oxford: B. Blackwell, 2017. 229-42",
      "<i>The Bhagavad Gita: Krishna’s Counsel in Time of War.</i> Trans. Barbara Stoler Miller. New York: Bantam, 1986.",
      "<i>The Bhagavad Gita.</i> Trans. Shri Purohit Swami. New York: Vintage 1977.",
      "Bloom, Paul. “Being in Time: How Much Should We Value the Past, Present, and Future.” <i>New Yorker,</i> 9 July 2021.",
      "Chomsky, Noam. Interview in <i>Is the Man Who Is Tall Happy?</i> Michel Gondry. 2013.",
      "Dennett, Daniel. <i>Consciousness Explained.</i> Boston: Little, Brown &amp; Co, 1991.",
      "Descartes, René. <i>Meditations</i>. 1641. <i>The Philosophical Writings.</i> 3 vols. Trans. John Cottingham, Robert Stoothoff, and Dugald Murdoch. Cambridge: Cambridge University Press, 1985.",
      "Elias, Norbert. <i>Die höfische Gesellschaft.</i> 1933. Frankfurt: Suhrkamp, 1983. <i>The Court Society.</i> Trans. Edmund Jephcott. New York: Pantheon, 1969; Dublin: University College Dublin Press, 2006.",
      "-----------. <i>Die Gesellschaft des Individuen.</i> 1939. Frankfurt: Suhrkamp, 1987. <i>The Society of Individuals.</i> Trans. Edmund Jephcott. Oxford: B. Blackwell, 1991.",
      "-----------, with Dunning, Eric. <i>The Quest for Excitement: Sport and Leisure in the Civilizing Process.</i> Oxford: Blackwell, 1986.",
      "Fanon, Frantz. <i>Peau noire, masques blancs.</i> Paris: Seuil, 1952. Trans. Charles Lam Markmann. <i>Black Skin, White Masks.</i> New York: Grove, 1967.",
      "-----------. <i>Les Damnés de la terre.</i> Paris: F. Maspero, 1961. Trans. Constance Farrington. The <i>Wretched of The Earth.</i> Preface by Jean-Paul Sartre. New York: Grove, 1963.",
      "Gell, Alfred. <i>Art and Agency: An Anthropological Theory.</i> Oxford: Clarendon Press; New York: Oxford University Press, 1989.",
      "Halligan, Peter &amp; Oakley, David A. \"What If Consciousness Is Just a Product of Our Non-Conscious brain?” <i>The Conversation</i>, 20 December 2018.",
      "Hegel, Georg Wilhelm Friedrich. <i>Phänomenologie des Geistes.</i> Bamberg and Würzburg: J. A. Goebhardt, 1807. Trans. Terry Pinkard. <i>The Phenomenology of Spirit.</i> Cambridge: Cambridge University Press, 2019. Trans. A.V. Miller. <i>Hegel’s Phenomenology of Spirit.</i> Oxford: Oxford University Press, 1976.",
      "Horn, Tina. “What the Rape Scenes in Westworld Say about Rape Culture.” <i>Refinery</i> 29, 4 December 2016.",
      "Huxley, Thomas H. “On the Hypothesis That Animals Are Automata, and Its History.” <i>Fortnightly Review</i> 16 (1874): 555-80.",
      "Iacoboni, Marco. <i>Mirroring People: The New Science of How We Connect with Others.</i> New York: Farrar, Strauss, and Giroux, 2008.",
      "Jackson, Frank. “Epiphenomenal Qualia.” <i>Philosophical Quarterly</i> 32 (1982): 127–36.",
      "Jaynes, Julian. <i>The Origin of Consciousness in the Breakdown of the Bicameral Mind.</i> Boston: Houghton Mifflin, 1976.",
      "Kalfrin, Valerie. “Westworld and the Power of Repetition.” <i>Final Draft,</i> 2 December 2016.",
      "Kant, Immanuel. “Conjectural Beginning of Human History.” 1786. <i>Toward Perpetual Peace and Other Writings.</i> Ed. Pauline Kleingeld. New Haven: Yale University Press, 2006.",
      "Larmore, Charles. <i>Les Pratiques du moi.</i> Paris: PUF, 2004. Trans. Sharon Bowman. <i>The Practices of the Self.</i> Chicago: University of Chicago Press, 2010.",
      "Lemoine, Blake. “Is LaMDA Sentient? An Interview,” <i>The Medium,</i> 11 June 2022.",
      "Libet, B., Gleason, C. A.. Wright, E. W., &amp; Pearl, D. K. “Time of Conscious Intention To Act in Relation to Onset of Cerebral Activities (Readiness-Potential); The Unconscious Initiation of a Freely Voluntary Act.” <i>Brain</i> 106 (1983): 623-42.",
      "Lucretius, Titus Carus. <i>De rerum matura</i>. 54 BCE. Trans. William Henry Denham Rouse. <i>On the Nature of Things.</i> Cambridge, MA: Harvard University Press, 1924.",
      "Manassi, Mauro, and Whitney, David. “Illusion of visual stability through active perceptual serial dependence.” <i>Science Advances</i> 8: 2, 12 January 2022.",
      "Milton, John. <i>Paradise Lost</i>. 1667. Ed. Gordon Teskey. New York, W. W. Norton, 2005.",
      "Montaigne, Michel de. <i>Essays</i>. 1580/1588/1592. Trans. Donald Frame. <i>The Complete Works of Montaigne.</i> 1943. Stanford: Stanford University Press, 1958.",
      "Nagel, Thomas, “What Is It Like To Be a Bat?” <i>The Philosophical Review</i> 83: 4 (1974), 435-50.",
      "Niedenthal, P.M., Brauer, M., Halberstadt, J.B., &amp; Innes-Ker, A.H. “When Did Her Smile Drop? Facial Mimicry and the Influences of Emotional State on the Detection of Change in Emotional Expression.” <i>Cognition and Emotion</i> 15 (2001): 853-64.",
      "Nietzsche, Friedrich. <i>Beyond Good and Evil.</i> New York: Vintage, 1984.",
      "Nolan, Christopher, dir., and Nolan, Jonathan, screenplay. <i>Memento</i>. Produced by Suzanne Todd and Jennifer Todd. Summit entertainment, 2000.",
      "Parfit, Derek. <i>Reasons and Persons.</i> Oxford: Oxford University Press, 1986.",
      "Plato. <i>Republic</i>. C. 380 BCE. Trans. C. D. C. Reeve. Indianapolis, IN: Hackett, 2004.",
      "-----------. <i>Phaedo</i>. C. 347 BCE. Tran. G. M. A. Grube. 2nd edn. Indianapolis, IN: Hackett, 1977.",
      "Plutarchus, Lucius Mestrius. <i>Moralia</i>. 95. Trans. Donald Russell. <i>Selected Essays and Dialogues.</i> Oxford: Oxford University Press, 1993.",
      "Porter, Jon. “Google suspends engineer who claims its AI is sentient.” <i>The Verge</i>, 13 June 2022.",
      "Ramachandran, V.S. <i>The Tell-Tale Brain: A Neuroscientist’s Quest for What Makes Us Human.</i> New York: W.W. Norton, 2011.",
      "Reid, Thomas. <i>The Works of Thomas Reid, D.D.: Now Fully Collected, with Selections from His Unpublished Letters.</i> Ed. T. Reid, W. Hamilton, and D. Stewart. Edinburgh: Maclachlan and Stewart, 1846.",
      "Riesman, Abraham. \"Westworld Creators Reveal Whether Maeve Is in Control When She Gets Off the Train.\" <i>Vulture</i>, 6 December 2016.",
      "Rothman, Joshua. “Are We Already Living in Virtual Reality?” <i>The New Yorker</i>. April 2, 2018.",
      "Scarry, Elaine. <i>The Body in Pain: the Making and Unmaking of the World.</i> Oxford: Oxford University Press, 1985.",
      "Schopenhauer, Arthur. “Preisschrift über die Freiheit des Willens.” 1839. Trans. Eric F. J. Payne. <i>Prize Essay on the Freedom of the Will.</i> Cambridge: Cambridge University Press, 1999.",
      "Schurger, Aaron. “The Neuropsychology of Conscious Volition.” <i>The Blackwell Companion to Consciousness.</i> Eds. Susan Schneider and Max Velmans. 2nd edn. Oxford: B. Blackwell, 2017. 695-710.",
      "Screech, M[ichael] A., ed. <i>Montaigne's Annotated Copy of Lucretius: A Transcription and Study of the Manuscript, Notes and Pen-Marks.</i> Geneva: Droz, 1998.",
      "Seligman, Adam et al. <i>Ritual and Its Consequences: An Essay on the Limits of Sincerity.</i> New York: Oxford University Press, 2008.",
      "Seth, Anil. “Your Brain Hallucinates Your Conscious Reality.” <i>TED Talks.</i> April 2017.",
      "South, James B. &amp; Engels, Kimberly S., eds. <i>Westworld and Philosophy.</i> Oxford: Wiley, 2018.",
      "Specter, Michael. “Partial Recall: Can Neuroscience Help Us Rewrite Our Most Traumatic Memories?” <i>The New Yorker.</i> May 19, 2014.",
      "Spinoza, Baruch. <i>Ethica Ordine Geometrico Demonstrata.</i> 1665. <i>Opera Posthuma.</i> Amsterdam: Jan Rieuwertsz, 1677. Trans. Samuel Shirley. <i>Ethics, Treatise on the Emendation of the Intellect.</i> Indianapolis, IN: Hackett, 1992.",
      "Velmans, Max. “Is Human Information Processing Conscious?” <i>Behavioral and Brain Sciences</i> 14: 4 (1991): 651–68.",
      "-----------. “How Could Conscious Experiences Affect Brains?” <i>Journal of Consciousness Studies</i> 9: 11 (2002): 3-29.",
      "<i>Westworld</i>. Season one, “The Maze.” October 2-December 4, 2016. Season two, “The Door.” April 22-June 24, 2018. Created by Jonathan Nolan and Lisa Joy. Produced by Jonathan Nolan, Lisa Joy, J. J. Abrams, Jerry Weintraub, and Bryan Burk. HBO.",
      "Wittgenstein, Ludwig. <i>Philosophical Investigations.</i> 1953. Trans. G. E. M. Anscombe. Oxford: Blackwell, 1958.",
    ],
  },
  {
    group: "Site assets",
    items: [
      "Banner artwork (<code>images/Dolores-Portfolio.jpg</code>): Team Dolores.",
      "Typefaces via Google Fonts, SIL Open Font License: Cormorant Garamond, Newsreader, IBM Plex Mono, GFS Didot.",
      "3D rendering: three.js r170 (MIT License), loaded from jsDelivr. The strings hero, threads, stars and film grain are original code.",
      "Player piano (Essays page): original three.js model built in code, no downloaded assets; proportions from Smithsonian and Ingenium records of early-1900s upright player pianos. The roll is generated from our build data.",
      "Portrait of Socrates, plaster cast after the Villa Albani portrait (inv. 1040), 3D scan by SMK – Statens Museum for Kunst with Scan the World, Public Domain Mark: <a href=\"https://www.myminifactory.com/object/3d-print-portrait-of-socrates-50341\">https://www.myminifactory.com/object/3d-print-portrait-of-socrates-50341</a>",
    ],
  },
];
