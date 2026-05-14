/**
 * PWAアイコン生成スクリプト (外部依存ゼロ)
 * `npm run gen-icons` または `node scripts/gen-icons.mjs` で実行
 * 出力: public/icons/icon-192.png, public/icons/icon-512.png
 */

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function roundedRectPNG(size, bg, fg) {
  const [br, bg_, bb] = bg;
  const [fr, fg_, fb] = fg;
  const r = Math.round(size * 0.18);

  // RGBA pixel buffer
  const pixels = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2, cy = size / 2;
  const boxR = size * 0.38;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Background
      pixels[i] = br; pixels[i + 1] = bg_; pixels[i + 2] = bb; pixels[i + 3] = 255;

      // Rounded rect (box)
      const dx = Math.abs(x - cx) - boxR + r;
      const dy = Math.abs(y - cy) - boxR + r;
      const inRect = dx < r && dy < r && (dx <= 0 || dy <= 0 || dx * dx + dy * dy < r * r);
      if (inRect) { pixels[i] = fr; pixels[i + 1] = fg_; pixels[i + 2] = fb; }

      // Letter 'P' (package icon) — simple pixel drawing
      const lx = Math.round(x - cx + size * 0.06);
      const ly = Math.round(y - cy + size * 0.08);
      const s = Math.round(size * 0.012);
      const isP = (
        // vertical bar
        (lx >= -s && lx <= s && ly >= -size * 0.18 && ly <= size * 0.18) ||
        // top of P
        (lx >= -s && lx <= size * 0.12 && ly >= -size * 0.18 && ly <= -size * 0.18 + 2 * s) ||
        (lx >= size * 0.12 - s && lx <= size * 0.12 + s && ly >= -size * 0.18 && ly <= 0) ||
        (lx >= -s && lx <= size * 0.12 && ly >= -s && ly <= s)
      );
      if (inRect && isP) { pixels[i] = br; pixels[i + 1] = bg_; pixels[i + 2] = bb; }
    }
  }

  // Build IDAT (raw scanlines with filter byte 0)
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 4)] = 0;
    pixels.copy(rows, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // 10,11,12 = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const iconsDir = join(__dirname, "..", "public", "icons");
mkdirSync(iconsDir, { recursive: true });

// bg: #0f172a (slate-900), fg: white
const bg = [15, 23, 42];
const fg = [255, 255, 255];

writeFileSync(join(iconsDir, "icon-192.png"), roundedRectPNG(192, bg, fg));
writeFileSync(join(iconsDir, "icon-512.png"), roundedRectPNG(512, bg, fg));

console.log("✓ public/icons/icon-192.png");
console.log("✓ public/icons/icon-512.png");
