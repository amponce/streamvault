import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconDir = join(__dirname, '../public/icons');

// Base SVG with the icon design
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="96" ry="96" fill="url(#bgGrad)"/>
  <path d="M190 138 L190 374 L400 256 Z" fill="white"/>
  <path d="M390 195 Q435 256 390 317" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="14" stroke-linecap="round"/>
  <path d="M425 160 Q485 256 425 352" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="12" stroke-linecap="round"/>
</svg>`;

// Maskable icon with more padding for safe area
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)"/>
  <path d="M200 168 L200 344 L370 256 Z" fill="white"/>
  <path d="M360 205 Q395 256 360 307" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="12" stroke-linecap="round"/>
  <path d="M388 178 Q435 256 388 334" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="10" stroke-linecap="round"/>
</svg>`;

async function generateIcons() {
  await mkdir(iconDir, { recursive: true });

  // Generate regular icons
  for (const size of sizes) {
    const filename = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(join(iconDir, filename));
    console.log(`Generated ${filename}`);
  }

  // Generate maskable icons
  for (const size of [192, 512]) {
    await sharp(Buffer.from(svgMaskable))
      .resize(size, size)
      .png()
      .toFile(join(iconDir, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }

  // Generate favicon.ico (using 32x32)
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(join(iconDir, 'favicon-32.png'));
  console.log('Generated favicon-32.png');

  console.log('\\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
