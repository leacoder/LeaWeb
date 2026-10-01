import { readdir, readFile, writeFile, mkdir, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const manifestPath = path.join(root, '.site-output.json');
// Keep retired image names allowed so the previous manifest can remove them safely.
const allowed = new Set(['.nojekyll', '404.html', 'CNAME', 'favicon.svg', 'index.html', 'logo-dark.svg', 'logo-light.svg', 'og-image.png', 'og-image-v2.png', 'og-logo-v3.png', 'og-image.svg', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml']);
function destination(relative) {
  const parts = relative.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..') || relative.includes('\\')) throw new Error(`Ruta inválida: ${relative}`);
  if (!allowed.has(relative) && !['_astro', 'proyectos', 'servicios', 'tablet'].includes(parts[0])) throw new Error(`Archivo fuera de la salida publicada: ${relative}`);
  if (parts[0] === 'tablet' && relative !== 'tablet/index.html') throw new Error(`Archivo de compatibilidad inesperado: ${relative}`);
  const target = path.resolve(root, ...parts);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('La ruta sale del repositorio.');
  return target;
}
async function walk(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await walk(path.join(directory, entry.name), relative + '/'));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Recurso inesperado: ${relative}`);
  }
  return result.sort();
}
const files = await walk(dist);
files.forEach(destination);
if (!files.includes('index.html') || !files.includes('.nojekyll')) throw new Error('Falta la salida completa para Pages. Ejecutá npm run build.');
let previous = [];
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')).files; } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(previous)) throw new Error('Manifest de publicación inválido.');
previous.forEach(destination);
for (const relative of files) {
  const target = destination(relative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(dist, ...relative.split('/')), target);
}
// Only retire files explicitly owned by a previous generated release.
for (const relative of previous.filter((file) => !files.includes(file))) {
  await unlink(destination(relative)).catch((error) => { if (error.code !== 'ENOENT') throw error; });
}
await writeFile(manifestPath, JSON.stringify({ files }, null, 2) + '\n');
console.log(`GitHub Pages: ${files.length} archivos preparados en la raíz del repositorio.`);
