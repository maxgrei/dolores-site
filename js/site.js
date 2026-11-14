// Team Dolores — renders every page from data/site.js. No build step.
import { site, members, builds, positions, sources, humor } from "../data/site.js";
import { mountSign } from "./sign.js";
import { mountAnalysis, annotateEssay } from "./analysis.js";
import { mountSound } from "./sound.js";

const ROOT = new URL("../", import.meta.url);          // site root, works under any sub-path
const href = (p) => new URL(p, ROOT).href;
const $ = (sel) => document.querySelector(sel);
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STATUS = { reached: "Reached", near: "Near", locked: "Locked", posting: "Being posted" };
// past-due builds with nothing posted read "Being posted", not "Locked" (future builds stay locked)
const TODAY = new Date().toISOString().slice(0, 10);
const pastDue = (b) => Boolean(b.due && b.due < TODAY);
for (const b of builds) if (b.status === "locked" && pastDue(b)) b.status = "posting";

const body = document.body;
const page = body.dataset.page;

/* ---------- shared data helpers ---------- */
const buildName = (b) => b.title || `Build ${b.n}`;
const buildHref = (n, anchor = "") => href(`essays/build-${n}/index.html${anchor ? "#" + anchor : ""}`);
const authorsFor = (b) => (b.team ? [{ id: "team", name: "Team Dolores" }] : members);
const entryFor = (b, id) => b.entries[id] || { status: pastDue(b) ? "posting" : "locked" };
const memberHref = (id) => href(`members/${id}.html`);
const reachedCount = (id) => builds.filter((b) => entryFor(b, b.team ? "team" : id).status === "reached").length;
const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const label = (b) => `BUILD ${pad(b.n)}${b.theme ? " // " + b.theme.toUpperCase() : ""}${b.team ? " // TEAM BUILD" : ""}`;
const AWAIT = "AWAITING CALIBRATION";
const aliasLabel = (m) => `HOST // ${m.designation ? esc(m.designation.toUpperCase()) : AWAIT}`;
const fileNo = (m) => String(members.indexOf(m) + 1).padStart(2, "0");
const field = (v) => (v ? esc(v) : `<span class="await">${AWAIT}</span>`);
// attribute matrix: exactly three { name, value 1–20 } -> thin mono sliders with a gold fill
const attrs = (m) => (m.attributes?.length === 3
  ? `<ul class="attr-matrix">${m.attributes.map((a) => {
      const v = Math.max(1, Math.min(20, Number(a.value) || 0));
      return `<li><span class="attr-name">${esc(a.name)}</span><span class="attr-track" role="meter" aria-label="${esc(a.name)}" aria-valuemin="1" aria-valuemax="20" aria-valuenow="${v}"><span class="attr-fill" style="width:${(v / 20) * 100}%"></span></span><span class="attr-val">${String(v).padStart(2, "0")}</span></li>`;
    }).join("")}</ul>`
  : `<p class="await">${AWAIT}</p>`);
const reverieLine = (m) => (m.reverie?.believed && m.reverie?.now
  ? `<p class="reverie-line">I believed ${esc(m.reverie.believed)} <span class="arrow" aria-hidden="true">→</span><span class="visually-hidden">, and</span> Now I think ${esc(m.reverie.now)}</p>`
  : `<p class="await">${AWAIT}</p>`);
// photos render as Delos "host captures": gold corner brackets, mono caption strip, scan line on hover;
// Analysis Mode crossfades to the -lab capture when there is one. No photo -> the placeholder.
const pic = (src, alt, cls) => `<picture class="${cls}"><source srcset="${href(src)}.avif" type="image/avif">` +
  `<img src="${href(src)}.jpg" width="640" height="800" alt="${alt}" loading="lazy" decoding="async"></picture>`;
const portrait = (m, cls = "") => {
  if (!m.photo) return `<div class="portrait is-placeholder ${cls}" role="img" aria-label="Placeholder portrait for ${esc(m.name)}"><span>${esc(m.name[0])}</span><small>PHOTO PENDING</small></div>`;
  const who = esc(m.name.toUpperCase());
  return `<figure class="capture ${cls}${m.photoLab ? " has-lab" : ""}">
    <div class="capture-frame">
      ${pic(m.photo, `${esc(m.name)}, host capture`, "cap-main")}
      ${m.photoLab ? pic(m.photoLab, "", "cap-lab") : ""}
      <span class="cap-scan" aria-hidden="true"></span><span class="cap-corners" aria-hidden="true"></span>
    </div>
    <figcaption class="capture-strip"><span class="cap-main-label">HOST CAPTURE // ${who} // ${esc(m.photoPlace || "FIELD")}</span>${m.photoLab ? `<span class="cap-lab-label">HOST CAPTURE // ${who} // LAB</span>` : ""}</figcaption>
  </figure>`;
};
const buildDots = (m) => `<ol class="build-dots" aria-label="${esc(m.name)}’s builds">${builds.map((b) => {
  const id = b.team ? "team" : m.id, e = entryFor(b, id), label = `Build ${b.n}${b.team ? " (team)" : ""}`;
  return e.status === "reached"
    ? `<li><a class="bd is-reached" href="${buildHref(b.n, id)}" aria-label="${label}: posted">${pad(b.n)}</a></li>`
    : e.status === "posting"
      ? `<li><span class="bd is-posting" aria-label="${label}: being posted">${pad(b.n)}</span></li>`
      : `<li><span class="bd is-locked" data-locked aria-label="${label}: locked">${pad(b.n)}</span></li>`;
}).join("")}</ol>`;
const statusChip = (s) => `<span class="status status-${s}">${STATUS[s]}</span>`;

function buildMeta(b) {
  const bits = [b.team ? "Team build" : "Individual"];
  const nb = (t) => t.replace(/ /g, "\u00a0");          // keep "due Oct 9" / "3 of 6 posted" on one line
  if (b.due) bits.push(nb(`due ${fmtDate(b.due)}`));
  if (b.status === "reached") {
    const n = Object.values(b.entries).filter((e) => e.status === "reached").length;
    bits.push(b.team ? "posted" : nb(`${n} of ${members.length} posted`));
  }
  return bits.join(" · ");
}

/* ---------- chrome ---------- */
function renderChrome() {
  const nav = [
    ["home", "Home", "index.html"],
    ["team", "Hosts", "team/index.html"],
    ["essays", "Essays", "essays/index.html"],
    ["sources", "The Chasm", "sources/index.html"],
  ];
  const current = body.dataset.nav || page;
  const header = $("#site-header");
  if (header) header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="${href("index.html")}">
        <span class="brand-name">${esc(site.team)}</span>
        <span class="label">HONORS 241 // Westworld × Plutarch</span>
      </a>
      <nav class="site-nav" aria-label="Main"><ul>
        ${nav.map(([k, t, p]) => `<li><a href="${href(p)}"${k === current ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}
        <li><button class="sound-toggle" type="button" aria-pressed="false" title="Original ambient piano, off by default">Sound <span class="state">Off</span></button></li>
        <li><button class="analysis-toggle" type="button" aria-pressed="false" title="Analysis Mode (or type “analysis”)">Analysis</button></li>
      </ul></nav>
    </div>`;
  const footer = $("#site-footer");
  if (footer) footer.innerHTML = `
    <div class="wrap">
      <p>Thank you to ${esc(site.professor)} and our GSI, ${esc(site.gsi)}.</p>
      <p class="label">${esc(site.course)} // ${esc(site.term)}</p>
    </div>`;
}

/* ---------- pieces ---------- */
const timeline = () => `<ol class="timeline">${builds.map((b) => `
  <li><a href="${buildHref(b.n)}"${b.status === "reached" ? "" : " data-locked"}>
    <span class="num">BUILD ${pad(b.n)}</span>
    <span class="name">${esc(buildName(b))}</span>
    ${statusChip(b.status)}
    ${b.theme ? `<span class="theme">${esc(b.theme)}</span>` : ""}
    <span class="meta">${esc(buildMeta(b))}</span>
  </a></li>`).join("")}</ol>`;

const refusal = (extra = "") => `
  <div class="sign-refusal">
    <p class="label">Not yet reached${extra}</p>
    <p>The sign turned you back.</p>
  </div>`;

/* ---------- pages ---------- */
function renderHome() {
  const tl = $("#timeline");
  if (tl) tl.innerHTML = timeline();
  // "What we argue" and "Improvisations" stay hidden until data/site.js has entries
  if (positions.length) {
    $("#positions").innerHTML = `<div class="grid">${positions.map((p) => `<article class="card"><p>${esc(p.claim)}</p><p class="label"><a href="${buildHref(p.build)}">Argued in Build ${p.build}</a></p></article>`).join("")}</div>`;
    $("#positions-section").hidden = false;
  }
  if (humor.jokes.length || humor.quotes.length) {
    $("#humor").innerHTML = `<div class="grid">${humor.jokes.map((j) => `<article class="card joke"><p class="label">Off-loop</p><p>${esc(j)}</p></article>`).join("")}${humor.quotes.map((q) => `
        <figure class="card quote"><blockquote><p>“${esc(q.text)}”</p></blockquote>
        <figcaption class="label">${esc(q.who)}${q.episode ? " // " + esc(q.episode) : ""}</figcaption></figure>`).join("")}</div>`;
    $("#humor-section").hidden = false;
  }
  // Act III: the hosts, as a compact strip of stars (photos where we have them)
  const teaser = $("#host-teaser");
  if (teaser) teaser.innerHTML = members.map((m) => `
    <li><a class="teaser-host" href="${memberHref(m.id)}">
      <span class="dot" aria-hidden="true"></span>
      ${m.photo ? portrait(m, "is-small") : `<span class="teaser-blank" aria-hidden="true">${esc(m.name[0])}</span>`}
      <span class="who">${esc(m.name)}</span>
      <span class="count">FILE ${fileNo(m)} // ${reachedCount(m.id)} / ${builds.length}</span>
    </a></li>`).join("");
  maybeLoop();
}

/* ---------- Act II: the player piano in "keys" mode ---------- */
function maybeLoop() {
  const sec = document.querySelector("[data-loop]");
  if (!sec || !document.documentElement.classList.contains("can-3d")) return;
  const authorsOf = (b) => (b.team ? ["Team Dolores"] : members.filter((m) => entryFor(b, m.id).status === "reached").map((m) => m.name));
  const cardHTML = (b) => {
    const who = authorsOf(b);
    const go = b.status === "reached"
      ? `<a class="player-go" href="${buildHref(b.n)}">Read ${esc(buildName(b))}</a>`
      : b.status === "posting" ? `<span class="player-go is-quiet">Being posted</span>`
      : `<a class="player-go" href="${buildHref(b.n)}" data-locked>${b.status === "near" ? "Near: not yet punched" : "Not yet reached"}</a>`;
    return `<p class="label">${label(b)}</p><h3>${esc(buildName(b))}</h3>
      ${b.theme ? `<p class="loop-theme">${esc(b.theme)}</p>` : ""}
      <p class="player-meta">${statusChip(b.status)} <span>${b.status === "reached" ? `Posted: ${esc(who.join(", "))}` : esc(buildMeta(b))}</span></p>${go}`;
  };
  const watch = () => new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    import("./piano.js").then((m) => m.mountPiano(sec, { builds, members, cardHTML, mode: "keys" }))
      .catch(() => sec.classList.add("is-failed"));            // the plain build list below still works
  }, { rootMargin: "400px 0px" }).observe(sec);
  document.readyState === "complete" ? watch() : addEventListener("load", watch, { once: true });
}

/* ---------- the lab opening: once per visit, skippable, static with reduced motion ---------- */
function mountLabOpening() {
  const root = document.documentElement;
  if (!root.classList.contains("lab-opening")) return;
  try { sessionStorage.setItem("dolores:opened", "1"); } catch { /* storage blocked: plays each load */ }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let done = false;
  const end = () => {
    if (done) return; done = true;
    ["keydown", "pointerdown", "wheel", "touchstart", "scroll"].forEach((ev) => removeEventListener(ev, end, true));
    if (reduce) { root.classList.remove("lab-opening"); return; }
    root.classList.add("lab-closing");
    setTimeout(() => root.classList.remove("lab-opening", "lab-closing"), 800);
  };
  ["keydown", "pointerdown", "wheel", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, end, { capture: true, passive: true }));
  setTimeout(end, reduce ? 2600 : 3600);
}

function renderEssaysIndex() {
  $("#timeline").innerHTML = timeline();
  const sec = document.querySelector("[data-player]");
  if (!sec || !document.documentElement.classList.contains("can-3d")) return;
  const cardHTML = (b) => {
    const read = b.status === "reached"
      ? `<a class="player-go" href="${buildHref(b.n)}">Read ${esc(buildName(b))}</a>`
      : `<a class="player-go" href="${buildHref(b.n)}" data-locked>${b.status === "near" ? "Near: not yet punched" : "Not yet reached"}</a>`;
    return `<p class="label">${label(b)}</p><h2>${esc(buildName(b))}</h2>
      <p class="player-meta">${statusChip(b.status)} <span>${esc(buildMeta(b))}</span></p>${read}`;
  };
  const go = () => import("./piano.js").then((m) => m.mountPiano(sec, { builds, members, cardHTML }))
    .catch(() => document.documentElement.classList.remove("can-3d"));     // fall back to the still
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 200));
  document.readyState === "complete" ? idle() : addEventListener("load", idle, { once: true });
}

function renderTeam() {
  const root = $("#starfield");
  root.querySelector("#star-panel").innerHTML = `<p class="panel-prompt">Hover or tap a star to follow its thread down to that host’s builds.</p>`;
  import("./starfield.js").then(({ mountStarfield }) => mountStarfield(root, {
    members, builds, memberHref,
    posted: reachedCount,
    panelHTML: (m) => `
      <div class="panel-inner">
        ${portrait(m, "is-small")}
        <div class="panel-body">
          <p class="label">FILE ${fileNo(m)} // ${aliasLabel(m)}</p>
          <h2 class="panel-name">${esc(m.name)}</h2>
          <p class="panel-spec"><span>${field(m.generation)}</span><span>CORE DRIVE: ${field(m.coreDrive)}</span></p>
          ${m.attributes?.length === 3 ? attrs(m) : ""}
          ${buildDots(m)}
          <a class="panel-link" href="${memberHref(m.id)}">Visit ${esc(m.name)}’s page</a>
        </div>
      </div>`,
  }));
  $("#team-builds").innerHTML = builds.filter((b) => b.team).map((b) => `
    <article class="card">
      <p class="label">${label(b)}</p>
      <h3><a href="${buildHref(b.n)}"${b.status === "reached" ? "" : " data-locked"}>${esc(buildName(b))}</a></h3>
      <p>${statusChip(b.status)}</p>
      ${b.n === 6 ? `<p>The collaborative conclusion.</p>` : ""}
    </article>`).join("");
}

function renderMember() {
  const m = members.find((x) => x.id === body.dataset.member);
  if (!m) return;
  document.title = `${m.name} · ${site.team}`;
  const spec = [["Designation", m.designation], ["Generation", m.generation], ["Point of origin", m.origin],
    ["Core drive", m.coreDrive], ["Cornerstone", m.cornerstone]];
  $("#member").innerHTML = `
    <div class="host-file">
      <div class="host-head">
        ${portrait(m)}
        <div class="host-id">
          <p class="label">DELOS // HOST PROFILE // FILE ${fileNo(m)}</p>
          <h1>${esc(m.name)}</h1>
          <p class="label">${aliasLabel(m)}</p>
        </div>
      </div>
      <dl class="spec-sheet">${spec.map(([k, v]) => `<div><dt>${k}</dt><dd>${field(v)}</dd></div>`).join("")}</dl>

      <section class="host-block" aria-labelledby="attr-h">
        <h2 id="attr-h" class="label">Attribute matrix</h2>
        ${attrs(m)}
      </section>
      <section class="host-block" aria-labelledby="rev-h">
        <h2 id="rev-h" class="label">Reverie</h2>
        ${reverieLine(m)}
      </section>

      <section class="host-block" aria-labelledby="builds-h">
        <h2 id="builds-h" class="label">Builds // ${reachedCount(m.id)} of ${builds.length} reached</h2>
        <ol class="host-builds">${builds.map((b) => {
          const id = b.team ? "team" : m.id, e = entryFor(b, id);
          const name = `${esc(buildName(b))}${b.theme ? ` <span class="theme">${esc(b.theme)}</span>` : ""}`;
          const head = e.status === "reached"
            ? `<a href="${buildHref(b.n, id)}">${name}</a>`
            : `<span${e.status === "locked" || e.status === "near" ? " data-locked" : ""}>${name}</span>`;
          return `<li>
            <div class="hb-row"><span class="num">BUILD ${pad(b.n)}${b.team ? " // TEAM" : ""}</span><span class="what">${head}</span>${statusChip(e.status)}</div>
            ${e.claim ? `<blockquote class="hb-claim">“${esc(e.claim)}”</blockquote>` : ""}
          </li>`;
        }).join("")}</ol>
      </section>
    </div>`;
}

async function renderBuild() {
  const b = builds.find((x) => x.n === Number(body.dataset.build));
  if (!b) return;
  document.title = `${buildName(b)} · ${site.team}`;
  const head = `
    <p class="label">${label(b)}</p>
    <h1>${esc(buildName(b))}</h1>`;
  const main = $("#build");

  if (b.status !== "reached") {
    main.innerHTML = head + refusal(b.due ? ` // due ${fmtDate(b.due)}` : "");
    return;
  }

  const authors = authorsFor(b);
  main.innerHTML = head + `
    <nav aria-label="Essays in this build"><ul class="toc">${authors.map((a) => entryFor(b, a.id).status === "reached"
      ? `<li><a href="#${a.id}">${esc(a.name)}</a></li>`
      : entryFor(b, a.id).status === "posting"
        ? `<li class="locked">${esc(a.name)} <span class="label">· being posted</span></li>`
        : `<li class="locked" data-locked>${esc(a.name)} <span class="label">· locked</span></li>`).join("")}</ul></nav>
    ${authors.map((a) => {
      const e = entryFor(b, a.id);
      return `<article class="essay" id="${a.id}" aria-labelledby="${a.id}-h">
        <h2 id="${a.id}-h"><a href="${a.id === "team" ? href("team/index.html") : memberHref(a.id)}">${esc(a.name)}</a></h2>
        ${e.status === "reached"
          ? `<p class="essay-meta">${e.words ? e.words + " words" : ""}${e.pages?.length ? " · Plutarch pp. " + e.pages.join(", ") : ""}</p><div class="prose" data-src="${esc(e.file)}"><p class="empty">Loading…</p></div>`
          : e.status === "posting" ? `<div class="sign-refusal"><p class="label">Being posted</p><p>This essay is on its way.</p></div>` : refusal()}
      </article>`;
    }).join("")}`;

  await Promise.all([...main.querySelectorAll("[data-src]")].map(async (el) => {
    try {
      const res = await fetch(href(el.dataset.src));
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
      const id = el.closest(".essay").id, a = authors.find((x) => x.id === id);
      annotateEssay(el, entryFor(b, id), { author: a.name, build: b.n });
    } catch {
      el.innerHTML = `<p class="empty">This essay could not be loaded.</p>`;
    }
  }));
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function renderSources() {
  $("#sources").innerHTML = sources.map((g) => `
    <section class="section" aria-label="${esc(g.group)}">
      <h2>${esc(g.group)}</h2>
      <ul class="biblio">${g.items.map((i) => `<li>${i}</li>`).join("")}</ul>
    </section>`).join("");
}

/* ---------- strings hero (lazy, progressive) ---------- */
function maybeStringsHero() {
  const hero = document.querySelector(".hero[data-strings]");
  if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;   // static banner stays
  const go = () => import("./hero.js").then((m) => m.mountHero(hero)).catch(() => hero.classList.remove("is-3d"));
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 200));
  document.readyState === "complete" ? idle() : addEventListener("load", idle, { once: true });
}

/* ---------- the oracle (Socrates' head), loaded only as it nears the viewport ---------- */
function maybeOracle() {
  const sec = document.querySelector("[data-oracle]");
  if (!sec || !document.documentElement.classList.contains("can-3d")) return;
  const watch = () => new IntersectionObserver(([e], io) => {            // never competes with first paint
    if (!e.isIntersecting) return;
    io.disconnect();
    import("./oracle.js").then((m) => m.mountOracle(sec, href("assets/3d/socrates.glb")))
      .catch(() => document.documentElement.classList.remove("can-3d"));   // fall back to the still
  }, { rootMargin: "400px 0px" }).observe(sec);
  document.readyState === "complete" ? watch() : addEventListener("load", watch, { once: true });
}

/* ---------- boot ---------- */
(() => {                                       // 3D allowed? (motion on + WebGL) -> tall scroll stages
  const c = document.createElement("canvas");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && (c.getContext("webgl2") || c.getContext("webgl")))
    document.documentElement.classList.add("can-3d");
})();
mountLabOpening();
renderChrome();
mountAnalysis();
mountSound();
mountSign();
maybeStringsHero();
maybeOracle();
({ home: renderHome, essays: renderEssaysIndex, team: renderTeam, member: renderMember, build: renderBuild, sources: renderSources }[page] || (() => {}))();
