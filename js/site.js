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
const STATUS = { reached: "Reached", near: "Near", locked: "Locked" };

const body = document.body;
const page = body.dataset.page;

/* ---------- shared data helpers ---------- */
const buildName = (b) => b.title || `Build ${b.n}`;
const buildHref = (n, anchor = "") => href(`essays/build-${n}/index.html${anchor ? "#" + anchor : ""}`);
const authorsFor = (b) => (b.team ? [{ id: "team", name: "Team Dolores" }] : members);
const entryFor = (b, id) => b.entries[id] || { status: "locked" };
const memberHref = (id) => href(`members/${id}.html`);
const reachedCount = (id) => builds.filter((b) => entryFor(b, b.team ? "team" : id).status === "reached").length;
const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const label = (b) => `BUILD ${pad(b.n)}${b.theme ? " // " + b.theme.toUpperCase() : ""}${b.team ? " // TEAM BUILD" : ""}`;
const aliasLabel = (m) => (m.alias ? `HOST // ${esc(m.alias.toUpperCase())}${m.placeholder ? " (PLACEHOLDER)" : ""}` : "HOST // ALIAS PENDING");
const portrait = (m, cls = "") => (m.photo
  ? `<img class="portrait ${cls}" src="${href(m.photo)}" alt="Portrait of ${esc(m.name)}" width="320" height="400" loading="lazy">`
  : `<div class="portrait is-placeholder ${cls}" role="img" aria-label="Placeholder portrait for ${esc(m.name)}"><span>${esc(m.name[0])}</span><small>PHOTO PENDING</small></div>`);
const buildDots = (m) => `<ol class="build-dots" aria-label="${esc(m.name)}’s builds">${builds.map((b) => {
  const id = b.team ? "team" : m.id, e = entryFor(b, id), label = `Build ${b.n}${b.team ? " (team)" : ""}`;
  return e.status === "reached"
    ? `<li><a class="bd is-reached" href="${buildHref(b.n, id)}" aria-label="${label}: posted">${pad(b.n)}</a></li>`
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
  const pos = $("#positions");
  if (pos) pos.innerHTML = positions.length
    ? `<div class="grid">${positions.map((p) => `<article class="card"><p>${esc(p.claim)}</p><p class="label"><a href="${buildHref(p.build)}">Argued in Build ${p.build}</a></p></article>`).join("")}</div>`
    : `<p class="empty">Our core positions will be posted here as the builds argue them, each linked to its build.</p>`;
  const fun = $("#humor");
  if (fun) fun.innerHTML = humor.jokes.length || humor.quotes.length
    ? `<div class="grid">${humor.jokes.map((j) => `<article class="card joke"><p class="label">Off-loop</p><p>${esc(j)}</p></article>`).join("")}${humor.quotes.map((q) => `
        <figure class="card quote"><blockquote><p>“${esc(q.text)}”</p></blockquote>
        <figcaption class="label">${esc(q.who)}${q.episode ? " // " + esc(q.episode) : ""}</figcaption></figure>`).join("")}</div>`
    : `<p class="empty">The team’s jokes and favorite lines will appear here.</p>`;
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
          <p class="label">${aliasLabel(m)}</p>
          <h2 class="panel-name">${esc(m.name)}</h2>
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
  $("#member").innerHTML = `
    <div class="member-head">
      ${portrait(m)}
      <div>
        <p class="label">${aliasLabel(m)}</p>
        <h1>${esc(m.name)}</h1>
        <p class="lede">${m.intro ? esc(m.intro) : "An introduction is coming."}</p>
      </div>
    </div>

    <section class="section" aria-labelledby="builds-h">
      <h2 id="builds-h">Builds</h2>
      <ol class="member-builds">${builds.map((b) => {
        const e = entryFor(b, b.team ? "team" : m.id);
        const link = e.status === "reached"
          ? `<a href="${buildHref(b.n, b.team ? "team" : m.id)}">${esc(e.title || buildName(b))}</a>`
          : `<span data-locked>${esc(buildName(b))}</span>`;
        return `<li><span class="num">BUILD ${pad(b.n)}</span><span class="what">${link}${b.team ? ` <span class="label">· team</span>` : ""}</span>${statusChip(e.status)}</li>`;
      }).join("")}</ol>
    </section>

    <section class="section" aria-labelledby="rev-h">
      <h2 id="rev-h">Reveries</h2>
      ${m.reveries.length
        ? `<div class="grid">${m.reveries.map((r) => `<article class="card"><p class="label">${esc(r.date || "")}</p><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></article>`).join("")}</div>`
        : `<p class="empty">No reveries yet.</p>`}
    </section>`;
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
      : `<li class="locked" data-locked>${esc(a.name)} <span class="label">· locked</span></li>`).join("")}</ul></nav>
    ${authors.map((a) => {
      const e = entryFor(b, a.id);
      return `<article class="essay" id="${a.id}" aria-labelledby="${a.id}-h">
        <h2 id="${a.id}-h"><a href="${a.id === "team" ? href("team/index.html") : memberHref(a.id)}">${esc(a.name)}</a></h2>
        ${e.status === "reached"
          ? `<p class="essay-meta">${e.words ? e.words + " words" : ""}${e.pages?.length ? " · Plutarch pp. " + e.pages.join(", ") : ""}</p><div class="prose" data-src="${esc(e.file)}"><p class="empty">Loading…</p></div>`
          : refusal()}
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
renderChrome();
mountAnalysis();
mountSound();
mountSign();
maybeStringsHero();
maybeOracle();
({ home: renderHome, essays: renderEssaysIndex, team: renderTeam, member: renderMember, build: renderBuild, sources: renderSources }[page] || (() => {}))();
