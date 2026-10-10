import {readdir,readFile,mkdir,copyFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(project,'out');
const target=path.resolve(project,'../../demo/alvarezinmobiliaria');
const allowedRoot=path.resolve(project,'../../demo')+path.sep;
if(!target.startsWith(allowedRoot))throw new Error('Destination outside demo directory');
const manifest=path.join(project,'.demo-output.json');
function safe(relative){const result=path.resolve(target,relative);if(!result.startsWith(target+path.sep)||relative.includes('..'))throw new Error('Invalid output path');return result}
async function walk(dir,prefix=''){const result=[];for(const item of await readdir(dir,{withFileTypes:true})){const rel=prefix+item.name;if(item.isDirectory())result.push(...await walk(path.join(dir,item.name),rel+'/'));else if(item.isFile())result.push(rel);else throw new Error('Unexpected file type')}return result}
const files=await walk(source);
if(!files.includes('index.html')||!files.includes('propiedades/av-101/index.html'))throw new Error('Build the complete demo first');
let previous=[];try{previous=JSON.parse(await readFile(manifest,'utf8')).files}catch(e){if(e.code!=='ENOENT')throw e}
if(!Array.isArray(previous))throw new Error('Invalid manifest');
files.forEach(safe);previous.forEach(safe);
for(const file of files){const to=safe(file);await mkdir(path.dirname(to),{recursive:true});await copyFile(path.join(source,file),to)}
for(const file of previous.filter(x=>!files.includes(x)))await unlink(safe(file)).catch(e=>{if(e.code!=='ENOENT')throw e});
await writeFile(manifest,JSON.stringify({files:files.sort()},null,2)+'\n');
console.log(`Prepared ${files.length} demo files at ${target}`);
