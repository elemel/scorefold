const fs = require('fs');
const path = require('path');
const SVGIcons2SVGFontStream = require('svgicons2svgfont').default || require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');

const FONT_NAME = 'Twenty Winks';
const GLYPHS_DIR = path.join(__dirname, 'glyphs');
const FILE_NAME = 'twenty_winks';

const fontStream = new SVGIcons2SVGFontStream({
  fontName: FONT_NAME,
  fontHeight: 1024,
  normalize: false,
  descent: 128
});

let svgFontData = '';

fontStream
  .on('data', (chunk) => { svgFontData += chunk; })
  .on('end', () => {
    const ttf = svg2ttf(svgFontData, {
      familyname: FONT_NAME,
      subfamilyname: 'Regular',
      version: 'Version 1.0'
    });
    fs.writeFileSync(`${FILE_NAME}.ttf`, Buffer.from(ttf.buffer));
    console.log(`Created ${FILE_NAME}.ttf`);
  });

// Auto-load all SVGs in glyphs/ (including u0020-space.svg)
const files = fs.readdirSync(GLYPHS_DIR).filter(f => f.endsWith('.svg'));

for (const file of files) {
  const match = file.match(/^u([0-9a-fA-F]{4,6})-(.+)\.svg$/);
  if (!match) continue;

  const char = String.fromCodePoint(parseInt(match[1], 16));
  const glyphName = match[2];

  // Map A-Z (and Å, Ä, Ö) to both uppercase and lowercase
  const unicodes = /^[A-ZÅÄÖ]$/.test(char) ? [char, char.toLowerCase()] : [char];

  const glyph = fs.createReadStream(path.join(GLYPHS_DIR, file));
  glyph.metadata = { unicode: unicodes, name: glyphName };
  fontStream.write(glyph);
}

fontStream.end();

