// Starfield — Timarchus' vision (Plutarch, 108–109): souls as stars over a chasm.
// Disciplined souls move straight; undisciplined ones spiral. Here a star's path straightens
// as its member posts more builds. Hover/focus/tap a star: a gold thread drops to that member's builds.
// Plain DOM + SVG + 2D canvas, so it works without WebGL.

const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// home positions in % of the stage, wide and narrow layouts
const WIDE = [[12, 30], [30, 66], [47, 24], [63, 62], [79, 30], [90, 70]];
const NARROW = [[26, 14], [72, 28], [28, 46], [72, 60], [26, 80], [72, 92]];

export function mountStarfield(root, { members, builds, posted, panelHTML, memberHref }) {
  const stage = root.querySelector(".starfield-stage");
  const list = root.querySelector("#stars");
  const panel = root.querySelector("#star-panel");
  const svg = root.querySelector(".starfield-thread");
  const path = svg.querySelector("path");
  const canvas = root.querySelector(".starfield-dust");
  const ctx = canvas.getContext("2d");

  const stars = members.map((m, i) => {
    const n = posted(m.id);
    const straight = n / builds.length;                     // 0 = spirals, 1 = straight line
    const li = document.createElement("li");
    li.className = "star";
    li.innerHTML = `
      <a href="${memberHref(m.id)}" data-id="${m.id}" aria-describedby="star-panel">
        <span class="dot" aria-hidden="true"></span>
        <span class="who">${m.name}</span>
        <span class="count">${n} / ${builds.length} builds</span>
        <span class="diag" aria-hidden="true">PATH ${straight === 0 ? "SPIRAL" : straight === 1 ? "STRAIGHT" : "TIGHTENING"} // S=${straight.toFixed(2)}</span>
      </a>`;
    list.append(li);
    return { m, li, a: li.firstElementChild, straight, ph: i * 1.7 + 0.4, dir: -0.9 + i * 0.37, x: 0, y: 0, hx: 0, hy: 0, trail: [] };
  });

  /* ---------- selection ---------- */
  let selected = null, down = null;
  function select(s) {
    if (selected === s) return;
    selected?.li.classList.remove("is-selected");
    selected = s;
    s.li.classList.add("is-selected");
    panel.innerHTML = panelHTML(s.m);
    path.classList.remove("draw"); void path.getBoundingClientRect(); path.classList.add("draw");
    svg.classList.add("is-on");
    place();
  }
  for (const s of stars) {
    s.a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") select(s); });
    s.a.addEventListener("focus", () => select(s));
    // touch/pen: first tap shows the thread, second tap follows the link.
    // (focus fires between pointerdown and click, so remember what was selected at pointerdown)
    s.a.addEventListener("pointerdown", (e) => { down = e.pointerType === "mouse" ? null : { s, was: selected }; });
    s.a.addEventListener("click", (e) => {
      if (down && down.s === s && down.was !== s) { e.preventDefault(); select(s); }
      down = null;
    });
  }

  /* ---------- layout + motion ---------- */
  let W = 0, H = 0, dpr = 1, dust = [];
  const gold = token("--daimon-gold"), faint = token("--chasm-muted");
  function layout() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const homes = W < 600 ? NARROW : WIDE;
    stars.forEach((s, i) => { s.hx = (homes[i][0] / 100) * W; s.hy = (homes[i][1] / 100) * H; s.trail.length = 0; });
    let seed = 108;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    dust = Array.from({ length: Math.round((W * H) / 2600) }, () => [rnd() * W, rnd() * H, rnd() * 1.1 + 0.2, rnd() * 6.28]);
    svg.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.clientHeight}`);
  }

  function offset(s, t) {
    // undisciplined: a breathing loop that never settles; disciplined: a steady line
    const r = 38 * (0.5 + 0.5 * Math.sin(t * 0.21 + s.ph));
    const a = t * 0.55 + s.ph;
    const spiral = [Math.cos(a) * r, Math.sin(a) * r * 0.75];
    const d = Math.sin(t * 0.35 + s.ph) * 34;
    const line = [Math.cos(s.dir) * d, Math.sin(s.dir) * d];
    return [spiral[0] + (line[0] - spiral[0]) * s.straight, spiral[1] + (line[1] - spiral[1]) * s.straight];
  }

  function place() {
    for (const s of stars) s.li.style.transform = `translate(${s.x}px, ${s.y}px)`;
    if (!selected) return;
    // thread: from the star down to the top of the panel, sagging slightly
    const rr = root.getBoundingClientRect(), sr = stage.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    const x1 = sr.left - rr.left + selected.x, y1 = sr.top - rr.top + selected.y + selected.a.offsetHeight - 10;
    const x2 = Math.min(Math.max(x1, pr.left - rr.left + 24), pr.right - rr.left - 24), y2 = pr.top - rr.top;
    const cx = (x1 + x2) / 2 + (x2 - x1) * 0.15, cy = (y1 + y2) / 2 + 30;
    path.setAttribute("d", `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }

  function draw(t, still) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = faint;
    for (const [x, y, r, p] of dust) {
      ctx.globalAlpha = still ? 0.5 : 0.3 + 0.3 * Math.sin(t * 0.8 + p);
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.strokeStyle = gold; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    for (const s of stars) {
      if (still) {                                         // reduced motion: draw each path's whole shape, once
        ctx.globalAlpha = 0.28; ctx.beginPath();
        for (let k = 0; k <= 240; k++) { const [ox, oy] = offset(s, k * 0.25); k ? ctx.lineTo(s.hx + ox, s.hy + oy) : ctx.moveTo(s.hx + ox, s.hy + oy); }
        ctx.stroke(); continue;
      }
      for (let k = 1; k < s.trail.length; k++) {
        ctx.globalAlpha = Math.sqrt(k / s.trail.length) * 0.75;
        ctx.beginPath(); ctx.moveTo(...s.trail[k - 1]); ctx.lineTo(...s.trail[k]); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  let t = 0, tick = 0, last = performance.now(), running = false;
  function frame(now) {
    if (!running) return;
    t += Math.min(0.05, (now - last) / 1000); last = now; tick++;
    for (const s of stars) {
      const [ox, oy] = offset(s, t);
      s.x = s.hx + ox; s.y = s.hy + oy;
      if (tick % 3 === 0) { s.trail.push([s.x, s.y]); if (s.trail.length > 160) s.trail.shift(); }
    }
    place(); draw(t, false);
    requestAnimationFrame(frame);
  }
  function settle() {                                      // static: stars at home, paths drawn whole
    for (const s of stars) { s.x = s.hx; s.y = s.hy; }
    place(); draw(0, true);
  }
  const start = () => { if (reduced()) return settle(); if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  const stop = () => { running = false; };

  new ResizeObserver(() => { layout(); running ? place() : settle(); }).observe(root);
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(stage);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  layout(); settle(); start();
}
