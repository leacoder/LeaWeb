interface InputOptions {
  enabled: () => boolean;
  move: (x: number, y: number) => void;
  release: () => void;
}

// Touch events continue during native scrolling after Pointer Events are
// cancelled by the browser. All listeners are passive: scrolling and pinch
// zoom remain owned by the page/browser, never by this decorative effect.
export function bindElasticInput(surface: HTMLElement, options: InputOptions) {
  const allowed = () => options.enabled() && (window.visualViewport?.scale ?? 1) <= 1.01;
  const pointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (!allowed()) { options.release(); return; }
    options.move(event.clientX, event.clientY);
  };
  const leave = (event: PointerEvent) => { if (event.pointerType !== 'touch') options.release(); };
  const up = (event: PointerEvent) => { if (event.pointerType === 'pen') options.release(); };
  const touch = (event: TouchEvent) => {
    if (!allowed() || event.touches.length !== 1) { options.release(); return; }
    options.move(event.touches[0].clientX, event.touches[0].clientY);
  };
  const end = () => options.release();
  const listeners = {
    pointermove: pointer, pointerdown: pointer, pointerleave: leave, pointercancel: leave, pointerup: up,
    touchstart: touch, touchmove: touch, touchend: end, touchcancel: end,
  };
  for (const [name, listener] of Object.entries(listeners)) surface.addEventListener(name, listener as EventListener, { passive: true });
  return () => {
    for (const [name, listener] of Object.entries(listeners)) surface.removeEventListener(name, listener as EventListener);
  };
}
