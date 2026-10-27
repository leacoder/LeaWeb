import { parse, walkSync, renderSync, TEXT_NODE, ELEMENT_NODE } from 'ultrahtml';
import { english } from './translations';

const keys = Object.keys(english).sort((a, b) => b.length - a.length);
const pattern = new RegExp(keys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
export const translate = (value: string) => value.trim() === 'o' ? value.replace('o', 'or') : value.replace(pattern, match => english[match]);
const origin = 'https://lgdesign.com.ar';
const localizeURL = (value: string) => {
  const path = value.startsWith(origin) ? value.slice(origin.length) : value;
  // Assets and external demo sites keep their original addresses.
  if (!/^\/(?:$|#|servicios(?:\/|$)|proyectos(?:\/|$)|404\.html$)/.test(path)) return value;
  return (value.startsWith(origin) ? origin : '') + '/en' + path.replace('/404.html', '/404/');
};
function translateData(value: unknown, key = ''): unknown {
  if (typeof value === 'string') {
    if (['@id', 'url', 'item'].includes(key)) {
      if (/#(?:organization|person|website)$/.test(value)) return value;
      return localizeURL(value);
    }
    if (key === 'inLanguage') return 'en';
    if (key === 'availableLanguage') return ['es', 'en'];
    return ['name', 'description', 'text', 'jobTitle', 'contactType', 'serviceType', 'knowsAbout'].includes(key) ? translate(value) : value;
  }
  if (Array.isArray(value)) return value.map(item => translateData(item, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, translateData(v, k)]));
  return value;
}
export function translateHTML(html: string, additional: Record<string, string> = {}) {
  const copy = { ...english, ...additional };
  const customKeys = Object.keys(copy).sort((a, b) => b.length - a.length);
  const customPattern = new RegExp(customKeys.map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const translateText = Object.keys(additional).length ? (value: string) => value.replace(customPattern, match => copy[match]) : translate;
  const tree = parse(html);
  walkSync(tree, (node) => {
    if (node.type === TEXT_NODE) {
      if (node.parent?.name === 'script' && node.parent.attributes.type === 'application/ld+json') {
        node.value = JSON.stringify(translateData(JSON.parse(node.value))).replace(/</g, '\\u003c');
      } else if (!['script', 'style'].includes(node.parent?.name)) node.value = translateText(node.value);
    }
    if (node.type !== ELEMENT_NODE) return;
    const a = node.attributes;
    if (node.name === 'html') a.lang = 'en';
    for (const key of ['alt', 'title', 'aria-label']) if (a[key]) a[key] = translateText(a[key]);
    if (node.name === 'meta') {
      if (a.property === 'og:locale') a.content = 'en_US';
      else if (a.property === 'og:url') a.content = localizeURL(a.content);
      else if (['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description'].includes(a.name || a.property)) a.content = translateText(a.content);
    }
    if (a.href && !('data-language' in a) && a.rel !== 'alternate') {
      a.href = localizeURL(a.href);
      if (a.href.startsWith('https://wa.me/')) a.href = a.href.split('?')[0] + '?text=Hi%20Leandro%2C%20I%27d%20like%20to%20tell%20you%20about%20my%20project.';
    }
  });
  return renderSync(tree);
}
