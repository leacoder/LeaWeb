import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../out/',import.meta.url));
const base='/demo/alvarezinmobiliaria';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname===base){res.writeHead(308,{Location:base+'/'});return res.end()}if(!url.pathname.startsWith(base+'/')){res.writeHead(404);return res.end('Not found')}let file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length+1)));if(file!==path.resolve(root)&&!file.startsWith(path.resolve(root)+path.sep))throw new Error('Invalid path');if((await stat(file)).isDirectory())file=path.join(file,'index.html');const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow'});res.end(body)}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow'});res.end(await readFile(path.join(root,'404.html')).catch(()=>Buffer.from('Not found')))}}).listen(3100,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:3100${base}/`));
