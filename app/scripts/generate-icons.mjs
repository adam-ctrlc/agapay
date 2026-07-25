import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "assets");

const BLUE_DARK = "#0b2f8f";
const BLUE = "#0038a8";
const BLUE_LIGHT = "#1a5ee0";
const RED = "#ce1126";

/**
 * The eight-ray Philippine sun over a government hall with a heart in the
 * pediment, matching components/brand/logo-mark.tsx. Kept in sync by hand
 * because the app draws it with react-native-svg and this needs raw SVG to
 * rasterize.
 */
function mark(fill) {
  return `
    <g fill="${fill}">
      <path d="M28.6 11.65 L31.8 10.5 L28.6 9.35 Z" />
      <path d="M26.44 14.57 L29.52 16.02 L28.07 12.94 Z" />
      <path d="M22.85 15.1 L24 18.3 L25.15 15.1 Z" />
      <path d="M19.93 12.94 L18.48 16.02 L21.56 14.57 Z" />
      <path d="M19.4 9.35 L16.2 10.5 L19.4 11.65 Z" />
      <path d="M21.56 6.43 L18.48 4.98 L19.93 8.06 Z" />
      <path d="M25.15 5.9 L24 2.7 L22.85 5.9 Z" />
      <path d="M28.07 8.06 L29.52 4.98 L26.44 6.43 Z" />
      <circle cx="24" cy="10.5" r="3.4" />
      <path d="M11.5 26 L24 18.8 L36.5 26 Z" />
      <rect x="12" y="26.4" width="24" height="2.2" rx="0.6" />
      <rect x="13.55" y="29.4" width="2.5" height="8.2" rx="0.5" />
      <rect x="18.15" y="29.4" width="2.5" height="8.2" rx="0.5" />
      <rect x="22.75" y="29.4" width="2.5" height="8.2" rx="0.5" />
      <rect x="27.35" y="29.4" width="2.5" height="8.2" rx="0.5" />
      <rect x="31.95" y="29.4" width="2.5" height="8.2" rx="0.5" />
      <rect x="10.8" y="38" width="26.4" height="2.3" rx="0.7" />
      <rect x="9.2" y="40.8" width="29.6" height="2.5" rx="0.8" />
    </g>
    <path
      d="M24 25.78 C21.8 24.1 20.75 23.17 20.75 21.9 C20.75 20.97 21.51 20.27 22.43 20.27 C23.07 20.27 23.65 20.62 24 21.14 C24.35 20.62 24.93 20.27 25.57 20.27 C26.49 20.27 27.25 20.97 27.25 21.9 C27.25 23.17 26.2 24.1 24 25.78 Z"
      fill="${RED}"
    />`;
}

const gradient = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE_DARK}" />
      <stop offset="0.5" stop-color="${BLUE}" />
      <stop offset="1" stop-color="${BLUE_LIGHT}" />
    </linearGradient>
  </defs>`;

/** Full square tile: gradient background, logo inset. Used for the app icon. */
function tile({ rounded }) {
  const radius = rounded ? 96 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    ${gradient}
    <rect width="512" height="512" rx="${radius}" fill="url(#bg)" />
    <g transform="translate(102.4 102.4) scale(6.4)">${mark("#ffffff")}</g>
  </svg>`;
}

/**
 * Android masks the adaptive foreground to a circle and crops the outer third,
 * so the mark sits inside the middle ~55% with a transparent background.
 */
function adaptiveForeground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <g transform="translate(140.8 140.8) scale(5.2)">${mark("#ffffff")}</g>
  </svg>`;
}

function splash() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <g transform="translate(128 128) scale(5.33)">${mark("#ffffff")}</g>
  </svg>`;
}

const targets = [
  { name: "icon.png", svg: tile({ rounded: false }), size: 1024 },
  { name: "adaptive-icon.png", svg: adaptiveForeground(), size: 1024 },
  { name: "splash-icon.png", svg: splash(), size: 512 },
  { name: "favicon.png", svg: tile({ rounded: true }), size: 96 },
];

await mkdir(outDir, { recursive: true });

for (const target of targets) {
  const png = await sharp(Buffer.from(target.svg))
    .resize(target.size, target.size)
    .png()
    .toBuffer();

  await writeFile(resolve(outDir, target.name), png);
  console.log(`wrote assets/${target.name} (${target.size}px, ${png.length} bytes)`);
}
