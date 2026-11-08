import { gsap } from 'gsap';
import { bindElasticInput } from './elastic-input';

const drawing = document.querySelector<SVGSVGElement>('#blueprint-drawing')!;
const plane = drawing.closest<HTMLElement>('.blueprint-plane')!;
// Composite the camera move as one layer instead of relaying out all SVG text
// and paths on every frame of a viewBox animation.
plane.style.transition = 'none';
const play = document.querySelector<HTMLButtonElement>('#build-play')!;
const progress = document.querySelector<HTMLInputElement>('#build-progress')!;
const step = document.querySelector<HTMLOutputElement>('#build-step')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const autoplayRoot = document.querySelector<HTMLElement>('[data-blueprint-autoplay]');
const story = autoplayRoot?.closest<HTMLElement>('.story');
const english = document.documentElement.lang.startsWith('en');
const translations: Record<string, string> = {
  'Volver a construir': 'Build again', 'Ver construcción': 'Watch it build',
  'Continuar construcción': 'Resume animation', 'Pausar construcción': 'Pause animation',
  'Del plano a la realidad': 'From blueprint to reality', 'Estructura': 'Structure',
  'Diseño de escritorio': 'Desktop design', 'Versión móvil': 'Mobile version',
  'Plano completo': 'Complete blueprint', 'El diseño toma vida': 'The design comes to life',
  'Web terminada · movimiento reducido': 'Finished website · reduced motion',
};
const copy = (text: string) => english ? translations[text] ?? text : text;
const select = (selector: string) => Array.from(drawing.querySelectorAll<SVGElement>(selector));
let lastStep = '';
let manuallyPaused = !autoplayRoot;
let firstPlay = !autoplayRoot;
let blueprintVisible = true;
const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' }, onUpdate: update, onComplete: () => {
  manuallyPaused = true;
  play.textContent = copy('Volver a construir');
} });

function update() {
  const value = timeline.progress();
  progress.value = String(Math.round(value * 100));
  const time = timeline.time();
  const label = value >= .999 ? 'Del plano a la realidad' : time < 1.2 ? 'Estructura' : time < 2.8 ? 'Diseño de escritorio' : time < 4.4 ? 'Versión móvil' : time < 6.3 ? 'Plano completo' : 'El diseño toma vida';
  if (label !== lastStep) { step.textContent = copy(label); lastStep = label; }
}

// Retain the complete SVG as the no-JavaScript and reduced-motion view.
const desktop = select('.plan-desktop');
const mobile = select('.plan-mobile');
const annotations = select('.plan-measurements, .plan-dimension-text, .plan-projection, .plan-titleblock, .plan-titleblock-copy');
const desktopCopy = select('.plan-desktop .plan-copy > *');
const mobileCopy = select('.plan-copy-mobile > *');
const traces = select('.plan-desktop .plan-trace');
timeline.fromTo(desktop, { opacity: 0 }, { opacity: 1, duration: .35 }, 0)
  .fromTo(traces, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.9, stagger: .18, ease: 'power1.inOut' }, 0)
  .fromTo(desktopCopy, { opacity: 0 }, { opacity: 1, duration: .7, stagger: .1 }, 1.05)
  .fromTo(mobile, { opacity: 0 }, { opacity: 1, duration: .7 }, 2.8)
  .fromTo(select('.plan-trace-mobile'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.7, ease: 'power1.inOut' }, 2.8)
  .fromTo(mobileCopy, { opacity: 0 }, { opacity: 1, duration: .6, stagger: .1 }, 3.3);
// Drawing the real dimension lines adds the final drafting pass.
select('.plan-measurements path').forEach((element) => {
  const path = element as SVGPathElement;
  const length = path.getTotalLength();
  timeline.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, 4.4);
});
annotations.forEach((element) => {
  const opacity = Number(getComputedStyle(element).opacity);
  timeline.fromTo(element, { opacity: 0 }, { opacity, duration: 1 }, 4.4);
});
// Materialize in place: the finished UI shares the plan's exact geometry.
// The same reversible timeline drives playback and manual scrubbing.
timeline.fromTo(select('.reality'), { opacity: 0 }, { opacity: 1, duration: .35 }, 6.3)
  .fromTo(select('[data-reality-desktop-mask]'), { attr: { width: 0 } }, { attr: { width: 362 }, duration: 2.2, ease: 'power2.inOut' }, 6.3)
  .fromTo(select('[data-reality-mobile-mask]'), { attr: { height: 0 } }, { attr: { height: 222 }, duration: 2, ease: 'power2.inOut' }, 6.9)
  .to(annotations, { opacity: 0, duration: 1.8, stagger: .025 }, 6.45)
  .to(select('.plan-paper-label, .plan-titleblock-copy'), { opacity: 0, duration: 1.4 }, 6.5)
  .to(select('.plan-reference'), { opacity: .1, duration: 1.8 }, 6.5)
  .to(select(':scope > rect:not(:first-of-type)'), { opacity: 0, duration: 1.8 }, 6.5)
  .set(plane, { willChange: 'transform' }, 6.3)
  .fromTo(plane, { scale: 1, yPercent: 0 }, { scale: 1.1, yPercent: -2, duration: 2.7, ease: 'power2.inOut', force3D: true }, 6.3)
  .to([...desktop, ...mobile], { opacity: 0, duration: .3 }, 8.9)
  .set(plane, { willChange: 'auto' }, 9.2)
  .to({}, { duration: .3 }, 9.2);
timeline.time(reduced.matches ? timeline.duration() : autoplayRoot ? 0 : 5.9).pause();
play.disabled = false;
progress.disabled = false;
play.hidden = false;
play.textContent = copy(autoplayRoot && !reduced.matches ? 'Pausar construcción' : 'Ver construcción');

play.addEventListener('click', () => {
  if (reduced.matches) {
    timeline.progress(1).pause();
    step.textContent = copy('Web terminada · movimiento reducido');
    return;
  }
  if (timeline.isActive()) {
    timeline.pause(); manuallyPaused = true; play.textContent = copy('Continuar construcción');
  } else {
    manuallyPaused = false;
    if (firstPlay || timeline.progress() >= .999) timeline.restart(); else timeline.play();
    firstPlay = false;
    play.textContent = copy('Pausar construcción');
  }
});
progress.addEventListener('input', () => {
  manuallyPaused = true;
  firstPlay = false;
  timeline.pause().progress(Number(progress.value) / 100);
  play.textContent = copy(timeline.progress() >= .999 ? 'Volver a construir' : 'Continuar construcción');
});

const scene = document.querySelector<HTMLElement>('.experiment') ?? document.body;
const canvas = document.querySelector<HTMLCanvasElement>('#motion-grid')!;
const globalGrid = canvas.hasAttribute('data-global-grid');
const ctx = canvas.getContext('2d');
let width = 0, height = 0, frame = 0, active = false, visible = true;
let mode = 'elastic';
let previousFrame = 0;
let resizeFrame = 0;
let pixelRatio = 0;
let restingGrid = new Path2D();
const spacing = 40;
const radius = 240;
const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, strength: 0 };

function makeGrid(deformed: boolean) {
  const path = new Path2D();
  const left = Math.max(0, Math.floor((pointer.x - radius) / 12) * 12);
  const right = Math.min(width, Math.ceil((pointer.x + radius) / 12) * 12);
  const top = Math.max(0, Math.floor((pointer.y - radius) / 12) * 12);
  const bottom = Math.min(height, Math.ceil((pointer.y + radius) / 12) * 12);
  function point(x: number, y: number) {
    const dx = x - pointer.x, dy = y - pointer.y;
    const weight = Math.max(0, 1 - (dx * dx + dy * dy) / (radius * radius));
    const force = weight * weight * weight * .36 * pointer.strength;
    path.lineTo(x + dx * force, y + dy * force);
  }
  for (let x = 0; x <= width; x += spacing) {
    path.moveTo(x, 0);
    if (deformed && Math.abs(x - pointer.x) < radius) {
      path.lineTo(x, top);
      for (let y = top; y <= bottom; y += 12) point(x, y);
      point(x, bottom);
    }
    path.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += spacing) {
    path.moveTo(0, y);
    if (deformed && Math.abs(y - pointer.y) < radius) {
      path.lineTo(left, y);
      for (let x = left; x <= right; x += 12) point(x, y);
      point(right, y);
    }
    path.lineTo(width, y);
  }
  return path;
}

function draw(now = performance.now()) {
  frame = 0;
  if (!ctx || !visible || document.hidden) return;
  const dt = Math.min(previousFrame ? now - previousFrame : 16.67, 40);
  previousFrame = now;
  const follow = 1 - Math.exp(-dt / 95);
  const settle = 1 - Math.exp(-dt / (active ? 150 : 260));
  pointer.x += (pointer.targetX - pointer.x) * follow;
  pointer.y += (pointer.targetY - pointer.y) * follow;
  pointer.strength += ((active && !reduced.matches ? 1 : 0) - pointer.strength) * settle;
  ctx.clearRect(0, 0, width, height);
  // Reuse the straight grid while idle. Only subdivide lines near the finger
  // when elastic movement is visible; distant lines remain single segments.
  const gridPath = mode === 'elastic' && pointer.strength > .005 ? makeGrid(true) : restingGrid;
  ctx.lineWidth = .7;
  ctx.strokeStyle = 'rgba(139,226,239,.10)';
  ctx.stroke(gridPath);
  if (pointer.strength > .005) {
    const sx = mode === 'snap' ? Math.round(pointer.x / spacing) * spacing : pointer.x;
    const sy = mode === 'snap' ? Math.round(pointer.y / spacing) * spacing : pointer.y;
    const light = ctx.createRadialGradient(sx, sy, 0, sx, sy, 210);
    light.addColorStop(0, `rgba(139,226,239,${.38 * pointer.strength})`);
    light.addColorStop(1, 'rgba(139,226,239,0)');
    ctx.strokeStyle = light; ctx.stroke(gridPath);
    if (mode === 'snap') {
      ctx.strokeStyle = `rgba(139,226,239,${.7 * pointer.strength})`;
      ctx.beginPath(); ctx.moveTo(sx - 12, sy); ctx.lineTo(sx + 12, sy);
      ctx.moveTo(sx, sy - 12); ctx.lineTo(sx, sy + 12); ctx.stroke();
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = `rgba(139,226,239,${pointer.strength})`;
      ctx.fillText(`${sx} / ${sy}`, Math.min(sx + 17, width - 95), Math.max(sy - 14, 16));
    }
  }
  if (Math.abs(pointer.targetX - pointer.x) + Math.abs(pointer.targetY - pointer.y) > .1 || Math.abs(pointer.strength - (active && !reduced.matches ? 1 : 0)) > .005) schedule();
  else previousFrame = 0;
}
function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); }
function resizeCanvas() {
  resizeFrame = 0;
  const bounds = globalGrid ? null : scene.getBoundingClientRect();
  const nextWidth = globalGrid ? document.documentElement.clientWidth : bounds!.width;
  // Browser bars can resize the viewport repeatedly during a swipe. A small
  // overscan keeps the grid at 1:1 scale without reallocating on every pixel.
  const nextHeight = globalGrid ? Math.ceil(innerHeight / 64) * 64 : bounds!.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (width === nextWidth && height === nextHeight && pixelRatio === ratio) return;
  width = nextWidth; height = nextHeight; pixelRatio = ratio;
  if (globalGrid) canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  restingGrid = makeGrid(false);
  // Resizing clears the backing bitmap. Repaint immediately, including when
  // a browser suspends a previously queued frame during viewport changes.
  cancelAnimationFrame(frame); frame = 0; draw();
}
function queueResize() { if (!resizeFrame) resizeFrame = requestAnimationFrame(resizeCanvas); }
const resize = new ResizeObserver(queueResize);
resize.observe(scene);
window.addEventListener('resize', queueResize);
function move(x: number, y: number) {
  const bounds = globalGrid ? null : scene.getBoundingClientRect();
  pointer.targetX = x - (bounds?.left ?? 0);
  pointer.targetY = y - (bounds?.top ?? 0);
  if (pointer.strength < .01) { pointer.x = pointer.targetX; pointer.y = pointer.targetY; }
  active = true; schedule();
}
const release = () => { active = false; schedule(); };
bindElasticInput(scene, { enabled: () => !reduced.matches && !document.hidden, move, release });
const descriptions: Record<string, string> = {
  light: 'Las líneas se iluminan cerca del cursor.',
  elastic: 'La retícula acompaña el movimiento y recupera su forma suavemente.',
  snap: 'La mira encaja en las intersecciones, como una herramienta de dibujo.',
};
document.querySelectorAll<HTMLButtonElement>('[data-grid-mode]').forEach(button => {
  button.addEventListener('click', () => {
    mode = button.dataset.gridMode!;
    document.querySelectorAll('[data-grid-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#grid-description')!.textContent = descriptions[mode]; schedule();
  });
});
function syncPlayback() {
  if (document.hidden || !visible) { timeline.pause(); cancelAnimationFrame(frame); frame = 0; previousFrame = 0; active = false; }
  else {
    if (!manuallyPaused && !reduced.matches && blueprintVisible && (!story || story.dataset.active === '0')) timeline.play();
    else timeline.pause();
    schedule();
  }
}
const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlayback(); });
observer.observe(scene);
if (autoplayRoot) {
  const blueprintObserver = new IntersectionObserver(entries => { blueprintVisible = entries[0].isIntersecting; syncPlayback(); });
  blueprintObserver.observe(autoplayRoot);
  if (story) new MutationObserver(syncPlayback).observe(story, { attributes: true, attributeFilter: ['data-active'] });
}
document.addEventListener('visibilitychange', syncPlayback);
reduced.addEventListener('change', () => {
  if (reduced.matches) { manuallyPaused = true; timeline.progress(1).pause(); active = false; }
  schedule();
});
window.addEventListener('pagehide', () => { timeline.pause(); cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame); frame = 0; resizeFrame = 0; active = false; });
window.addEventListener('pageshow', () => { queueResize(); syncPlayback(); });
