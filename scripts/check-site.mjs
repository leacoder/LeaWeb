import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const rootMode = process.argv.includes('--root');
const dist = rootMode ? path.resolve(projectRoot) : path.join(projectRoot, 'dist');
const site = new URL('https://lgdesign.com.ar/');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1].toLowerCase(), decode(match[2])]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => attrs(match[0]));
const metadata = (html, key) => tags(html, 'meta').find((tag) => tag.name === key || tag.property === key)?.content;

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]));
  return groups.flat();
}

function routeFor(file) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/index\.html$/, '')}`;
}

async function resolveBuiltFile(url) {
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const destination = path.resolve(dist, relative);
  if (destination !== dist && !destination.startsWith(`${dist}${path.sep}`)) return null;
  for (const candidate of [destination, path.join(destination, 'index.html')]) {
    try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* Try the next candidate. */ }
  }
  return null;
}

let files;
try {
  if (rootMode) {
    const manifest = JSON.parse(await readFile(path.join(projectRoot, '.site-output.json'), 'utf8'));
    files = manifest.files.map((relative) => {
      const absolute = path.resolve(projectRoot, relative);
      if (!absolute.startsWith(`${path.resolve(projectRoot)}${path.sep}`) || relative.includes('..')) throw new Error('Manifest inválido.');
      return absolute;
    });
    assert(files.some((file) => path.basename(file) === '.nojekyll'), 'Falta .nojekyll para servir _astro en Pages.');
  } else files = await filesIn(dist);
} catch {
  console.error('No se encontró dist/. Ejecutá npm run build antes de npm run verify.');
  process.exit(1);
}

const htmlFiles = files.filter((file) => file.endsWith('.html'));
assert(htmlFiles.length > 1, 'El build debe contener la home y las páginas de contenido.');
const pageCache = new Map(await Promise.all(htmlFiles.map(async (file) => [file, await readFile(file, 'utf8')])));

for (const [file, html] of pageCache) {
  const route = routeFor(file);
  const legacy = route === '/tablet/';
  const errorPage = route === '/404.html' || route === '/404/';
  const label = path.relative(dist, file);
  assert(/<html\b[^>]*\blang=["']es(?:-AR)?["']/i.test(html), `${label}: falta el idioma español.`);
  assert(/<meta\b[^>]*name=["']viewport["']/i.test(html), `${label}: falta viewport responsive.`);
  assert((html.match(/<h1\b/gi) ?? []).length === 1, `${label}: debe tener exactamente un H1.`);
  assert(/<title>[^<]{10,}<\/title>/i.test(html), `${label}: falta un título descriptivo.`);
  assert((metadata(html, 'description') ?? '').length >= 25, `${label}: falta descripción SEO.`);
  assert(!/onscreen3d\.com|museutils|museredirect|jquery\.muse|name=["']generator["'][^>]*Muse/i.test(html), `${label}: contiene referencias al sitio o runtime anterior.`);
  const canonicals = tags(html, 'link').filter((tag) => tag.rel === 'canonical');
  const expectedCanonical = legacy ? site.href : new URL(route, site).href;
  assert(canonicals.length === 1 && canonicals[0].href === expectedCanonical, `${label}: canonical incorrecto; se esperaba ${expectedCanonical}.`);
  if (legacy || errorPage) {
    assert((metadata(html, 'robots') ?? '').includes('noindex'), `${label}: debe excluirse de la indexación.`);
  } else {
    assert(!(metadata(html, 'robots') ?? '').includes('noindex'), `${label}: la página pública no debe tener noindex.`);
    for (const name of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card']) {
      assert(Boolean(metadata(html, name)), `${label}: falta ${name}.`);
    }
    assert(metadata(html, 'og:url') === expectedCanonical, `${label}: og:url debe coincidir con canonical.`);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((match) => attrs(match[1]).type === 'application/ld+json');
    assert(scripts.length > 0, `${label}: faltan datos estructurados.`);
    for (const script of scripts) {
      try {
        const structured = JSON.parse(script[2]);
        assert(structured && typeof structured === 'object', `${label}: datos estructurados vacíos.`);
        const graph = structured['@graph'] ?? [];
        const entity = (type) => graph.find((node) => node['@type'] === type);
        assert(entity('WebPage')?.url === expectedCanonical, `${label}: WebPage debe identificar la URL canónica.`);
        if (/^\/servicios\/[^/]+\/$/.test(route)) {
          const service = entity('Service');
          assert(service?.url === expectedCanonical && service?.provider?.['@id'] === `${site.origin}/#organization`, `${label}: el servicio debe identificar página y proveedor.`);
        }
        if (route === '/') {
          const faq = entity('FAQPage');
          assert(faq?.mainEntity?.length > 0, 'Home: faltan preguntas estructuradas.');
          for (const question of faq?.mainEntity ?? []) {
            const visibleText = decode(html.replace(/<[^>]+>/g, ' '));
            assert(visibleText.includes(question.name) && visibleText.includes(question.acceptedAnswer?.text), 'Home: las preguntas y respuestas estructuradas deben ser visibles.');
          }
        }
      } catch { failures.push(`${label}: JSON-LD no es JSON válido.`); }
    }
  }

  const references = [...tags(html, 'a').map((tag) => tag.href), ...tags(html, 'link').map((tag) => tag.href), ...tags(html, 'img').map((tag) => tag.src), ...tags(html, 'script').map((tag) => tag.src), metadata(html, 'og:image')].filter(Boolean);
  for (const tag of [...tags(html, 'img'), ...tags(html, 'source')]) {
    if (tag.srcset) references.push(...tag.srcset.split(',').map((item) => item.trim().split(/\s+/)[0]));
  }
  for (const reference of references) {
    if (/^(?:mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    let target;
    try { target = new URL(reference, new URL(route, site)); } catch {
      failures.push(`${label}: URL inválida ${reference}.`);
      continue;
    }
    if (target.origin !== site.origin) continue;
    const targetFile = await resolveBuiltFile(target);
    assert(Boolean(targetFile), `${label}: enlace o recurso inexistente ${reference}.`);
    if (targetFile && reference === metadata(html, 'og:image') && metadata(html, 'og:image:type') === 'image/png') {
      const png = await readFile(targetFile);
      const validPNG = png.length >= 24 && png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      assert(validPNG, `${label}: la imagen social debe ser un PNG válido.`);
      if (validPNG) {
        assert(Number(metadata(html, 'og:image:width')) === png.readUInt32BE(16), `${label}: el ancho declarado no coincide con la imagen social.`);
        assert(Number(metadata(html, 'og:image:height')) === png.readUInt32BE(20), `${label}: el alto declarado no coincide con la imagen social.`);
      }
    }
    if (targetFile && target.hash && targetFile.endsWith('.html')) {
      const targetHTML = pageCache.get(targetFile) ?? await readFile(targetFile, 'utf8');
      const ids = [...targetHTML.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
      assert(ids.includes(decodeURIComponent(target.hash.slice(1))), `${label}: ancla inexistente ${reference}.`);
    }
  }
}

const homepage = pageCache.get(path.join(dist, 'index.html')) ?? '';
for (const anchor of ['home', 'about', 'services', 'works', 'contacts']) {
  assert(new RegExp(`\\bid=["']${anchor}["']`).test(homepage), `Home: falta el ancla de compatibilidad #${anchor}.`);
}
assert(/Diseño\s+y\s+desarrollo/i.test(homepage.replace(/<[^>]+>/g, ' ')), 'Home: el mensaje principal debe estar en el HTML estático.');
assert(/https:\/\/wa\.me\/5491134477257(?:\?|["'])/.test(homepage), 'Home: el enlace de WhatsApp debe usar 5491134477257.');
assert(/mailto:lg\.design\.web@gmail\.com/.test(homepage), 'Home: falta el correo de contacto.');

const tabletHTML = pageCache.get(path.join(dist, 'tablet', 'index.html')) ?? '';
assert(tags(tabletHTML, 'a').some((tag) => tag.href === '/'), 'Tablet: falta el enlace visible a la home sin JavaScript.');
const redirectScript = [...tabletHTML.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0]?.[1];
assert(Boolean(redirectScript), 'Tablet: falta la redirección de compatibilidad.');
if (redirectScript) {
  for (const fragment of ['', '#home', '#about', '#services', '#works', '#contacts']) {
    let redirected = '';
    const fallbackLink = {};
    try {
      runInNewContext(redirectScript, {
        URL,
        document: { getElementById: () => fallbackLink },
        window: { location: { origin: site.origin, hash: fragment, search: '?devicelock=tablet', replace: (url) => { redirected = url; } } },
      }, { timeout: 1000 });
      assert(redirected === `${site.href}${fragment}` && fallbackLink.href === redirected, `Tablet: no conserva ${fragment || 'la raíz'} o incluye parámetros antiguos.`);
    } catch (error) { failures.push(`Tablet: error al redirigir ${fragment}: ${error.message}.`); }
  }
}

for (const file of files.filter((file) => file.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  const cssURL = new URL(`/${path.relative(dist, file).split(path.sep).join('/')}`, site);
  for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
    if (/^(?:data:|#)/i.test(match[1])) continue;
    const resource = new URL(match[1], cssURL);
    if (resource.origin === site.origin) assert(Boolean(await resolveBuiltFile(resource)), `CSS: recurso inexistente ${resource.href}.`);
  }
}

const sitemapFiles = files.filter((file) => /sitemap[^/\\]*\.xml$/.test(file));
assert(sitemapFiles.some((file) => path.basename(file) === 'sitemap-index.xml'), 'Falta sitemap-index.xml.');
for (const sitemapFile of sitemapFiles) {
  const xml = await readFile(sitemapFile, 'utf8');
  assert(!/\/(?:tablet|404)(?:[/.<]|$)/.test(xml), 'El sitemap contiene una página de compatibilidad o de error.');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(decode(match[1]));
    assert(url.origin === site.origin, `Sitemap: dominio incorrecto ${url.href}.`);
    assert(Boolean(await resolveBuiltFile(url)), `Sitemap: URL inexistente ${url.href}.`);
  }
}
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8').catch(() => '');
assert(robots.includes(`Sitemap: ${site.href}sitemap-index.xml`) && /Allow:\s*\//.test(robots), 'robots.txt debe permitir rastreo y apuntar al sitemap HTTPS.');
assert(/User-agent:\s*OAI-SearchBot\s+Allow:\s*\//i.test(robots), 'robots.txt debe permitir el rastreador de búsqueda de ChatGPT.');
assert((await readFile(path.join(dist, 'CNAME'), 'utf8').catch(() => '')).trim() === site.hostname, 'CNAME debe conservar lgdesign.com.ar.');
assert(!files.some((file) => /\.(?:php|zip)$/i.test(file)), 'El build no debe publicar los formularios PHP ni archivos originales ZIP.');

if (failures.length) {
  console.error(`Verificación fallida (${failures.length}):\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}
console.log(`Verificación correcta: ${htmlFiles.length} páginas HTML, enlaces, anclas, contacto, metadatos, JSON-LD y sitemap.`);
