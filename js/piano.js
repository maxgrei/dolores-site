// The Player Piano — the Westworld piece. An early-1900s upright player piano, modelled in code
// (no downloaded model), whose paper roll IS the build timeline: one punched section per build,
// generated from data/site.js. Scroll winds the roll; the build over the tracker bar is "current".
// Play lets the roll run: each punched hole crossing the bar presses its key and sounds its note
// (through js/sound.js, only with Sound on). The music comes from no player.
// Proportions from museum records (Smithsonian / Ingenium): ~145 × 150 × 68 cm, keys topping at
// 77 cm, sliding spool-box doors, supply spool above / take-up below, 11¼ in paper, 9 holes per inch.
// Lazy-loaded by js/site.js on the Essays page (WebGL + motion only).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { playNote, soundOn, holdAmbient } from "./sound.js";

const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const col = (n) => new THREE.Color(token(n));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- dimensions (metres) ---------- */
const W = 1.5, H = 1.45, D = 0.68;
const KEY = { W: 0.0235, L: 0.15, H: 0.022, BW: 0.0137, BL: 0.09, BH: 0.012, TOP: 0.77 };
const KEYS_W = 52 * KEY.W;                          // 1.222 m of white keys
const FRONT = 0.24;                                 // upper front panel face (set back behind the keys)
const KEY_Z0 = FRONT - 0.01, KEY_Z1 = KEY_Z0 + KEY.L;
const BOX = { x: 0.19, y0: 0.98, y1: 1.34, z: 0.1 }; // spool box opening (half-width) and back wall
const SPOOL_UP = 1.285, SPOOL_DN = 1.035, BAR_Y = 1.16, PAPER_Z = 0.205;
const PAPER_W = 0.286, PAPER_VIS = SPOOL_UP - SPOOL_DN;   // visible paper between spools
const SEG = 512, NB = 8;                            // roll texture: 512 px of paper (= 0.286 m) per build
const VIS = PAPER_VIS / PAPER_W;                    // visible window, in build segments (~0.87)
const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
// notes the roll can play: A minor pentatonic, A3–A5 (keeps every essay's tune consonant)
const SCALE = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

/* ---------- the roll: one punched section per build, drawn from the data ---------- */
// returns { canvas, events: [{ s0, s1, midi }] } with s in build-segment units (0..8, bottom up)
export function makeRoll(builds, members, fonts) {
  const cv = document.createElement("canvas");
  cv.width = SEG; cv.height = SEG * NB;
  const g = cv.getContext("2d");
  // the canvas is a grey MASK for the paper shader: white = paper, mid-grey = print, black = punched hole
  g.fillStyle = "rgb(255,255,255)"; g.fillRect(0, 0, cv.width, cv.height);
  const Y = (i, u) => cv.height - i * SEG - u;       // segment i, u px up from its bottom edge
  const holeX = (m) => 36 + (m - 21 + 0.5) * (440 / 88);   // 88 holes across ~9.7 in, 9 per inch
  const events = [];
  const fmt = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

  builds.forEach((b, i) => {
    // label band at the bottom of the section (it reaches the tracker bar first)
    g.fillStyle = "rgb(70,70,70)";
    g.font = `600 34px ${fonts.mono}`; g.textBaseline = "alphabetic";
    g.fillText(`BUILD ${String(b.n).padStart(2, "0")}`, 36, Y(i, 66));
    g.font = `italic 19px ${fonts.body}`;
    g.fillText(b.theme || "", 36, Y(i, 40));
    g.font = `500 12px ${fonts.mono}`;
    g.fillText([b.due ? `DUE ${fmt(b.due)}` : "", b.team ? "TEAM BUILD" : "", b.status.toUpperCase()].filter(Boolean).join("  ·  "), 36, Y(i, 18));
    g.fillStyle = "rgb(150,150,150)";
    for (let x = 36; x < 476; x += 6) g.fillRect(x, Y(i, 96), 3, 1);          // perforated rule
    if (i) for (let x = 0; x < SEG; x += 8) g.fillRect(x, Y(i, 1), 4, 1);       // seam to the previous build

    const authors = b.team ? [["team", "T"]] : members.map((m) => [m.id, m.name[0]]);
    const posted = authors.map(([id, ini]) => [ini, b.entries[id]]).filter(([, e]) => e && e.status === "reached");
    const U0 = 112, U1 = 496;

    if (b.status === "reached" && posted.length) {
      // each essay becomes a phrase: its length from the word count, its notes from the Plutarch pages it cites
      const phrases = posted.map(([ini, e]) => {
        const pages = (e.pages || ["104"]).map((p) => parseInt(p, 10)).filter(Boolean);
        const n = clamp(Math.round((e.words || 600) / 70), 5, 14);
        return { ini, notes: Array.from({ length: n }, (_, j) => SCALE[(pages[j % pages.length] + j * 3) % SCALE.length]) };
      });
      const total = phrases.reduce((a, p) => a + p.notes.length + 1, 0);
      const step = (U1 - U0) / total;
      let u = U0;
      for (const p of phrases) {
        g.fillStyle = "rgb(110,110,110)"; g.font = `500 11px ${fonts.mono}`;
        g.fillText(p.ini, 10, Y(i, u + 8));                                   // whose essay this phrase is
        p.notes.forEach((m, j) => {
          const len = step * (j === p.notes.length - 1 ? 1.6 : 0.72);
          const hit = (midi) => {
            g.fillStyle = "rgb(0,0,0)";
            g.fillRect(holeX(midi) - 2, Y(i, u + len), 4, len);
            events.push({ s0: i + u / SEG, s1: i + (u + len) / SEG, midi });
          };
          hit(m);
          if (j % 4 === 0) hit(m - 24);                                       // a bass note under each group
          u += step;
        });
        u += step;                                                            // breath between essays
      }
    } else if (b.status === "near") {
      // where the holes will go: faint dashed outlines
      g.strokeStyle = "rgb(165,165,165)"; g.setLineDash([2, 2]); g.lineWidth = 1;
      let seed = b.n * 97;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let u = U0; u < U1 - 20; u += 22) g.strokeRect(holeX(SCALE[Math.floor(rnd() * SCALE.length)]) - 2, Y(i, u + 14), 4, 14);
      g.setLineDash([]);
      g.fillStyle = "rgb(120,120,120)"; g.font = `500 13px ${fonts.mono}`;
      g.fillText("NEAR // NOT YET PUNCHED", 36, Y(i, 300));
    } else {
      g.fillStyle = "rgb(150,150,150)"; g.font = `500 13px ${fonts.mono}`;
      g.fillText("NOT YET REACHED // BLANK PAPER", 36, Y(i, 300));
    }
  });
  return { canvas: cv, events };
}

/* ---------- the scene ---------- */
export async function mountPiano(section, { builds, members, cardHTML }) {
  const stage = section.querySelector(".player-stage");
  const card = section.querySelector(".player-card");
  const prev = section.querySelector("[data-roll=prev]"), next = section.querySelector("[data-roll=next]");
  const canvas = document.createElement("canvas");
  canvas.className = "player-canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.prepend(canvas);

  const coarse = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const gold = col("--daimon-gold"), blue = col("--dolores-blue"), paperC = col("--host-white");
  const key = new THREE.DirectionalLight(col("--host-white"), 2.2); key.position.set(-1.5, 2.4, 2.2); scene.add(key);
  const rimL = new THREE.DirectionalLight(gold, 1.2); rimL.position.set(2, 1.5, -1); scene.add(rimL);
  scene.add(new THREE.HemisphereLight(col("--grey-400"), col("--cold-storage"), 0.25));
  const glow = new THREE.PointLight(gold, 0.6, 0.6, 2); glow.position.set(0, BAR_Y, PAPER_Z - 0.04); scene.add(glow);

  /* materials (ebonised lacquer, ivory, brass, felt) */
  const lacquer = new THREE.MeshPhysicalMaterial({ color: col("--grey-900"), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 });
  const ebony = new THREE.MeshStandardMaterial({ color: col("--cold-storage"), roughness: 0.45 });
  const ivory = new THREE.MeshStandardMaterial({ color: col("--grey-100"), roughness: 0.35 });
  const brass = new THREE.MeshStandardMaterial({ color: gold, metalness: 1, roughness: 0.32 });
  const interior = new THREE.MeshStandardMaterial({ color: col("--cold-storage"), roughness: 0.9 });
  const paperWrap = new THREE.MeshStandardMaterial({ color: paperC, roughness: 0.85 });
  const mats = [lacquer, ebony, ivory, brass, interior, paperWrap];

  const piano = new THREE.Group();
  scene.add(piano);
  const parts = [];                                  // every solid mesh, for the analysis wireframe
  const box = (w, h, d, x, y, z, m = lacquer, r = 0.006) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), m);
    mesh.userData.dims = [w, h, d];
    mesh.position.set(x, y, z); piano.add(mesh); parts.push(mesh); return mesh;
  };
  const cyl = (r, len, x, y, z, m) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 32), m);
    mesh.rotation.z = Math.PI / 2; mesh.position.set(x, y, z); piano.add(mesh); parts.push(mesh); return mesh;
  };

  /* case */
  const cheekX = W / 2 - 0.025;
  box(0.05, H, D, -cheekX, H / 2, 0);                                  // sides
  box(0.05, H, D, cheekX, H / 2, 0);
  box(W + 0.02, 0.05, D + 0.04, 0, H - 0.025, -0.01, lacquer, 0.012);   // lid
  box(W - 0.1, H - 0.1, 0.03, 0, H / 2, -D / 2 + 0.015);                 // back
  box(W - 0.06, 0.08, D - 0.02, 0, 0.04, 0, ebony);                      // plinth
  // lower front panel, with the treadle door opening
  box(W - 0.1, 0.12, 0.03, 0, 0.6, D / 2 - 0.05);
  box(0.36, 0.42, 0.03, -0.53, 0.33, D / 2 - 0.05);
  box(0.36, 0.42, 0.03, 0.53, 0.33, D / 2 - 0.05);
  box(W - 0.1, 0.05, 0.03, 0, 0.105, D / 2 - 0.05);
  box(0.7, 0.4, 0.02, 0, 0.33, D / 2 - 0.16, interior);                  // treadle cavity
  const treadles = [-0.11, 0.11].map((x) => { const t = box(0.17, 0.02, 0.24, x, 0.2, D / 2 - 0.15, ebony, 0.004); t.rotation.x = -0.25; return t; });
  [-0.08, 0, 0.08].forEach((x) => box(0.03, 0.012, 0.11, x, 0.06, D / 2 + 0.02, brass, 0.004));   // piano pedals
  // key bed, key slip, key cheeks
  box(KEYS_W + 0.02, 0.03, KEY.L + 0.08, 0, KEY.TOP - KEY.H - 0.015, (KEY_Z0 + KEY_Z1) / 2 - 0.02);
  box(KEYS_W + 0.02, 0.05, 0.025, 0, KEY.TOP - KEY.H - 0.04, KEY_Z1 + 0.012);
  const blockW = (W - 0.1 - KEYS_W) / 2;
  box(blockW, 0.1, KEY.L + 0.05, -(KEYS_W / 2 + blockW / 2), KEY.TOP - 0.03, (KEY_Z0 + KEY_Z1) / 2);
  box(blockW, 0.1, KEY.L + 0.05, KEYS_W / 2 + blockW / 2, KEY.TOP - 0.03, (KEY_Z0 + KEY_Z1) / 2);
  // fallboard rail just behind the keys, and the upper front panel built around the spool-box opening
  box(KEYS_W, 0.06, 0.05, 0, KEY.TOP + 0.03, KEY_Z0 - 0.02);
  const upW = W - 0.1, sideW = (upW - BOX.x * 2) / 2;
  box(upW, BOX.y0 - 0.8, 0.04, 0, (0.8 + BOX.y0) / 2, FRONT);
  box(upW, H - 0.05 - BOX.y1, 0.04, 0, (BOX.y1 + H - 0.05) / 2, FRONT);
  box(sideW, BOX.y1 - BOX.y0, 0.04, -(BOX.x + sideW / 2), (BOX.y0 + BOX.y1) / 2, FRONT);
  box(sideW, BOX.y1 - BOX.y0, 0.04, BOX.x + sideW / 2, (BOX.y0 + BOX.y1) / 2, FRONT);
  // raised moulding panels either side of the spool box
  [-1, 1].forEach((s) => box(sideW - 0.12, 0.3, 0.012, s * (BOX.x + sideW / 2), 1.16, FRONT + 0.024, lacquer, 0.004));
  // spool box interior
  box(BOX.x * 2, BOX.y1 - BOX.y0, 0.01, 0, (BOX.y0 + BOX.y1) / 2, BOX.z, interior);
  box(0.01, BOX.y1 - BOX.y0, FRONT - BOX.z, -BOX.x + 0.005, (BOX.y0 + BOX.y1) / 2, (FRONT + BOX.z) / 2, interior);
  box(0.01, BOX.y1 - BOX.y0, FRONT - BOX.z, BOX.x - 0.005, (BOX.y0 + BOX.y1) / 2, (FRONT + BOX.z) / 2, interior);
  // sliding doors (open during the intro)
  const doors = [-1, 1].map((s) => box(BOX.x + 0.01, BOX.y1 - BOX.y0 + 0.02, 0.012, s * BOX.x / 2, (BOX.y0 + BOX.y1) / 2, FRONT + 0.03, lacquer, 0.004));

  /* spools, tracker bar, transmission */
  const supply = cyl(0.03, 0.3, 0, SPOOL_UP, PAPER_Z - 0.03, paperWrap);
  const takeup = cyl(0.022, 0.3, 0, SPOOL_DN, PAPER_Z - 0.022, paperWrap);
  [-1, 1].forEach((s) => { cyl(0.012, 0.03, s * 0.165, SPOOL_UP, PAPER_Z - 0.03, brass); cyl(0.012, 0.03, s * 0.165, SPOOL_DN, PAPER_Z - 0.022, brass); });
  box(0.31, 0.016, 0.012, 0, BAR_Y, PAPER_Z - 0.008, brass, 0.004);                 // tracker bar
  const knob = cyl(0.01, 0.014, 0.172, BAR_Y + 0.03, PAPER_Z - 0.004, brass);        // transposing knob
  const sprocket = cyl(0.016, 0.008, 0.172, SPOOL_DN, PAPER_Z - 0.03, brass);        // transmission sprocket
  box(0.004, SPOOL_UP - SPOOL_DN, 0.004, 0.18, (SPOOL_UP + SPOOL_DN) / 2, PAPER_Z - 0.03, ebony, 0.001);  // chain
  // player controls on the key slip: loud · bass soft · treble soft · tempo · play/reroll
  const levers = [-0.42, -0.36, -0.3, 0.3, 0.42].map((x) => {
    const l = box(0.012, 0.004, 0.05, x, KEY.TOP - KEY.H - 0.012, KEY_Z1 + 0.04, brass, 0.002); return l;
  });

  /* keys: 52 white + 36 black, instanced */
  const whiteGeo = new RoundedBoxGeometry(KEY.W - 0.0012, KEY.H, KEY.L, 1, 0.0015);
  const blackGeo = new RoundedBoxGeometry(KEY.BW, KEY.H + KEY.BH, KEY.BL, 1, 0.0015);
  const whites = new THREE.InstancedMesh(whiteGeo, ivory, 52), blacks = new THREE.InstancedMesh(blackGeo, ebony, 36);
  const keyOf = new Map();                           // midi -> { mesh, index, matrix }
  const m4 = new THREE.Matrix4();
  let wi = 0, bi = 0;
  for (let m = 21; m <= 108; m++) {
    if (!isBlack(m)) {
      const x = (wi + 0.5) * KEY.W - KEYS_W / 2;
      m4.makeTranslation(x, KEY.TOP - KEY.H / 2, (KEY_Z0 + KEY_Z1) / 2);
      whites.setMatrixAt(wi, m4); keyOf.set(m, { mesh: whites, i: wi, base: m4.clone() }); wi++;
    } else {
      const x = wi * KEY.W - KEYS_W / 2;
      m4.makeTranslation(x, KEY.TOP - KEY.H / 2 + KEY.BH / 2, KEY_Z0 + KEY.BL / 2);
      blacks.setMatrixAt(bi, m4); keyOf.set(m, { mesh: blacks, i: bi, base: m4.clone() }); bi++;
    }
  }
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < 52; i++) whites.setColorAt(i, white);
  for (let i = 0; i < 36; i++) blacks.setColorAt(i, white);
  piano.add(whites, blacks); parts.push(whites, blacks);
  // a key the roll is holding down: dips 4 mm and takes the sign's gold
  const pressT = new THREE.Matrix4(), keyGold = new THREE.Color().copy(gold).multiplyScalar(1.6);
  function setKey(m, down) {
    const k = keyOf.get(m); if (!k) return;
    pressT.copy(k.base); if (down) pressT.elements[13] -= 0.004;
    k.mesh.setMatrixAt(k.i, pressT); k.mesh.setColorAt(k.i, down ? keyGold : white);
    k.mesh.instanceMatrix.needsUpdate = true; k.mesh.instanceColor.needsUpdate = true;
  }

  /* paper: a shader that reads the roll mask; punched holes show the gold light inside the piano */
  await document.fonts.ready;
  const fonts = { mono: `"${token("--font-mono").split(",")[0].replace(/"/g, "")}"`, body: `"Newsreader"` };
  const roll = makeRoll(builds, members, fonts);
  const rollTex = new THREE.CanvasTexture(roll.canvas);
  rollTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  rollTex.colorSpace = THREE.NoColorSpace;
  const paperU = { uRoll: { value: rollTex }, uOff: { value: 0 }, uRep: { value: VIS / NB }, uPaper: { value: paperC }, uGold: { value: gold },
    uBlue: { value: blue }, uXray: { value: 0 }, uLit: { value: 0.95 } };
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_VIS), new THREE.ShaderMaterial({
    uniforms: paperU,
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uRoll; uniform float uOff; uniform float uRep; uniform vec3 uPaper; uniform vec3 uGold; uniform vec3 uBlue;
      uniform float uXray; uniform float uLit; varying vec2 vUv;
      void main() {
        float t = texture2D(uRoll, vec2(vUv.x, uOff + vUv.y * uRep)).r;
        float bar = exp(-pow((vUv.y - 0.5) / 0.035, 2.0));                 // the tracker bar line
        float curl = 0.78 + 0.22 * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);  // shade into the spools
        vec3 paper = uPaper * mix(0.3, 1.0, t) * curl * 1.18;
        paper *= 1.0 - 0.12 * exp(-pow((vUv.y - 0.5) / 0.012, 2.0));      // the bar's shadow under the paper
        vec3 hole = uGold * (uLit + 2.6 * bar);                             // light through the punched holes
        vec3 c = t < 0.18 ? hole : paper;
        vec3 x = t < 0.18 ? uBlue * (0.5 + bar) : uBlue * (0.12 + 0.25 * (1.0 - t)) + uBlue * bar * 0.25;
        gl_FragColor = vec4(mix(c, x, uXray), 1.0);
      }`,
  }));
  paper.position.set(0, (SPOOL_UP + SPOOL_DN) / 2, PAPER_Z);
  piano.add(paper);

  /* analysis: edge wireframe + labels */
  const wire = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: blue, transparent: true, opacity: 0.75 });
  const keyWire = new THREE.MeshBasicMaterial({ color: blue, wireframe: true, transparent: true, opacity: 0.6 });
  for (const p of parts) if (!p.isInstancedMesh) {
    const d = p.userData.dims;                     // plain-box outlines read cleaner than the rounded mesh
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(d ? new THREE.BoxGeometry(...d) : p.geometry, 30), lineMat);
    l.position.copy(p.position); l.rotation.copy(p.rotation); l.userData.src = p; wire.add(l);
  }
  wire.visible = false; piano.add(wire);
  const tags = [
    [new THREE.Vector3(BOX.x, BOX.y1 - 0.02, FRONT + 0.03), "SPOOL BOX // SLIDING DOORS"],
    [new THREE.Vector3(0.155, BAR_Y, PAPER_Z + 0.01), "TRACKER BAR // 88 HOLES, 9 PER INCH"],
    [new THREE.Vector3(-0.15, SPOOL_DN - 0.02, PAPER_Z), "TAKE-UP SPOOL"],
    [new THREE.Vector3(-0.15, SPOOL_UP + 0.03, PAPER_Z), "THE ROLL // BUILDS 01–08"],
    [new THREE.Vector3(0.3, KEY.TOP - KEY.H - 0.012, KEY_Z1 + 0.06), "TEMPO LEVER"],
    [new THREE.Vector3(0.45, KEY.TOP + 0.005, KEY_Z1), "88 KEYS // A0–C8"],
  ].map(([p, text]) => {
    const el = document.createElement("span");
    el.className = "oracle-tag player-tag"; el.setAttribute("aria-hidden", "true"); el.textContent = text;
    stage.append(el); return { p, el };
  });
  const applyAnalysis = (on) => {
    paperU.uXray.value = on ? 1 : 0;
    wire.visible = on;
    for (const p of parts) p.visible = !on || Boolean(p.isInstancedMesh);   // three only skips visible === false
    whites.material = on ? keyWire : ivory; blacks.material = on ? keyWire : ebony;
    section.classList.toggle("is-xray", on);
  };
  applyAnalysis(document.documentElement.classList.contains("analysis"));
  addEventListener("dolores:analysis", (e) => applyAnalysis(e.detail.on));

  /* ---------- camera, layout, scroll ---------- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30);
  let VW = 1, VH = 1, wide = true;
  function layout() {
    VW = stage.clientWidth; VH = stage.clientHeight; wide = VW / VH > 1.05;
    renderer.setSize(VW, VH, false);
    camera.aspect = VW / VH;
    // wide: push the piano right of the copy; narrow: push it up above the card
    if (wide) camera.setViewOffset(VW, VH, -VW * 0.17, 0, VW, VH);
    else camera.setViewOffset(VW, VH, 0, VH * 0.13, VW, VH);
    camera.updateProjectionMatrix();
  }
  const tanH = () => Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect;   // half-width per unit distance
  const fitDist = (width, height) => Math.max(width / 2 / tanH(), height / 2 / Math.tan(THREE.MathUtils.degToRad(15)));

  const maxR = NB - 1;
  const progress = () => {
    const r = section.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
  };
  const INTRO = 0.1;
  const rollAt = (p) => clamp((p - INTRO) / (1 - INTRO - 0.02), 0, 1) * maxR;
  const scrollToBuild = (i) => {
    const r = section.getBoundingClientRect(), top = scrollY + r.top, span = r.height - innerHeight;
    const p = INTRO + (i / maxR) * (1 - INTRO - 0.02);
    scrollTo({ top: top + p * span + 2, behavior: "smooth" });
  };
  let current = -1;
  const playBtn = section.querySelector("[data-roll=play]"), hint = section.querySelector(".player-hint");
  const HINT = hint?.textContent || "";
  let playing = false;
  const setPlaying = (on) => {
    if (playing === on) return;
    playing = on; holdAmbient(on);
    if (playBtn) { playBtn.setAttribute("aria-pressed", String(on)); playBtn.textContent = on ? "Pause" : "Play"; }
    if (hint) hint.textContent = !on ? HINT : soundOn() ? "Playing the roll // scroll or Pause to stop" : "Sound is off // the keys play in silence";
  };
  playBtn?.addEventListener("click", () => setPlaying(!playing));
  // the visitor taking over the scroll stops the roll (our own scrollTo never fires these)
  for (const ev of ["wheel", "touchstart", "keydown"]) addEventListener(ev, (e) => {
    if (playing && !e.target.closest?.("[data-roll]")) setPlaying(false);
  }, { passive: true });
  const SPEED = 0.12;                                // build segments per second (~8 s per build)
  let lastBar = 0.5, down = new Set(), pulse = 0, view = 0;
  prev?.addEventListener("click", () => scrollToBuild(Math.max(0, current - 1)));
  next?.addEventListener("click", () => scrollToBuild(Math.min(maxR, current + 1)));
  canvas.addEventListener("click", () => card.querySelector("a")?.click());

  // ?piano-still holds a composed pose (whole piano, doors open) for rendering images/piano-still.*
  const STILL = new URLSearchParams(location.search).has("piano-still");
  const pose = { r: STILL ? 0.15 : 0 };
  let running = false, last = performance.now(), t = 0;
  const v3 = new THREE.Vector3(), target = new THREE.Vector3();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const p = progress();
    const intro = STILL ? 0 : smooth(0, INTRO, p);
    if (!STILL) pose.r += (rollAt(p) - pose.r) * (1 - Math.exp(-dt * 8));      // the roll eases after the scroll

    // camera: whole instrument -> close on the spool box
    const far = fitDist(W * 1.6, H * 1.3), close = fitDist(wide ? 0.62 : 0.46, wide ? 0.5 : 0.42);
    target.set(0, lerp(0.75, (BAR_Y + 0.02), intro), lerp(0, PAPER_Z, intro));
    camera.position.set(lerp(-0.45, 0, intro), lerp(1.1, BAR_Y + 0.06, intro), target.z + lerp(far, close, intro));
    // while the roll plays, ease back so the keys it presses are in view too
    view += ((playing ? 1 : 0) - view) * Math.min(1, dt * 1.6);
    if (view > 0.001) {
      const wideShot = fitDist(wide ? 1.4 : 0.8, wide ? 0.95 : 0.62);
      target.y = lerp(target.y, (BAR_Y + KEY.TOP) / 2 + 0.03, view);
      camera.position.y = lerp(camera.position.y, target.y + 0.12, view);
      camera.position.z = lerp(camera.position.z, target.z + wideShot, view);
    }
    camera.lookAt(target);
    const open = STILL ? 1 : intro;
    doors.forEach((d, k) => { d.position.x = (k ? 1 : -1) * (BOX.x / 2 + open * (BOX.x + 0.005)); });
    if (STILL) { camera.position.set(-0.55, 1.0, 3.35); camera.lookAt(0, 0.72, 0); camera.clearViewOffset(); }

    if (playing) {                                  // the roll plays itself: advance the page
      const rr = section.getBoundingClientRect(), top = scrollY + rr.top, span = rr.height - innerHeight;
      let pp = Math.max(p, INTRO + 0.001) + (dt * SPEED / maxR) * (1 - INTRO - 0.02);
      if (pp >= 0.98) { pp = 0.98; setPlaying(false); }
      scrollTo(0, top + pp * span);
    }

    // holes crossing the tracker bar: sound + keys (fast scrubs skip the sound)
    const barS = pose.r + 0.5;
    if (barS > lastBar && barS - lastBar < 0.08) {
      let n = 0;
      for (const e of roll.events) if (e.s0 > lastBar && e.s0 <= barS && n < 5) { playNote(e.midi, e.midi < 50 ? 0.42 : 0.5); n++; pulse = 1; }
    }
    lastBar = barS;
    const held = new Set();                         // keys whose holes are over the bar right now
    for (const e of roll.events) if (barS >= e.s0 && barS <= e.s1) held.add(e.midi);
    for (const m of down) if (!held.has(m)) setKey(m, false);
    for (const m of held) if (!down.has(m)) setKey(m, true);
    down = held;
    pulse *= Math.exp(-dt * 5);
    glow.intensity = 0.6 + (playing ? 0.4 : 0) + pulse * 1.4;
    paperU.uLit.value = 0.95 + pulse * 0.5;
    treadles.forEach((tr, k) => { tr.rotation.x += ((playing ? -0.25 + Math.sin(t * 4 + k * Math.PI) * 0.12 : -0.25) - tr.rotation.x) * Math.min(1, dt * 8); });
    levers[3].rotation.y += ((playing ? 0.4 : 0) - levers[3].rotation.y) * Math.min(1, dt * 4);

    // roll
    paperU.uOff.value = (pose.r + 0.5 - VIS / 2) / NB;
    const left = 1 - pose.r / maxR;
    supply.scale.set(0.75 + 0.25 * left, 1, 0.75 + 0.25 * left); supply.rotation.x = -pose.r * 9;
    takeup.scale.set(1 + 0.35 * (1 - left), 1, 1 + 0.35 * (1 - left)); takeup.rotation.x = -pose.r * 12;
    sprocket.rotation.x = -pose.r * 12; knob.rotation.x = Math.sin(t * 0.3) * 0.05;

    const idx = clamp(Math.round(pose.r), 0, maxR);
    if (idx !== current) {
      current = idx;
      card.innerHTML = cardHTML(builds[idx]);
      section.dataset.build = builds[idx].n;
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === maxR;
    }

    if (wire.visible) for (const l of wire.children) { l.position.copy(l.userData.src.position); l.rotation.copy(l.userData.src.rotation); }
    renderer.render(scene, camera);
    if (paperU.uXray.value) for (const tg of tags) {
      v3.copy(tg.p).project(camera);
      const x = ((v3.x + 1) / 2) * VW, y = ((1 - v3.y) / 2) * VH;
      const flip = x + tg.el.offsetWidth + 24 > VW;
      tg.el.classList.toggle("is-flip", flip);
      tg.el.style.transform = `translate(${clamp(flip ? x - tg.el.offsetWidth - 20 : x, 8, VW - tg.el.offsetWidth - 8)}px, ${y}px)`;
    }
    requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
  const stop = () => { running = false; };
  layout();
  new ResizeObserver(layout).observe(stage);
  new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop())).observe(section);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  requestAnimationFrame((now) => { last = now; start(); section.classList.add("is-3d"); });
  return { roll, keyOf, levers, treadles, glow, paperU };
}
