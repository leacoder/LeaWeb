import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { create } from 'fontkit';

const require = createRequire(import.meta.url);
const inter = create(readFileSync(require.resolve('@fontsource/inter/files/inter-latin-400-normal.woff2')));
const interSemibold = create(readFileSync(require.resolve('@fontsource/inter/files/inter-latin-600-normal.woff2')));
const mono = create(readFileSync(require.resolve('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')));

export function textPaths(text, { x = 0, y = 0, size = 16, weight = 400, fill = '#edf3f8', tracking = 0, monospace = false } = {}) {
  const font = monospace ? mono : weight >= 500 ? interSemibold : inter;
  const scale = size / font.unitsPerEm;
  const run = font.layout(text);
  let cursor = 0;
  return `<g fill="${fill}">` + run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const path = glyph.path.toSVG();
    const output = `<path d="${path}" transform="translate(${x + cursor + position.xOffset * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})"/>`;
    cursor += position.xAdvance * scale + tracking;
    return output;
  }).join('') + '</g>';
}

// Convert the editable SVG's text to outlines for portable rendering/sharing.
export function outlineSvg(svg) {
  return svg.replace(/<text\s+([^>]*)>([\s\S]*?)<\/text>/g, (_, attributes, content) => {
    const attribute = (name, fallback) => attributes.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? fallback;
    return textPaths(content.replace(/&amp;/g, '&'), {
      x: Number(attribute('x', 0)), y: Number(attribute('y', 0)),
      size: Number(attribute('font-size', 16)), weight: Number(attribute('font-weight', 400)),
      tracking: Number(attribute('letter-spacing', 0)), fill: attribute('fill', '#edf3f8'),
      monospace: attribute('font-family', '').includes('monospace'),
    });
  });
}
