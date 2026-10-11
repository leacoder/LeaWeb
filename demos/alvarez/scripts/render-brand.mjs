// Vector reinterpretation of the supplied Alvarez mark. Text is outlined so
// the result stays sharp and identical without depending on installed fonts.
import {create} from 'fontkit';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=new URL('../public/',import.meta.url);
const bold=create(await readFile(require.resolve('@fontsource/inter/files/inter-latin-800-normal.woff2')));
const medium=create(await readFile(require.resolve('@fontsource/inter/files/inter-latin-600-normal.woff2')));
function letters(text,x,y,size,weight,tracking,fill){
  const face=weight>700?bold:medium;
  const run=face.layout(text),scale=size/face.unitsPerEm;
  return `<g fill="${fill}">`+run.glyphs.map((glyph,i)=>{
    const p=run.positions[i];const out=`<path d="${glyph.path.toSVG()}" transform="translate(${x+p.xOffset*scale} ${y-p.yOffset*scale}) scale(${scale} ${-scale})"/>`;
    x+=p.xAdvance*scale+tracking;return out;
  }).join('')+'</g>';
}
function mark(color,cutout){return `<path fill="${color}" d="M2 7h40l18 31-13 26H2z"/><path fill="#e94b0c" d="M36 7h25l9 15H45zM2 60h26l-4 11H2zM40 60h14l6 11H46z"/><path fill="${cutout}" fill-rule="evenodd" d="M12 58 29 23h13l15 35H44l-3-8H28l-3 8zm19-17h7l-3-11z"/>`}
for(const light of [false,true]){
  const ink=light?'#ffffff':'#074985';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 292 78" role="img" aria-label="Álvarez Propiedades"><title>Álvarez Propiedades</title>${mark(ink,light?'#0d2948':'#ffffff')}${letters('ÁLVAREZ',79,46,36,850,-.8,ink)}${letters('PROPIEDADES',81,65,10.5,650,3.5,ink)}</svg>`;
  await writeFile(new URL(light?'brand-light.svg':'brand.svg',root),svg+'\n');
}
await writeFile(new URL('favicon.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 78"><rect width="76" height="78" rx="9" fill="white"/>${mark('#074985','#ffffff')}</svg>\n`);
