// Analysis Mode — the Delos diagnostic view. Toggle in the nav, or type "analysis" anywhere.
// Esc leaves it. The choice lasts for the current visit (sessionStorage, best effort), so a new
// visit always opens on the normal site, never a wireframe hero that looks broken.
// Effects: html.analysis (CSS look), "dolores:analysis" event (hero goes wireframe),
// and mono margin notes on essays built from data/site.js.

const KEY = "dolores:analysis";
const root = document.documentElement;
const store = {
  get() { try { return sessionStorage.getItem(KEY) === "on"; } catch { return false; } },
  set(on) { try { sessionStorage.setItem(KEY, on ? "on" : "off"); localStorage.removeItem(KEY); } catch { /* storage blocked: page only */ } },
};

export const isAnalysis = () => root.classList.contains("analysis");

// KEY nn markers: every [data-key="01 14"] element gets a small mono link per symbol to its entry on
// The Key. Appended inside the element (in the flow, never on top of content); hidden by CSS unless
// html.analysis, so they are only focusable while Analysis Mode is on.
const KEYS = new URL("../keys/index.html", import.meta.url).href;
export function placeKeyMarkers(scope = document) {
  for (const el of scope.querySelectorAll("[data-key]:not([data-keyed])")) {
    el.dataset.keyed = "";
    for (const n of el.dataset.key.split(/\s+/)) {
      el.insertAdjacentHTML("beforeend", ` <a class="key-marker" href="${KEYS}#key-${n}" aria-label="The Key, entry ${n}"><span>KEY ${n}</span></a>`);
    }
  }
}

export function setAnalysis(on, { save = true } = {}) {
  root.classList.toggle("analysis", on);
  document.querySelectorAll(".analysis-toggle").forEach((b) => b.setAttribute("aria-pressed", String(on)));
  const bar = document.querySelector(".analysis-bar");
  if (bar) bar.hidden = !on;
  if (on) placeKeyMarkers();
  if (save) store.set(on);
  dispatchEvent(new CustomEvent("dolores:analysis", { detail: { on } }));
}

export function mountAnalysis() {
  const bar = document.createElement("div");
  bar.className = "analysis-bar";
  bar.hidden = true;
  bar.innerHTML = `<span data-key="05">ANALYSIS MODE // DELOS DIAGNOSTIC</span><a class="bar-key" href="${new URL("../keys/index.html", import.meta.url).href}">THE KEY: what the symbols mean</a><span class="hint">type “analysis” or press Esc to exit</span>`;
  document.body.append(bar);

  document.addEventListener("click", (e) => {
    if (e.target.closest(".analysis-toggle")) setAnalysis(!isAnalysis());
  });

  let typed = "";
  addEventListener("keydown", (e) => {
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.key === "Escape" && isAnalysis()) { setAnalysis(false); return; }
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    typed = (typed + e.key.toLowerCase()).slice(-8);
    if (typed === "analysis") { typed = ""; setAnalysis(!isAnalysis()); }
  });

  setAnalysis(store.get(), { save: false });
}

/* ---------- essay margin notes ---------- */
const CITE = /\((?:Plutarch,\s*)?(\d+(?:[–-]\d+)?)\)/g;
const wordsIn = (el) => (el.textContent.trim().match(/\S+/g) || []).length;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Adds one diagnostic card per essay and a note beside each paragraph. Hidden unless html.analysis.
export function annotateEssay(prose, entry, { author, build, alsoReads = [] }) {
  // the passage the essay opens on, read before any margin notes are inserted (verbatim, trimmed if long)
  const bq0 = prose.querySelector(":scope > blockquote");
  const words = bq0 ? bq0.textContent.trim().split(/\s+/) : [];
  const voice = voiceOf(prose, entry.sources || [], true);       // Whose voice?: mark quoted words now
  const known = new Set(entry.pages || []);
  const paras = [...prose.querySelectorAll(":scope > p, :scope > blockquote")];
  let n = 0;
  for (const el of paras) {
    const refs = [...el.textContent.matchAll(CITE)].map((m) => m[1].replace("-", "–")).filter((p) => known.has(p));
    const isQuote = el.tagName === "BLOCKQUOTE";
    const tag = isQuote ? "EPIGRAPH" : `¶${String(++n).padStart(2, "0")}`;
    const note = document.createElement("span");
    note.className = "mnote";
    note.setAttribute("aria-hidden", "true");
    note.innerHTML = `${tag} · ${wordsIn(el)} W${refs.length ? `<br>PLUTARCH ${[...new Set(refs)].map((r) => "P." + r).join(" · ")}` : ""}`;
    el.classList.add("has-mnote");
    el.prepend(note);
  }
  const card = document.createElement("dl");
  card.className = "analysis-card";
  card.setAttribute("aria-label", "Analysis notes");
  const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  const passage = words.length ? esc(words.slice(0, 28).join(" ")) + (words.length > 28 ? " …" : "") : "";
  const wide = (k, v) => `<div class="wide"><dt>${k}</dt><dd>${v}</dd></div>`;
  card.innerHTML = [
    entry.claim ? wide("CLAIM", `“${esc(entry.claim)}”`) : "",
    passage ? wide("PASSAGE QUOTED", passage) : "",
    row("SUBJECT", esc(author)),
    row("BUILD", String(build).padStart(2, "0")),
    row("WORDS", entry.words ?? "—"),
    row("PARAGRAPHS", n),
    row("PLUTARCH", entry.pages?.length ? entry.pages.map((p) => "p." + esc(p)).join(", ") : "none cited"),
    row("EPISODES", entry.episodes?.length ? entry.episodes.map(esc).join("; ") : "none cited"),
    row("SOURCES", entry.sources?.length ? entry.sources.map(esc).join("; ") : "—"),
    alsoReads.length ? wide("ALSO READS", alsoReads.map((a) => `<span class="also">P.${esc(a.page)}: ${a.refs.map((r) => `<a href="${r.href}">${esc(r.label)}</a>`).join(", ")}</span>`).join("")) : "",
  ].join("");
  prose.before(card);
  card.insertAdjacentHTML("beforebegin", voiceMeter(voice));
  return voice;
}

/* ---------- WHOSE VOICE? quoted words vs the writer's own (KEY 12) ----------
   Counted from quotation marks: every span inside “ ” (or a pair of straight " marks) plus the
   opening passage counts as quoted; everything else is the writer's own voice. Each quote is
   labelled by the citation that follows it in its sentence: Plato (Stephanus refs like 107c),
   Milton (book numerals like IX.708), Descartes (low pages when the essay cites Descartes),
   Plutarch ("Plutarch" or pp.80–130); anything else is just QUOTED. */
const VOICE_ORDER = ["PLUTARCH", "PLATO", "MILTON", "DESCARTES", "QUOTED"];
const wc = (s) => (s.trim().match(/\S+/g) || []).length;

function sourceOf(after, sources = []) {
  const end = after.search(/[.!?][”"’)]*\s+[A-Z“"]/);              // stay inside this sentence
  const span = end === -1 ? after.slice(0, 220) : after.slice(0, end + 1);
  const m = span.match(/\(([^()]{1,48})\)/);
  if (!m) return "QUOTED";
  const c = m[1];
  if (/Plato|Phaedo/i.test(c) || /\b\d{2,3}[a-e]\b/.test(c)) return "PLATO";
  if (/Milton/i.test(c) || /^\s*[IVX]+\.\d/.test(c)) return "MILTON";
  if (/Descartes/i.test(c)) return "DESCARTES";
  if (/Plutarch/i.test(c)) return "PLUTARCH";
  const num = parseInt((c.match(/\d+/) || [])[0], 10);
  if (num && num < 80 && sources.some((s) => /Descartes/.test(s))) return "DESCARTES";
  if (num >= 80 && num <= 130) return "PLUTARCH";
  return "QUOTED";
}

// quoted ranges in a plain string: “…” pairs, or straight "…" pairs
function quoteRanges(text) {
  const out = []; let open = -1, kind = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (open < 0 && (ch === "“" || ch === "\"")) { open = i; kind = ch; }
    else if (open >= 0 && ((kind === "“" && ch === "”") || (kind === "\"" && ch === "\""))) { out.push([open, i + 1]); open = -1; }
  }
  return out;
}

// text nodes of an element with their offsets (margin notes excluded)
function textMap(el) {
  const nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest(".mnote") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let text = "", n;
  while ((n = walker.nextNode())) { nodes.push([n, text.length]); text += n.data; }
  const at = (off) => { for (let i = nodes.length - 1; i >= 0; i--) if (off >= nodes[i][1]) return [nodes[i][0], off - nodes[i][1]]; return [nodes[0][0], 0]; };
  return { text, at, nodes };
}

// counts (and, with wrap = true, marks quoted words with span.voice-q) for one essay's prose
export function voiceOf(prose, sources = [], wrap = false) {
  const by = Object.fromEntries(VOICE_ORDER.map((k) => [k, 0]));
  let total = 0;
  for (const el of prose.querySelectorAll(":scope > p, :scope > blockquote")) {
    const { text, at, nodes } = textMap(el);
    if (!nodes.length) continue;
    const words = wc(text); total += words;
    if (el.tagName === "BLOCKQUOTE") {                          // the opening passage: all quoted (Plutarch)
      by.PLUTARCH += words;
      if (wrap) { const r = document.createRange(); r.selectNodeContents(el); const s = document.createElement("span"); s.className = "voice-q"; s.dataset.src = "PLUTARCH"; s.appendChild(r.extractContents()); el.appendChild(s); }
      continue;
    }
    const ranges = quoteRanges(text).map(([a, b]) => ({ a, b, src: sourceOf(text.slice(b), sources) }));
    for (const r of ranges) by[r.src] += wc(text.slice(r.a, r.b));
    if (wrap) for (const r of [...ranges].reverse()) {          // last first, so earlier offsets stay valid
      const range = document.createRange();
      const [sn, so] = at(r.a), [en, eo] = at(r.b - 1);
      range.setStart(sn, so); range.setEnd(en, eo + 1);
      const s = document.createElement("span"); s.className = "voice-q"; s.dataset.src = r.src;
      s.appendChild(range.extractContents()); range.insertNode(s);
    }
  }
  return { total, by };
}

export const addVoice = (a, b) => ({ total: a.total + b.total, by: Object.fromEntries(VOICE_ORDER.map((k) => [k, (a.by[k] || 0) + (b.by[k] || 0)])) });

// "PLUTARCH 14% · OWN VOICE 86%" (percentages always sum to 100)
export function voiceLine(v) {
  if (!v.total) return "no text";
  const parts = VOICE_ORDER.map((k) => [k, Math.round((v.by[k] / v.total) * 100)]).filter(([, p]) => p > 0);
  const own = 100 - parts.reduce((s, [, p]) => s + p, 0);
  return [...parts.map(([k, p]) => `${k} ${p}%`), `OWN VOICE ${own}%`].join(" · ");
}
export function voiceMeter(v, { title = "WHOSE VOICE?", key = true } = {}) {
  const parts = VOICE_ORDER.map((k) => [k, v.total ? (v.by[k] / v.total) * 100 : 0]).filter(([, p]) => p > 0);
  return `<div class="voice-meter" role="note">
    <p class="voice-head"${key ? ' data-key="12"' : ""}><span class="label">${title}</span> <span class="voice-line">${voiceLine(v)}</span></p>
    <div class="voice-bar" aria-hidden="true">${parts.map(([k, p]) => `<span class="v-${k.toLowerCase()}" style="width:${p.toFixed(1)}%"></span>`).join("")}</div>
    <p class="voice-note">counted from quotation marks</p>
  </div>`;
}
