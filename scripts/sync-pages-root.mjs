import { readdir, readFile, writeFile, mkdir, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const manifestPath = path.join(root, '.site-output.json');
const previewOnly = process.argv.includes('--preview=v3');
// Keep retired image names allowed so the previous manifest can remove them safely.
const allowed = new Set(['.nojekyll', '404.html', 'CNAME', 'favicon.svg', 'index.html', 'logo-dark.svg', 'logo-light.svg', 'og-image.png', 'og-image-v2.png', 'og-logo-v3.png', 'og-logo-v4.png', 'og-image.svg', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml']);
function destination(relative) {
  const parts = relative.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..') || relative.includes('\\')) throw new Error(`Ruta inválida: ${relative}`);
  if (!allowed.has(relative) && !['_astro', 'proyectos', 'servicios', 'tablet', 'en', 'v2', 'v3'].includes(parts[0])) throw new Error(`Archivo fuera de la salida publicada: ${relative}`);
  if (parts[0] === 'tablet' && relative !== 'tablet/index.html') throw new Error(`Archivo de compatibilidad inesperado: ${relative}`);
  if (parts[0] === 'v2' && relative !== 'v2/index.html') throw new Error(`Vista previa inesperada: ${relative}`);
  if (parts[0] === 'v3' && relative !== 'v3/index.html') throw new Error(`Vista previa inesperada: ${relative}`);
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
// Follow references through the built HTML, scripts and CSS instead of copying
// unrelated bundles produced by the full build (which may belong to old pages).
async function previewDependencies() {
  const assets = files.filter(file => file.startsWith('_astro/'));
  const selected = new Set();
  const pending = ['v3/index.html', 'en/v3/index.html'];
  while (pending.length) {
    const file = pending.pop();
    if (selected.has(file)) continue;
    if (!files.includes(file)) throw new Error(`Falta un archivo de v3: ${file}`);
    selected.add(file);
    if (!/\.(?:html|css|m?js)$/.test(file)) continue;
    const content = await readFile(path.join(dist, file), 'utf8');
    for (const asset of assets) {
      if (!selected.has(asset) && content.includes(path.posix.basename(asset))) pending.push(asset);
    }
  }
  return [...selected].sort();
}
const selected = previewOnly ? await previewDependencies() : files;
if (previewOnly && !['v3/index.html', 'en/v3/index.html'].every(file => selected.includes(file))) throw new Error('Faltan las dos rutas de v3.');
// Preflight every asset before writing: existing releases keep their exact bytes.
if (previewOnly) {
  for (const relative of selected.filter(file => file.startsWith('_astro/'))) {
    const next = await readFile(path.join(dist, relative));
    try {
      const current = await readFile(destination(relative));
      if (!current.equals(next)) throw new Error(`Conflicto con un recurso publicado: ${relative}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
for (const relative of selected) {
  const target = destination(relative);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(dist, ...relative.split('/')), target);
}
// Only retire files explicitly owned by a previous generated release.
for (const relative of previous.filter((file) => !previewOnly && !files.includes(file))) {
  await unlink(destination(relative)).catch((error) => { if (error.code !== 'ENOENT') throw error; });
}
const published = previewOnly ? [...new Set([...previous, ...selected])].sort() : files;
await writeFile(manifestPath, JSON.stringify({ files: published }, null, 2) + '\n');
console.log(`GitHub Pages: ${selected.length} archivos preparados${previewOnly ? ' para v3; las versiones existentes se conservan' : ''}.`);
