// The Oracle — Socrates' head, printed in gold layers that cool into marble as you scroll.
// His gaze follows the cursor... until it turns away: is the guiding voice his, or yours?
// Plutarch's theories of the sign are labelled on the head in Analysis Mode:
// the sneeze (p.92), the voice (p.104), the daimon that stays above (pp.108–109).
// Lazy-loaded by js/site.js when the section nears the viewport (WebGL + motion only).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

export async function mountOracle(section, modelURL) {
  const stage = section.querySelector(".oracle-stage");
  const steps = [...section.querySelectorAll("[data-step]")];
  const canvas = document.createElement("canvas");
  canvas.className = "oracle-canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.prepend(canvas);

  const coarse = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;
  const gold = new THREE.Color(token("--daimon-gold")), blue = new THREE.Color(token("--dolores-blue"));
  const marble = new THREE.Color(token("--host-white"));
  const key = new THREE.DirectionalLight(marble, 2.4); key.position.set(2.2, 1.5, 1.0); scene.add(key);
  const rim = new THREE.DirectionalLight(gold, 4.0); rim.position.set(-1.8, 0.8, -1.2); scene.add(rim);
  scene.add(new THREE.HemisphereLight(new THREE.Color(token("--grey-400")), new THREE.Color(token("--cold-storage")), 0.18));

  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelURL);
  const head = gltf.scene;
  const box = new THREE.Box3().setFromObject(head);
  head.position.sub(box.getCenter(new THREE.Vector3()));
  const pivot = new THREE.Group();                 // gaze rotates this
  pivot.add(head);
  const holder = new THREE.Group();                // layout offset lives here
  holder.add(pivot);
  scene.add(holder);
  const yMin = box.min.y - box.getCenter(new THREE.Vector3()).y, yMax = -yMin;

  /* ---------- the printing material ---------- */
  const uniforms = {
    uCut: { value: yMin }, uSpace: { value: new THREE.Matrix4() },
    uGold: { value: gold }, uBlue: { value: blue }, uXray: { value: 0 }, uTime: { value: 0 },
  };
  const material = new THREE.MeshStandardMaterial({ color: marble, roughness: 0.55, side: THREE.DoubleSide });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uSpace; varying float vHY;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHY = (uSpace * modelMatrix * vec4(transformed, 1.0)).y;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uCut; uniform vec3 uGold; uniform vec3 uBlue; uniform float uXray; varying float vHY;")
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (vHY > uCut) discard;")
      .replace("#include <dithering_fragment>", `
        float below = uCut - vHY;                                   // how long ago this layer printed
        float heat = 1.0 - smoothstep(0.0, 0.16, below);            // still cooling
        float layer = pow(abs(sin(vHY * 3.14159 * 115.0)), 28.0);   // printed layer lines
        float edge = 1.0 - smoothstep(0.0, 0.006, below);           // the molten line itself
        vec3 col = gl_FragColor.rgb;
        if (!gl_FrontFacing) col = mix(uGold * 0.35, uGold, edge);  // seen through the cut: a gold core
        col += uGold * (layer * heat * 1.4 + edge * 2.2 + heat * 0.08);
        // analysis: an x-ray scan, blue fresnel with scan lines everywhere
        float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.0);
        vec3 xray = uBlue * (0.12 + fres * 1.1) + uBlue * layer * 0.5;
        gl_FragColor.rgb = mix(col, xray, uXray);
        #include <dithering_fragment>`);
  };
  material.customProgramCacheKey = () => "oracle-print";
  head.traverse((o) => { if (o.isMesh) { o.material = material; o.frustumCulled = false; } });

  /* ---------- anchor points for the Analysis labels (found on the mesh itself) ---------- */
  const mesh = head.getObjectByProperty("isMesh", true);
  head.updateMatrixWorld(true);
  const P = mesh.geometry.attributes.position, v = new THREE.Vector3();
  let nose = null, ear = null, crown = null;
  for (let i = 0; i < P.count; i += 7) {
    v.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld);
    if (v.y > -0.05 && v.y < 0.12 && (!nose || v.z > nose.z)) nose = v.clone();
    if (v.y > 0.02 && v.y < 0.16 && v.z < 0.05 && (!ear || v.x > ear.x)) ear = v.clone();
    if (!crown || v.y > crown.y) crown = v.clone();
  }
  const anchors = [
    { p: nose, text: "NOSE // THE SNEEZE // P.92" },
    { p: ear, text: "EAR // THE VOICE // P.104" },
    { p: crown.clone().add(new THREE.Vector3(0, 0.08, 0)), text: "ABOVE // THE DAIMON, OUTSIDE // PP.108–109" },
  ].map((a) => {
    const el = document.createElement("span");
    el.className = "oracle-tag"; el.setAttribute("aria-hidden", "true"); el.textContent = a.text;
    stage.append(el);
    return { ...a, el };
  });

  /* ---------- camera + layout ---------- */
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 50);
  let W = 1, H = 1;
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const wide = W / H > 1.05;
    // narrow: back off so the head fills ~40% of the height, then lift it into the top half
    const dist = wide ? 2.9 : 1 / (0.4 * 2 * Math.tan(THREE.MathUtils.degToRad(13)));
    camera.position.set(0, 0.1, dist);
    camera.lookAt(0, 0.02, 0);
    camera.updateProjectionMatrix();
    const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(13));
    // wide: head sits right of the copy; narrow: head centred ~26% from the top
    holder.position.set(wide ? Math.min(0.62, 0.32 * camera.aspect) : 0, wide ? 0 : visH * 0.24, 0);
  }

  /* ---------- gaze: follows the cursor, then turns away ---------- */
  const look = { x: 0, y: 0, tx: 0, ty: 0, held: 0, away: 0 };
  addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    look.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    look.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  }, { passive: true });

  const applyAnalysis = (on) => { uniforms.uXray.value = on ? 1 : 0; section.classList.toggle("is-xray", on); };
  applyAnalysis(document.documentElement.classList.contains("analysis"));
  addEventListener("dolores:analysis", (e) => applyAnalysis(e.detail.on));

  /* ---------- loop ---------- */
  let running = false, last = performance.now(), t = 0, shownStep = -1;
  const proj = new THREE.Vector3();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;

    // scroll progress through the tall section
    const r = section.getBoundingClientRect();
    // progress from the moment the section enters the screen (no empty dark stretch before the print starts)
    const p = clamp((innerHeight - r.top) / Math.max(1, r.height), 0, 1);
    uniforms.uCut.value = yMin + (yMax - yMin + 0.02) * smooth(0.06, 0.55, p);
    const step = p < 0.5 ? 0 : p < 0.66 ? 1 : p < 0.82 ? 2 : 3;
    if (step !== shownStep) { steps.forEach((s, i) => s.classList.toggle("is-on", i <= step)); shownStep = step; section.dataset.step = step; }

    // gaze: ease toward the cursor; after ~3s of being watched, look away for ~2s
    if (coarse) { look.tx = Math.sin(t * 0.35) * 0.6; look.ty = Math.sin(t * 0.23) * 0.2; }
    look.held += dt;
    if (look.away > 0) look.away -= dt; else if (look.held > 3.2) { look.away = 2.2; look.held = 0; }
    const away = look.away > 0 ? -1 : 1;
    const gx = look.away > 0 ? -Math.sign(look.tx || 1) * 0.9 : look.tx, gy = look.away > 0 ? 0.35 : look.ty;
    look.x += (gx - look.x) * (1 - Math.exp(-dt * (away < 0 ? 1.6 : 2.4)));
    look.y += (gy - look.y) * (1 - Math.exp(-dt * 2.4));
    const toCam = -holder.position.x * 0.35;                    // face the viewer from an off-centre spot
    pivot.rotation.y = toCam + look.x * 0.5;
    pivot.rotation.x = 0.04 + look.y * 0.18;
    pivot.updateMatrixWorld(true);
    uniforms.uSpace.value.copy(pivot.matrixWorld).invert();

    renderer.render(scene, camera);

    // analysis labels follow their anchors on screen
    if (uniforms.uXray.value) for (const a of anchors) {
      proj.copy(a.p).applyMatrix4(head.matrixWorld).project(camera);
      const x = ((proj.x + 1) / 2) * W, flip = x + a.el.offsetWidth + 24 > W;   // keep the label on screen
      a.el.classList.toggle("is-flip", flip);
      const left = clamp(flip ? x - a.el.offsetWidth - 20 : x, 8, W - a.el.offsetWidth - 8);
      a.el.style.transform = `translate(${left}px, ${((1 - proj.y) / 2) * H}px)`;
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
}
