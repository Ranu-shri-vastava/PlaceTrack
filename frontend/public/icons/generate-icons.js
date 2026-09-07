/**
 * PlaceTrack PWA Icon Generator
 * Pure Node.js — no dependencies needed
 * Run: node generate-icons.js
 */

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── CRC32 ────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  return ((crc ^ 0xFFFFFFFF) >>> 0);
}

function chunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB  = Buffer.alloc(4); lenB.writeUInt32BE(data.length);
  const crcB  = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// ── Build pixel grid ─────────────────────────────
function buildPixels(size) {
  const BG    = [79,  70,  229]; // #4f46e5 indigo
  const WHITE = [255, 255, 255];
  const GOLD  = [251, 191,  36]; // #fbbf24
  const TRANS = [30,  27,   75]; // dark corner fill

  const r = Math.round(size * 0.18); // corner radius

  // "PT" letter geometry scaled to icon size
  const cx  = size / 2;
  const cy  = size / 2;
  const lh  = Math.round(size * 0.38);
  const lw  = Math.max(2, Math.round(size * 0.06)); // stroke width

  // P: top-left
  const px  = Math.round(cx - size * 0.28);
  const py  = Math.round(cy - lh / 2);
  const pw  = Math.round(size * 0.18); // bowl width
  const ph  = Math.round(lh * 0.48);  // bowl height

  // T: right of P
  const tx  = Math.round(cx + size * 0.03);
  const ty  = py;
  const tw  = Math.round(size * 0.22);

  // Gold degree dot
  const dotR  = Math.max(2, Math.round(size * 0.045));
  const dotCX = Math.round(tx + tw - dotR);
  const dotCY = Math.round(ty - dotR * 0.5);

  const pixels = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // Rounded corners
      const dx = x < r ? r - x : (x > size - 1 - r ? x - (size - 1 - r) : 0);
      const dy = y < r ? r - y : (y > size - 1 - r ? y - (size - 1 - r) : 0);
      const outside = dx * dx + dy * dy > r * r;

      if (outside) { row.push(TRANS); continue; }

      // Letter P
      const inPvert  = x >= px && x < px + lw && y >= py && y < py + lh;
      const inPtop   = x >= px && x < px + pw && y >= py && y < py + lw;
      const inPmid   = x >= px && x < px + pw && y >= py + ph - lw && y < py + ph;
      const inPright = x >= px + pw - lw && x < px + pw && y >= py && y < py + ph;
      const inP = inPvert || inPtop || inPmid || inPright;

      // Letter T
      const inTtop  = x >= tx && x < tx + tw && y >= ty && y < ty + lw;
      const inTvert = x >= tx + Math.round((tw - lw) / 2) && x < tx + Math.round((tw - lw) / 2) + lw && y >= ty && y < ty + lh;
      const inT = inTtop || inTvert;

      // Gold dot
      const inDot = Math.sqrt((x - dotCX) ** 2 + (y - dotCY) ** 2) <= dotR;

      if (inDot)   { row.push(GOLD);  continue; }
      if (inP || inT) { row.push(WHITE); continue; }
      row.push(BG);
    }
    pixels.push(row);
  }
  return pixels;
}

// ── Encode PNG ───────────────────────────────────
function encodePNG(size) {
  const pixels = buildPixels(size);

  // Raw image data: filter byte (0) + RGB per row
  const rows = pixels.map(row => {
    const buf = Buffer.alloc(1 + size * 3);
    buf[0] = 0; // None filter
    row.forEach((px, i) => {
      buf[1 + i * 3]     = px[0];
      buf[1 + i * 3 + 1] = px[1];
      buf[1 + i * 3 + 2] = px[2];
    });
    return buf;
  });
  const raw = Buffer.concat(rows);

  // Compress with Node built-in zlib (deflate)
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 2; // RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Generate all sizes ───────────────────────────
SIZES.forEach(size => {
  try {
    const buf  = encodePNG(size);
    const file = path.join(__dirname, `icon-${size}x${size}.png`);
    fs.writeFileSync(file, buf);
    console.log(`✅  icon-${size}x${size}.png   (${(buf.length/1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error(`❌  ${size}x${size} failed:`, e.message);
  }
});

console.log('\n🎉 Done! Icons saved in /public/icons/');
console.log('💡 Tip: Replace with your own logo PNG using realfavicongenerator.net');
