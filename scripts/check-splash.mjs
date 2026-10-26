import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const source=readFileSync(new URL('../src/scripts/brand-splash.js',import.meta.url),'utf8');
function visit({storage=new Map(),path='/',key='lg-brand-intro',duration=1400,type='navigate',reduced=false,referrer='',blocked='',redirect=false,background=false,brokenImage=false}={}){
 const splash={hidden:true,dataset:{sessionKey:key,duration:String(duration)},querySelectorAll:()=>brokenImage?[{complete:true,naturalWidth:0}]:[]};
 const document=Object.assign(new EventTarget(),{querySelector:()=>splash,referrer,visibilityState:background?'hidden':'visible',hidden:background,documentElement:{dataset:{languageRedirect:String(redirect)}}});
 const media=Object.assign(new EventTarget(),{matches:reduced});
 const window=new EventTarget();const timers=new Map();let next=0;
 runInNewContext(source,{document,window,URL,AbortController,location:new URL(path,'https://example.com'),performance:{getEntriesByType:()=>[{type}]},matchMedia:()=>media,
  sessionStorage:{getItem:k=>{if(blocked==='read')throw Error();return storage.get(k)},setItem:(k,v)=>{if(blocked==='write')throw Error();storage.set(k,v)}},
  setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next},clearTimeout:id=>timers.delete(id)});
 return {splash,document,media,window,storage,timers};
}
test('First home visit shows once; later navigation and language changes in the same tab do not',()=>{
 const first=visit();assert.equal(first.splash.hidden,false);assert.equal(first.storage.get('lg-brand-intro'),'seen');
 assert.equal(visit({storage:first.storage}).splash.hidden,true);
 assert.equal(visit({storage:first.storage,path:'/en/'}).splash.hidden,true);
 assert.equal(visit({path:'/en/'}).splash.hidden,false);
 assert.equal(visit().splash.hidden,false,'A fresh tab session may show the intro');
});
test('Brand keys remain independent and dismissal follows each approved duration',()=>{
 const storage=new Map([['lg-brand-intro','seen']]);
 const lib=visit({storage,key:'libreria-brand-intro',duration:2200});assert.equal(lib.splash.hidden,false);
 for(const duration of [1400,2200]){
  const v=visit({duration});const timer=[...v.timers.values()][0];assert.equal(timer.ms,duration+50);timer.fn();assert.equal(v.splash.hidden,true);assert.equal(v.timers.size,0);
 }
});
test('Anchors, internal pages, return visits and language redirect bypass the splash',()=>{
 for(const options of [{path:'/#contacts'},{path:'/servicios/diseno/'},{type:'back_forward'},{referrer:'https://example.com/servicios/'},{redirect:true}]){
  const v=visit(options);assert.equal(v.splash.hidden,true,JSON.stringify(options));assert.equal(v.storage.size,0);
 }
 assert.equal(visit({referrer:'https://search.example/query'}).splash.hidden,false);
});
test('Every home reload replays, including when the session and internal referrer are retained',()=>{
 for(const key of ['lg-brand-intro','libreria-brand-intro']){
  const storage=new Map([[key,'seen']]);
  const v=visit({key,storage,type:'reload',referrer:'https://example.com/servicios/'});
  assert.equal(v.splash.hidden,false);
  assert.equal(visit({key,storage,type:'navigate',referrer:'https://example.com/servicios/'}).splash.hidden,true);
 }
 assert.equal(visit({path:'/#contacts',type:'reload'}).splash.hidden,false);
 for(const options of [{reduced:true},{path:'/servicios/'},{blocked:'read'},{blocked:'write'}]){
  assert.equal(visit({...options,type:'reload'}).splash.hidden,true);
 }
});
test('A fresh background tab plays when first brought forward, but leaving it cancels the pending intro',()=>{
 const v=visit({background:true});assert.equal(v.splash.hidden,true);assert.equal(v.storage.size,0);
 v.document.visibilityState='visible';v.document.hidden=false;v.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(v.splash.hidden,false);assert.equal(v.storage.get('lg-brand-intro'),'seen');
 const left=visit({background:true});left.window.dispatchEvent(new Event('pagehide'));
 left.document.visibilityState='visible';left.document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(left.splash.hidden,true);assert.equal(left.storage.size,0);
});
test('Reduced motion, blocked storage and failed logo do not cover the content',()=>{
 for(const options of [{reduced:true},{blocked:'read'},{blocked:'write'},{brokenImage:true}]){
  const v=visit(options);assert.equal(v.splash.hidden,true,JSON.stringify(options));assert.equal(v.timers.size,0);
 }
});
test('Interaction immediately dismisses the intro without cancelling the user action',()=>{
 for(const name of ['pointerdown','touchstart','wheel','keydown','focusin']){
  const v=visit();const event=new Event(name,{cancelable:true});v.document.dispatchEvent(event);
  assert.equal(v.splash.hidden,true,name);assert.equal(event.defaultPrevented,false);assert.equal(v.timers.size,0);
 }
});
test('Back-forward cache, leaving the page, hidden tabs and motion changes cannot restore an overlay',()=>{
 for(const name of ['pagehide','pageshow']){
  const v=visit();v.window.dispatchEvent(Object.assign(new Event(name),{persisted:true}));assert.equal(v.splash.hidden,true);
 }
 const hidden=visit();hidden.document.hidden=true;hidden.document.dispatchEvent(new Event('visibilitychange'));assert.equal(hidden.splash.hidden,true);
 const motion=visit();motion.media.matches=true;motion.media.dispatchEvent(new Event('change'));assert.equal(motion.splash.hidden,true);
});
