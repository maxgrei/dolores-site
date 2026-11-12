// The Sign — a small gold light that follows the cursor (the daimonion as a guide you feel,
// not a voice you hear). On builds not yet reached it flares and refuses, the way the sign
// turned Socrates down Boxmakers Street (Plutarch, 91–92).
// Off for touch screens, coarse pointers and reduced motion: those visitors just reach the
// locked page itself, which says the same thing.

export function mountSign() {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || reduce.matches) return;

  const light = document.createElement("div");
  light.className = "sign-cursor";
  light.setAttribute("aria-hidden", "true");
  const note = document.createElement("div");
  note.className = "sign-note";
  note.setAttribute("role", "status");
  document.body.append(light, note);
  document.documentElement.classList.add("has-sign");

  let x = -100, y = -100, tx = -100, ty = -100, shown = false, raf = 0, noteTimer = 0;
  const lockedTarget = (el) => el?.closest?.("[data-locked]");

  function tick() {
    x += (tx - x) * 0.2; y += (ty - y) * 0.2;
    light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
  }
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY;
    if (!shown) { x = tx; y = ty; shown = true; light.classList.add("is-on"); }
    const t = e.target;
    light.classList.toggle("is-locked", !!lockedTarget(t));
    light.classList.toggle("is-link", !lockedTarget(t) && !!t.closest?.("a, button, summary, [role=button]"));
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { light.classList.remove("is-on"); shown = false; });

  // refusal: mouse clicks on a locked build are turned back (keyboard activation, detail 0, still goes through)
  addEventListener("click", (e) => {
    const lock = lockedTarget(e.target);
    if (!lock || e.detail === 0) return;
    e.preventDefault();
    light.classList.remove("refuse"); void light.offsetWidth; light.classList.add("refuse");
    note.textContent = "The sign turned you back.";
    note.style.transform = `translate3d(${Math.min(tx + 18, innerWidth - 260)}px, ${ty + 18}px, 0)`;
    note.classList.add("is-on");
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => note.classList.remove("is-on"), 2200);
  }, true);

  reduce.addEventListener("change", () => { if (reduce.matches) { light.remove(); note.remove(); document.documentElement.classList.remove("has-sign"); } });
}
