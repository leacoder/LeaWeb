import assert from 'node:assert/strict';
import worker from '../deploy/auth-worker.mjs';
const url='https://lgdesign.com.ar/demo/alvarezinmobiliaria/';
const env={BASIC_AUTH_USER:'test-user',BASIC_AUTH_PASSWORD:'test-only-password'};
const req=(auth='',suffix='')=>new Request(url+suffix,{headers:auth?{Authorization:auth}:{}});
assert.equal((await worker.fetch(req(),{})).status,503);
assert.equal((await worker.fetch(req(),env)).status,401);
assert.equal((await worker.fetch(req('Basic invalid*'),env)).status,401);
assert.equal((await worker.fetch(req('Basic '+btoa('bad:credentials')),env)).status,401);
assert.equal((await worker.fetch(req('', '_next/static/app.js'),env)).status,401);
const original=globalThis.fetch;let forwarded=false;
globalThis.fetch=async r=>{assert.equal(r.headers.has('Authorization'),false);forwarded=true;return new Response('ok')};
try{const result=await worker.fetch(req('Basic '+btoa('test-user:test-only-password')),env);assert.equal(result.status,200);assert.equal(result.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');assert.equal(result.headers.get('Cache-Control'),'private, no-store');assert.ok(forwarded)}finally{globalThis.fetch=original}
console.log('PASS: Basic Auth fails closed, challenges invalid/missing credentials, protects assets, forwards valid requests without credentials, adds privacy headers.');
