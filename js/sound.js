// Sound — an original, quiet, generative ambient piano, synthesized live with the Web Audio API.
// No audio files and no existing music: slow rolled chords in A minor with sparse notes drifting above,
// chosen afresh each time, so it never settles into a fixed tune.
// Off by default. The nav toggle turns it on; the choice is remembered per visitor (localStorage, best effort).
// Browsers only allow audio after a click or key press, so a remembered "on" waits for the first one.

const KEY = "dolores:sound";
const store = {
  get() { try { return localStorage.getItem(KEY) === "on"; } catch { return false; } },
  set(on) { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode: session only */ } },
};

const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// Four slow voicings (A minor add9, F maj7, C/G add9, E minor 7) and a pentatonic set for the drifting notes.
const CHORDS = [
  [45, 52, 59, 60, 64],
  [41, 48, 55, 57, 64],
  [43, 48, 55, 62, 64],
  [40, 47, 55, 59, 62],
];
const DRIFT = [69, 72, 74, 76, 79, 81, 84];
const BAR = 6.4;                                   // seconds per chord

let ctx = null, master = null, bus = null, timer = null, nextBar = 0, bar = 0, on = false, held = false;

function impulse(c, seconds = 4.5) {
  const len = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  return buf;
}

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3;
  const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2600;
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx);
  const wet = ctx.createGain(); wet.gain.value = 0.55;
  const dry = ctx.createGain(); dry.gain.value = 0.6;
  bus = ctx.createGain();
  bus.connect(tone); tone.connect(dry); tone.connect(verb); verb.connect(wet);
  dry.connect(master); wet.connect(master); master.connect(comp); comp.connect(ctx.destination);
}

// A soft synthesized piano note: slightly stretched partials, each fading at its own rate.
function note(n, when, vel = 0.5) {
  const f = midi(n), out = ctx.createGain();
  out.gain.value = vel * 0.16;
  out.connect(bus);
  for (let k = 1; k <= 6; k++) {
    const fk = f * k * Math.sqrt(1 + 0.0004 * k * k);
    if (fk > 9000) break;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = fk; o.detune.value = (Math.random() - 0.5) * 4;
    const amp = 1 / Math.pow(k, 1.4), decay = 3.8 / Math.pow(k, 0.6) * (n < 50 ? 1.4 : 1);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.012);
    g.gain.setTargetAtTime(0, when + 0.012, decay / 3);
    o.connect(g); g.connect(out);
    o.start(when); o.stop(when + decay * 2 + 0.1);
  }
}

function scheduleBar(t) {
  const chord = CHORDS[bar % CHORDS.length];
  // roll the chord upward, unhurried
  chord.forEach((n, i) => note(n, t + i * (0.11 + Math.random() * 0.06), (i === 0 ? 0.55 : 0.38) * (0.85 + Math.random() * 0.3)));
  // one to three drifting notes above, sometimes none
  const count = Math.random() < 0.25 ? 0 : 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const at = t + 1.6 + Math.random() * (BAR - 2.4);
    note(DRIFT[Math.floor(Math.random() * DRIFT.length)], at, 0.22 + Math.random() * 0.14);
  }
  bar++;
}

function pump() {
  while (nextBar < ctx.currentTime + 1.5) { scheduleBar(nextBar); nextBar += BAR; }
}

async function start() {
  if (!ctx) setup();
  await ctx.resume();
  nextBar = Math.max(nextBar, ctx.currentTime + 0.1);
  clearInterval(timer); timer = null;
  if (!held) { timer = setInterval(pump, 250); pump(); }       // the player piano can hold the ambient loop
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);       // ~2 s fade in
}

function stop() {
  clearInterval(timer); timer = null;
  if (!ctx) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  setTimeout(() => { if (!on) ctx.suspend(); }, 900);
}

/* ---------- for the player piano (js/piano.js) ---------- */
export const soundOn = () => on;
// one note through the same voice, only when the visitor has Sound on
export function playNote(n, vel = 0.5) {
  if (!on || !ctx || ctx.state !== "running") return;
  note(n, ctx.currentTime + 0.005, vel);
}
// pause the ambient chords while the roll plays, so the two never clash
export function holdAmbient(h) {
  held = h;
  if (!ctx || !on) return;
  if (h) { clearInterval(timer); timer = null; }
  else if (!timer) { nextBar = Math.max(nextBar, ctx.currentTime + 0.6); timer = setInterval(pump, 250); }
}

export function mountSound() {
  const buttons = () => document.querySelectorAll(".sound-toggle");
  const render = () => buttons().forEach((b) => {
    b.setAttribute("aria-pressed", String(on));
    b.querySelector(".state").textContent = on ? "On" : "Off";
  });
  if (!(window.AudioContext || window.webkitAudioContext)) { buttons().forEach((b) => (b.hidden = true)); return; }

  on = store.get();
  render();

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".sound-toggle")) return;
    on = !on; store.set(on); render();
    on ? start() : stop();
  });

  // remembered "on": wait for the visitor's first click or key press (browser autoplay rules)
  if (on) {
    const first = (e) => {
      removeEventListener("pointerdown", first, true); removeEventListener("keydown", first, true);
      if (on && !e.target.closest?.(".sound-toggle")) start();
    };
    addEventListener("pointerdown", first, true); addEventListener("keydown", first, true);
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    document.hidden ? (clearInterval(timer), ctx.suspend()) : start();
  });
}
