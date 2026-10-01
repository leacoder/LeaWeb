import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { outlineSvg, textPaths } from './svg-text.mjs';
import { logoMark, logoDimensions } from '../src/lib/logo.mjs';

// The editable SVG is the source of the raster sharing image; no remote assets.
const input = fileURLToPath(new URL('../public/og-image.svg', import.meta.url));
const output = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
const svg = outlineSvg(await readFile(input, 'utf8'));
await sharp(Buffer.from(svg)).png().toFile(output);
await writeFile(fileURLToPath(new URL('../public/og-image-v2.png', import.meta.url)), await readFile(output));
for (const [variant, ink, accent] of [['light', '#edf3f8', '#8be2ef'], ['dark', '#071a2e', '#17466b']]) {
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72" role="img" aria-label="LG Design">${logoMark(ink)}${logoDimensions(accent)}${textPaths('DESIGN', {x: 108, y: 46, size: 31, fill: ink, tracking: 1})}${textPaths('DISEÑO + DESARROLLO', {x: 108, y: 60, size: 6.4, monospace: true, fill: accent})}</svg>`;
  await writeFile(fileURLToPath(new URL(`../public/logo-${variant}.svg`, import.meta.url)), logo);
}
await writeFile(fileURLToPath(new URL('../public/favicon.svg', import.meta.url)), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 72"><rect width="100" height="72" rx="8" fill="#071a2e"/>${logoMark()}${logoDimensions()}</svg>`);
console.log('Generated public/og-image.png (1200 × 630).');
