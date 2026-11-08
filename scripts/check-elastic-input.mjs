import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync('src/scripts/elastic-input.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
function setup() {
  const handlers = new Map(), moves = [], options = [];
  let enabled = true, releases = 0;
  const context = { exports: {}, window: { visualViewport: { scale: 1 } } };
  vm.runInNewContext(js, context);
  const dispose = context.exports.bindElasticInput({
    addEventListener(name, handler, option) { handlers.set(name, handler); options.push(option); },
    removeEventListener(name, handler) { if (handlers.get(name) === handler) handlers.delete(name); },
  }, { enabled: () => enabled, move: (x, y) => moves.push([x, y]), release: () => releases++ });
  const fire = (name, event = {}) => handlers.get(name)?.({ preventDefault() { assert.fail('Decorative input must never cancel native gestures'); }, ...event });
  const touch = (x, y) => ({ touches: [{ clientX: x, clientY: y }] });
  return { fire, touch, moves, options, handlers, dispose, context, disable: () => enabled = false, releases: () => releases };
}

test('finger tracking survives native scroll cancelling pointer events', () => {
  const h = setup();
  h.fire('touchstart', h.touch(30, 200));
  h.fire('pointercancel', { pointerType: 'touch' });
  h.fire('pointerleave', { pointerType: 'touch' });
  h.fire('touchmove', h.touch(35, 140));
  assert.deepEqual(h.moves, [[30, 200], [35, 140]]);
  assert.equal(h.releases(), 0);
  h.fire('touchend');
  assert.equal(h.releases(), 1);
});

test('pinch, zoom and disabled animation release the effect without cancelling gestures', () => {
  for (const mode of ['pinch', 'zoom', 'disabled']) {
    const h = setup();
    h.fire('touchstart', h.touch(30, 200));
    if (mode === 'zoom') h.context.window.visualViewport.scale = 2;
    if (mode === 'disabled') h.disable();
    h.fire('touchmove', mode === 'pinch' ? { touches: [{ clientX: 30, clientY: 200 }, { clientX: 100, clientY: 200 }] } : h.touch(40, 100));
    assert.equal(h.moves.length, 1);
    assert.equal(h.releases(), 1);
  }
});

test('mouse hover and pen remain responsive, touch pointers are not duplicated', () => {
  const h = setup();
  h.fire('pointermove', { pointerType: 'mouse', clientX: 20, clientY: 40 });
  h.fire('pointerup', { pointerType: 'mouse' });
  assert.equal(h.releases(), 0);
  h.fire('pointermove', { pointerType: 'touch', clientX: 70, clientY: 80 });
  h.fire('pointerdown', { pointerType: 'pen', clientX: 50, clientY: 60 });
  h.fire('pointerup', { pointerType: 'pen' });
  assert.deepEqual(h.moves, [[20, 40], [50, 60]]);
  assert.equal(h.releases(), 1);
});

test('cancelled touches settle, listeners stay passive and can be removed', () => {
  const h = setup();
  h.fire('touchstart', h.touch(30, 200));
  h.fire('touchcancel');
  assert.equal(h.releases(), 1);
  assert.ok(h.options.every(option => option.passive === true));
  h.dispose();
  assert.equal(h.handlers.size, 0);
});
