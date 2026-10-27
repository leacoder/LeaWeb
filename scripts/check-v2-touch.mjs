import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const page = readFileSync('src/pages/v2/index.astro','utf8');
const source = page.slice(page.indexOf('      let touch:'),page.indexOf("      window.addEventListener('keydown', stopTravel)"));
const js = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function setup({reduced=false,zoom=1,overflow=false}={}) {
 const handlers={},trips=[];const context={window:{visualViewport:{scale:zoom},addEventListener:(name,fn)=>handlers[name]=fn},reduced:{matches:reduced},travelling:false,nextPanel:direction=>overflow?undefined:{phase:direction>0?2:0,y:direction>0?1200:0},travelTo:next=>{trips.push(next);context.travelling=true;}};
 vm.runInNewContext(js,context);
 const fire=(name,x=100,y=400,count=1)=>{let prevented=false;handlers[name]({touches:Array.from({length:count},()=>({clientX:x,clientY:y})),target:{closest:()=>false},cancelable:true,preventDefault:()=>prevented=true});return prevented;};
 return {fire,trips,context};
}
test('vertical swipe advances once, continues after finger lifts',()=>{const h=setup();h.fire('touchstart');assert.equal(h.fire('touchmove',100,390),true);assert.equal(h.trips.length,0);h.fire('touchmove',100,350);h.fire('touchmove',100,180);h.fire('touchend');assert.equal(h.trips.length,1);assert.equal(h.trips[0].phase,2);assert.equal(h.context.travelling,true);});
test('downward finger returns to previous section',()=>{const h=setup();h.fire('touchstart');h.fire('touchmove',100,460);assert.equal(h.trips[0].phase,0);});
test('new touch during animation cannot skip another section',()=>{const h=setup();h.fire('touchstart');h.fire('touchmove',100,350);h.fire('touchend');h.fire('touchstart');h.fire('touchmove',100,300);assert.equal(h.trips.length,1);});
test('horizontal swipe and pinch stay native',()=>{for(const count of [1,2]){const h=setup();h.fire('touchstart',100,400,count);assert.equal(h.fire('touchmove',180,390,count),false);assert.equal(h.trips.length,0);}});
test('reduced motion, zoom and overflowing copy stay native',()=>{for(const options of [{reduced:true},{zoom:2},{overflow:true}]){const h=setup(options);h.fire('touchstart');assert.equal(h.fire('touchmove',100,300),false);assert.equal(h.trips.length,0);}});
test('tap and cancelled gesture do not navigate',()=>{const h=setup();h.fire('touchstart');h.fire('touchend');h.fire('touchstart');h.fire('touchmove',100,390);h.fire('touchcancel');h.fire('touchmove',100,300);assert.equal(h.trips.length,0);});
