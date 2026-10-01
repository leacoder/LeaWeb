import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { outlineSvg, textPaths } from './svg-text.mjs';

// The editable SVG is the source of the raster sharing image; no remote assets.
const input = fileURLToPath(new URL('../public/og-image.svg', import.meta.url));
const output = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
const svg = outlineSvg(await readFile(input, 'utf8'));
await sharp(Buffer.from(svg)).png().toFile(output);
for (const [variant, ink, accent] of [['light', '#edf3f8', '#8be2ef'], ['dark', '#071a2e', '#17466b']]) {
  const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="72" viewBox="0 0 240 72" role="img" aria-label="LG Design"><g fill="none" stroke="${accent}"><path d="M1 8h56M7 2v58M1 54h56M51 2v58" stroke-width=".7" opacity=".5"/><path d="M14 15v32h15m16-27a11 11 0 0 0-19 9v6a11 11 0 0 0 19 9V30H34" stroke-width="4"/></g>${textPaths('LG DESIGN', {x: 74, y: 33, size: 24, weight: 650, fill: ink, tracking: -.35})}${textPaths('DISEÑO + DESARROLLO', {x: 74, y: 49, size: 7.9, monospace: true, fill: ink, tracking: .15})}</svg>`;
  await writeFile(fileURLToPath(new URL(`../public/logo-${variant}.svg`, import.meta.url)), logo);
}
console.log('Generated public/og-image.png (1200 × 630).');
