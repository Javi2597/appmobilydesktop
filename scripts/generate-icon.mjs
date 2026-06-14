// Genera build/icon.ico (multi-resolución) y build/icon.png a partir de
// build/icon.svg. Ejecutar con: pnpm icon
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'build', 'icon.svg'));

// Tamaños que incluye un .ico estándar de Windows.
const sizes = [256, 128, 64, 48, 32, 16];
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
);

writeFileSync(join(root, 'build', 'icon.ico'), await pngToIco(pngs));

// PNG maestro (1024) para la ventana en desarrollo y otras plataformas.
writeFileSync(
  join(root, 'build', 'icon.png'),
  await sharp(svg).resize(1024, 1024).png().toBuffer()
);

console.log('Generados build/icon.ico y build/icon.png');
