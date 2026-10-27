import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source = readFileSync(new URL('../src/components/LanguagePreference.astro', import.meta.url),'utf8').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function visit(path, languages, stored, blocked=false, error=false) {
 const saved=new Map(stored?[['lg-language',stored]]:[]); let redirect;
 const location=new URL('https://lgdesign.com.ar'+path); location.replace=value=>redirect=value;
 runInNewContext(source,{URL,location,navigator:{languages},localStorage:{getItem:k=>{if(blocked)throw Error();return saved.get(k)},setItem:(k,v)=>{if(blocked)throw Error();saved.set(k,v)}},document:{documentElement:{dataset:{error:String(error)}},addEventListener(){}}});
 return {redirect,saved};
}
assert.equal(visit('/', ['en-US']).redirect,'https://lgdesign.com.ar/en/');
assert.equal(visit('/', ['es-AR']).redirect,undefined);
assert.equal(visit('/', ['fr-FR']).redirect,undefined);
assert.equal(visit('/', ['fr-FR','en-GB']).redirect,'https://lgdesign.com.ar/en/');
assert.equal(visit('/', ['en-US'],'es').redirect,undefined);
assert.equal(visit('/', ['es-AR'],'en').redirect,'https://lgdesign.com.ar/en/');
assert.equal(visit('/', ['es-AR'],'invalid').redirect,undefined);
assert.equal(visit('/en/', ['es-AR'],'es').redirect,undefined);
assert.equal(visit('/?lang=es', ['en-US'],'en').saved.get('lg-language'),'es');
assert.equal(visit('/?lang=es', ['en-US'],null,true).redirect,undefined);
assert.equal(visit('/servicios/?utm_source=test#contacts',['en']).redirect,'https://lgdesign.com.ar/en/servicios/?utm_source=test#contacts');
assert.equal(visit('/missing/',['en'],null,false,true).redirect,undefined);
assert.equal(visit('/404.html',['en']).redirect,undefined);
assert.equal(visit('/v2/#vybe',['en']).redirect,'https://lgdesign.com.ar/en/v2/#vybe');
assert.equal(visit('/v2/?lang=es#piezas',['en'],'en').redirect,undefined);
assert.equal(visit('/en/v2/?lang=en#vybe',['es'],'es').saved.get('lg-language'),'en');
assert.equal(visit('/v2/?lang=es',['en'],null,true).redirect,undefined);
console.log('Idioma: detección, fallback, preferencia, enlaces explícitos, almacenamiento bloqueado y 404 correctos.');
