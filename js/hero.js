// Strings hero — the banner cut into tiles, each hanging from a gold thread.
// "The human soul, with all its countless puppet-strings of impulse ... needs no blow";
// the strings are "reins with some give in them" (Plutarch, 104–105).
// Lazy-loaded by js/site.js only when WebGL works and reduced motion is off.
import * as THREE from "three";

const COLS = 12, ROWS = 18, N = COLS * ROWS;           // 216 tiles
const FOV = 30;
const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const prefersDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

function rng(seed) {                                      // deterministic fracture
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export async function mountHero(hero) {
  const img = hero.querySelector(".hero-figure img");
  const button = hero.querySelector(".hero-pull");
  const canvas = document.createElement("canvas");
  canvas.className = "hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  const coarse = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 20000);
  const tex = await new THREE.TextureLoader().loadAsync(img.currentSrc || img.src);
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const gold = new THREE.Color(token("--daimon-gold"));
  const slate = new THREE.Color(token("--banner-slate"));
  const blue = new THREE.Color(token("--dolores-blue"));
  const additive = () => (prefersDark() ? THREE.AdditiveBlending : THREE.NormalBlending);

  /* ---------- tiles: one instanced draw call ---------- */
  const plane = new THREE.PlaneGeometry(1, 1);
  const uvOffset = new Float32Array(N * 2);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    uvOffset[i * 2] = c / COLS;
    uvOffset[i * 2 + 1] = 1 - (r + 1) / ROWS;
  }
  plane.setAttribute("aOffset", new THREE.InstancedBufferAttribute(uvOffset, 2));
  const tileMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uTile: { value: new THREE.Vector2(1 / COLS, 1 / ROWS) }, uFade: { value: 1 }, uEdge: { value: 1 }, uXray: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec2 aOffset; uniform vec2 uTile; varying vec2 vUv; varying vec2 vLocal;
      void main() {
        vUv = aOffset + uv * uTile; vLocal = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uFade; uniform float uEdge; uniform float uXray; varying vec2 vUv; varying vec2 vLocal;
      void main() {
        vec4 c = texture2D(uMap, vUv);
        vec2 e = min(vLocal, 1.0 - vLocal);                 // faint edge so fractures read
        float edge = smoothstep(0.0, 0.035, min(e.x, e.y));
        vec3 rgb = c.rgb * mix(1.0 - 0.18 * uEdge, 1.0, edge);
        rgb = mix(rgb, vec3(dot(rgb, vec3(0.299, 0.587, 0.114))), uXray);   // analysis: greyscale x-ray
        gl_FragColor = vec4(rgb, uFade * (1.0 - 0.55 * uXray));
      }`,
    side: THREE.DoubleSide, transparent: true,
  });
  const wireMat = new THREE.MeshBasicMaterial({ color: blue, wireframe: true, transparent: true, opacity: 0.85 });
  const tiles = new THREE.InstancedMesh(plane, tileMat, N);
  tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tiles.frustumCulled = false;
  scene.add(tiles);
  const wires = new THREE.InstancedMesh(plane, wireMat, N);   // shares the tiles' matrices
  wires.instanceMatrix = tiles.instanceMatrix;
  wires.frustumCulled = false;
  wires.visible = false;
  scene.add(wires);

  /* ---------- threads: glowing ribbons (soft bloom without a post pass) ---------- */
  const tPos = new Float32Array(N * 4 * 3), tSide = new Float32Array(N * 4), tAlong = new Float32Array(N * 4), tIdx = [];
  for (let i = 0; i < N; i++) {
    tSide.set([-1, 1, -1, 1], i * 4); tAlong.set(i < COLS ? [0, 0, 1, 1] : [0, 0, 0, 0], i * 4);
    const o = i * 4; tIdx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
  }
  const threadGeo = new THREE.BufferGeometry();
  threadGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
  threadGeo.setAttribute("aSide", new THREE.BufferAttribute(tSide, 1));
  threadGeo.setAttribute("aAlong", new THREE.BufferAttribute(tAlong, 1));
  threadGeo.setIndex(tIdx);
  const threadMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: gold.clone() }, uOpacity: { value: 0.9 }, uGlow: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSide; attribute float aAlong; varying float vSide; varying float vAlong;
      void main() { vSide = aSide; vAlong = aAlong; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity; uniform float uGlow; varying float vSide; varying float vAlong;
      void main() {
        float d = abs(vSide);
        float core = 1.0 - smoothstep(0.15, 0.45, d);
        float glow = exp(-d * d * 3.0) * 0.3 * uGlow;
        float a = (core + glow) * uOpacity * mix(1.0, 0.3, vAlong);
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: additive(),
  });
  const threads = new THREE.Mesh(threadGeo, threadMat);
  threads.frustumCulled = false;
  scene.add(threads);

  /* ---------- knots + stars: soft gold points ---------- */
  const pointMat = (size, opacity) => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: gold.clone() }, uSize: { value: size }, uPR: { value: renderer.getPixelRatio() },
      uOpacity: { value: opacity }, uTime: { value: 0 }, uCamZ: { value: 1000 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uSize; uniform float uPR; uniform float uTime; uniform float uCamZ;
      varying float vTw;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.65 + 0.35 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
        gl_PointSize = uSize * (0.6 + aSeed) * uPR * (uCamZ / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity; varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = (exp(-d * d * 4.0) * 0.8 + (1.0 - smoothstep(0.0, 0.18, d))) * uOpacity * vTw;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true, depthWrite: false, blending: additive(),
  });
  const seeds = (n, f) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(); return a; };
  const rand = rng(241);

  const knotGeo = new THREE.BufferGeometry();
  const kPos = new Float32Array(N * 3);
  knotGeo.setAttribute("position", new THREE.BufferAttribute(kPos, 3).setUsage(THREE.DynamicDrawUsage));
  knotGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds(N, () => 0.2 + rand() * 0.3), 1));
  const knotMat = pointMat(7, 0.75);
  const knots = new THREE.Points(knotGeo, knotMat);
  knots.frustumCulled = false;
  scene.add(knots);

  const STARS = coarse ? 160 : 280;
  const starGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(STARS * 3);
  starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds(STARS, () => rand()), 1));
  const starSeed = Array.from({ length: STARS }, () => [rand(), rand(), rand()]);
  const starMat = pointMat(9, 0);
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  /* ---------- per-tile state ---------- */
  const base = new Float32Array(N * 2);           // assembled position (world = CSS px at z=0)
  const frac = new Float32Array(N * 6);           // fractured offset: x y z, rx ry rz
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), phase = new Float32Array(N);
  const bot = new Float32Array(N * 3);            // bottom-centre of each tile this frame
  const HALF = 2.2;                              // ribbon half-width in px (core ~1px + glow)
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / COLS);
    // fracture in bands, like the banner art: whole runs of tiles pushed forward or back together
    const band = Math.sin(r * 0.9 + rand() * 0.6) * 0.5 + 0.5;
    frac.set([(rand() - 0.5) * 0.22, (rand() - 0.5) * 0.16, (band - 0.45) * 150 + (rand() - 0.5) * 70,
      (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.08], i * 6);
    phase[i] = rand() * Math.PI * 2;
  }

  let W = 1, H = 1, tw = 1, th = 1, faceTop = 0, faceCx = 0, anchorY = 0, s0 = 0;
  function layout() {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.position.set(0, 0, (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
    starMat.uniforms.uCamZ.value = knotMat.uniforms.uCamZ.value = camera.position.z;
    const hr = hero.getBoundingClientRect(), ir = img.getBoundingClientRect();
    const left = ir.left - hr.left - W / 2, top = H / 2 - (ir.top - hr.top);
    tw = ir.width / COLS; th = ir.height / ROWS;
    faceTop = top; faceCx = left + ir.width / 2; anchorY = top + Math.max(H, 700) * 1.6;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      base[i * 2] = left + (c + 0.5) * tw;
      base[i * 2 + 1] = top - (r + 0.5) * th;
    }
    for (let i = 0; i < STARS; i++) {
      const [a, b, c] = starSeed[i];
      sPos.set([(a - 0.5) * W * 2.2, faceTop + H * 0.2 + b * H * 2.6, -200 - c * 1600], i * 3);
    }
    starGeo.attributes.position.needsUpdate = true;
    // start rising only once the face itself has been seen (matters on phones)
    s0 = Math.max(0, (ir.top + window.scrollY) - 80);
  }

  /* ---------- input: the daimon tugs, it never strikes ---------- */
  const ptr = { x: 0, y: 0, vx: 0, vy: 0, t: 0, inside: false };
  const idle = { x: 0, y: 0, vx: 0, vy: 0 };
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(), now = performance.now();
    const x = e.clientX - r.left - W / 2, y = H / 2 - (e.clientY - r.top) + camera.position.y;
    const dt = Math.max(8, now - ptr.t) / 1000;
    if (ptr.inside) { ptr.vx = ptr.vx * 0.6 + ((x - ptr.x) / dt) * 0.4; ptr.vy = ptr.vy * 0.6 + ((y - ptr.y) / dt) * 0.4; }
    Object.assign(ptr, { x, y, t: now, inside: true });
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { ptr.inside = false; });

  let gather = 0, gatherTarget = 0;
  const setGather = (on) => {
    gatherTarget = on ? 1 : 0;
    if (button) { button.setAttribute("aria-pressed", String(on)); button.textContent = on ? "Let the strings go" : "Pull the face together"; }
  };
  canvas.addEventListener("click", () => setGather(gatherTarget === 0));
  if (button) { button.hidden = false; button.addEventListener("click", () => setGather(gatherTarget === 0)); }

  /* ---------- analysis mode: wireframe ---------- */
  const applyAnalysis = (on) => {
    wires.visible = on;
    tileMat.uniforms.uXray.value = on ? 1 : 0;
    threadMat.uniforms.uColor.value.copy(on ? slate : gold);
    threadMat.uniforms.uGlow.value = on ? 0 : 1;
    knotMat.uniforms.uColor.value.copy(on ? blue : gold);
  };
  applyAnalysis(document.documentElement.classList.contains("analysis"));
  addEventListener("dolores:analysis", (e) => applyAnalysis(e.detail.on));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    threadMat.blending = knotMat.blending = starMat.blending = additive();
    threadMat.needsUpdate = knotMat.needsUpdate = starMat.needsUpdate = true;
  });

  /* ---------- loop ---------- */
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  let running = true, last = performance.now(), time = 0, lastRise = -1;
  const K = 26, C = 5.2, R = 150;               // spring, damping (under-damped: "reins with some give")

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000); last = now; time += dt;

    // scroll: rise up the threads toward the stars
    const rise = Math.max(0, window.scrollY - s0) * 1.35;
    camera.position.y = rise;
    camera.rotation.x = Math.min(rise / H, 1) * 0.12;
    const r01 = Math.min(1, rise / (H * 0.7));
    if (Math.abs(r01 - lastRise) > 0.002) { hero.style.setProperty("--rise", r01.toFixed(3)); lastRise = r01; }
    starMat.uniforms.uOpacity.value = Math.min(1, r01 * 1.4);
    starMat.uniforms.uTime.value = knotMat.uniforms.uTime.value = time;
    tileMat.uniforms.uFade.value = 1 - r01 * 0.65;

    gather += (gatherTarget - gather) * (1 - Math.exp(-dt * 2.6));
    const loose = 1 - gather;
    tileMat.uniforms.uEdge.value = loose;
    ptr.vx *= Math.exp(-dt * 6); ptr.vy *= Math.exp(-dt * 6);
    // idle drift: until a real cursor arrives, a slow invisible "daimon" wanders across the face,
    // so the strings read as strings before anyone moves the mouse
    if (!ptr.inside) {
      const nx = faceCx + Math.sin(time * 0.31) * tw * 4, ny = faceTop - ROWS * th * 0.45 + Math.cos(time * 0.23) * th * 6;
      if (!idle.seeded) { idle.x = nx; idle.y = ny; idle.seeded = true; }
      idle.vx = ((nx - idle.x) / Math.max(dt, 0.001)) * 0.55; idle.vy = ((ny - idle.y) / Math.max(dt, 0.001)) * 0.55;
      idle.x = nx; idle.y = ny;
    }
    const P = ptr.inside ? ptr : idle;
    const pSpeed = Math.hypot(P.vx, P.vy);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3, i6 = i * 6, ph = phase[i];
      const tx = base[i * 2] + frac[i6] * tw * loose + Math.sin(time * 0.6 + ph) * 2.2 * loose;
      const ty = base[i * 2 + 1] + frac[i6 + 1] * th * loose + Math.cos(time * 0.5 + ph) * 1.4 * loose;
      const tz = frac[i6 + 2] * loose + Math.sin(time * 0.4 + ph) * 8 * loose;
      let ax = K * (tx - pos[i3]) - C * vel[i3];
      let ay = K * (ty - pos[i3 + 1]) - C * vel[i3 + 1];
      let az = K * (tz - pos[i3 + 2]) - C * vel[i3 + 2];
      if (pSpeed > 1) {
        const dx = pos[i3] - P.x, dy = pos[i3 + 1] - P.y, d = Math.hypot(dx, dy);
        if (d < R) { const w = (1 - d / R) ** 2; ax += P.vx * w * 2.4; ay += P.vy * w * 1.6; az -= pSpeed * w * 0.9; }
      }
      vel[i3] += ax * dt; vel[i3 + 1] += ay * dt; vel[i3 + 2] += az * dt;
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;

      e3.set(frac[i6 + 3] * loose + vel[i3 + 1] * 0.0006, frac[i6 + 4] * loose + vel[i3] * 0.0007, frac[i6 + 5] * loose - vel[i3] * 0.0009);
      q.setFromEuler(e3);
      const sc = 1.004 - 0.06 * loose;
      m.compose(p3.set(pos[i3], pos[i3 + 1], pos[i3 + 2]), q, s3.set(tw * sc, th * sc, 1));
      tiles.setMatrixAt(i, m);

      // thread from the tile's top edge: to the tile above it, or (top row) up into the dark
      const el = m.elements;
      const bx = el[12] + el[4] * 0.5, by = el[13] + el[5] * 0.5, bz = el[14] + el[6] * 0.5;
      bot[i3] = el[12] - el[4] * 0.5; bot[i3 + 1] = el[13] - el[5] * 0.5; bot[i3 + 2] = el[14] - el[6] * 0.5;
      let axp, ayp, azp;
      if (i < COLS) { axp = faceCx + (base[i * 2] - faceCx) * 0.55; ayp = anchorY; azp = -60; }
      else { const u = (i - COLS) * 3; axp = bot[u]; ayp = bot[u + 1]; azp = bot[u + 2]; }
      let nx = -(ayp - by), ny = axp - bx; const nl = Math.hypot(nx, ny) || 1; nx = (nx / nl) * HALF; ny = (ny / nl) * HALF;
      const o = i * 12;
      tPos[o] = bx - nx; tPos[o + 1] = by - ny; tPos[o + 2] = bz;
      tPos[o + 3] = bx + nx; tPos[o + 4] = by + ny; tPos[o + 5] = bz;
      tPos[o + 6] = axp - nx; tPos[o + 7] = ayp - ny; tPos[o + 8] = azp;
      tPos[o + 9] = axp + nx; tPos[o + 10] = ayp + ny; tPos[o + 11] = azp;
      kPos[i3] = bx; kPos[i3 + 1] = by; kPos[i3 + 2] = bz + 0.5;
    }
    tiles.instanceMatrix.needsUpdate = true;
    threadGeo.attributes.position.needsUpdate = true;
    knotGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // seed positions at their fractured rest so the first frame isn't a jump
  layout();
  for (let i = 0; i < N; i++) {
    pos[i * 3] = base[i * 2] + frac[i * 6] * tw; pos[i * 3 + 1] = base[i * 2 + 1] + frac[i * 6 + 1] * th; pos[i * 3 + 2] = frac[i * 6 + 2];
  }
  const start = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  const stop = () => { running = false; };
  new ResizeObserver(() => layout()).observe(hero);
  new IntersectionObserver(([en]) => (en.isIntersecting && !document.hidden ? start() : stop())).observe(hero);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  requestAnimationFrame((t) => {
    last = t; frame(t);
    hero.classList.add("is-3d");                 // crossfade static banner -> threads
  });
}
