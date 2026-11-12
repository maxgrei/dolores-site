// Team Dolores — renders every page from data/site.js. No build step.
import { site, members, builds, positions, sources } from "../data/site.js";

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
const statusChip = (s) => `<span class="status status-${s}">${STATUS[s]}</span>`;

function buildMeta(b) {
  const bits = [b.team ? "Team build" : "Individual"];
  if (b.status === "reached") {
    const n = Object.values(b.entries).filter((e) => e.status === "reached").length;
    bits.push(b.team ? "posted" : `${n} of ${members.length} posted`);
  } else if (b.due) bits.push(`due ${fmtDate(b.due)}`);
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
        <span class="label">HP 241 // Westworld × Plutarch</span>
      </a>
      <nav class="site-nav" aria-label="Main"><ul>
        ${nav.map(([k, t, p]) => `<li><a href="${href(p)}"${k === current ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}
      </ul></nav>
    </div>`;
  const footer = $("#site-footer");
  if (footer) footer.innerHTML = `
    <div class="wrap">
      <p>Thank you to ${esc(site.professor)} and our GSI.</p>
      <p class="label">${esc(site.course)} // ${esc(site.term)}</p>
    </div>`;
}

/* ---------- pieces ---------- */
const timeline = () => `<ol class="timeline">${builds.map((b) => `
  <li><a href="${buildHref(b.n)}">
    <span class="num">BUILD ${pad(b.n)}</span>
    <span class="name">${esc(buildName(b))}</span>
    ${statusChip(b.status)}
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
}

function renderEssaysIndex() {
  $("#timeline").innerHTML = timeline();
}

function renderTeam() {
  $("#stars").innerHTML = members.map((m) => `
    <li class="star"><a href="${memberHref(m.id)}">
      <span class="dot" aria-hidden="true"></span>
      <span class="who">${esc(m.name)}</span>
      <span class="count">${m.alias ? esc(m.alias) + " · " : ""}${reachedCount(m.id)} / 8 builds</span>
    </a></li>`).join("");
  $("#team-builds").innerHTML = builds.filter((b) => b.team).map((b) => `
    <article class="card">
      <p class="label">${label(b)}</p>
      <h3><a href="${buildHref(b.n)}">${esc(buildName(b))}</a></h3>
      <p>${statusChip(b.status)}</p>
      ${b.n === 6 ? `<p>The collaborative conclusion.</p>` : ""}
    </article>`).join("");
}

function renderMember() {
  const m = members.find((x) => x.id === body.dataset.member);
  if (!m) return;
  document.title = `${m.name} · ${site.team}`;
  $("#member").innerHTML = `
    <p class="label">HOST // ${m.alias ? esc(m.alias.toUpperCase()) : "ALIAS PENDING"}</p>
    <h1>${esc(m.name)}</h1>
    <p class="lede">${m.intro ? esc(m.intro) : "An introduction is coming."}</p>

    <section class="section" aria-labelledby="builds-h">
      <h2 id="builds-h">Builds</h2>
      <ol class="member-builds">${builds.map((b) => {
        const e = entryFor(b, b.team ? "team" : m.id);
        const link = e.status === "reached"
          ? `<a href="${buildHref(b.n, b.team ? "team" : m.id)}">${esc(e.title || buildName(b))}</a>`
          : `<span>${esc(buildName(b))}</span>`;
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
      : `<li class="locked">${esc(a.name)} <span class="label">· locked</span></li>`).join("")}</ul></nav>
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

/* ---------- boot ---------- */
renderChrome();
({ home: renderHome, essays: renderEssaysIndex, team: renderTeam, member: renderMember, build: renderBuild, sources: renderSources }[page] || (() => {}))();
