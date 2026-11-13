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

export function setAnalysis(on, { save = true } = {}) {
  root.classList.toggle("analysis", on);
  document.querySelectorAll(".analysis-toggle").forEach((b) => b.setAttribute("aria-pressed", String(on)));
  const bar = document.querySelector(".analysis-bar");
  if (bar) bar.hidden = !on;
  if (save) store.set(on);
  dispatchEvent(new CustomEvent("dolores:analysis", { detail: { on } }));
}

export function mountAnalysis() {
  const bar = document.createElement("div");
  bar.className = "analysis-bar";
  bar.hidden = true;
  bar.innerHTML = `<span>ANALYSIS MODE // DELOS DIAGNOSTIC</span><span class="hint">type “analysis” or press Esc to exit</span>`;
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
export function annotateEssay(prose, entry, { author, build }) {
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
  card.innerHTML = [
    row("SUBJECT", esc(author)),
    row("BUILD", String(build).padStart(2, "0")),
    row("WORDS", entry.words ?? "—"),
    row("PARAGRAPHS", n),
    row("PLUTARCH", entry.pages?.length ? entry.pages.map((p) => "p." + esc(p)).join(", ") : "none cited"),
    row("EPISODES", entry.episodes?.length ? entry.episodes.map(esc).join("; ") : "none cited"),
    row("SOURCES", entry.sources?.length ? entry.sources.map(esc).join("; ") : "—"),
  ].join("");
  prose.before(card);
}
