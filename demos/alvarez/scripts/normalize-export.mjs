// Workaround for Next.js Windows static-export segment paths:
// https://github.com/vercel/next.js/issues/92339
// The browser requests flat __next.a.b.txt; Windows may emit __next.a/b.txt.
// Keep the original files, add portable aliases in the export itself.
import {readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../out/',import.meta.url));
async function walk(dir,prefix=[]){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const parts=[...prefix,entry.name];if(entry.isDirectory())files.push(...await walk(path.join(dir,entry.name),parts));else files.push(parts)}return files}
if(process.env.DEMO_SERVER!=='1'){
  let count=0;
  for(const parts of await walk(root)){
    const index=parts.findIndex(p=>p.startsWith('__next.'));
    if(index<0||index===parts.length-1||!parts.at(-1).endsWith('.txt'))continue;
    const target=path.join(root,...parts.slice(0,index),parts.slice(index).join('.'));
    await copyFile(path.join(root,...parts),target);count++;
  }
  console.log(`Static export: ${count} portable segment aliases prepared.`);
}
