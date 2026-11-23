import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import toIco from 'to-ico';
const repoRoot = process.cwd();
const inputPath = path.join(repoRoot, 'src', 'assets', 'logo 2.PNG');
const outDir = path.join(repoRoot, 'public');
const renderLogo = async (size, padding = 0) => sharp(inputPath, { failOn: 'none' })
  .resize(Math.round(size * (1 - padding * 2)), Math.round(size * (1 - padding * 2)), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
const renderFlagIcon = async (size) => {
  const flag = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#ce1126"/><path fill="#fff" d="M0 33h100v34H0z"/><path fill="#000" d="M0 67h100v33H0z"/></svg>');
  const logo = await renderLogo(size, 0.12);
  return sharp(flag).composite([{ input: logo, gravity: 'centre' }]).png({ compressionLevel: 9 }).toBuffer();
};
const main = async () => {
  await fs.mkdir(outDir, { recursive: true });
  const sizes = [16, 32, 180, 192];
  const icons = await Promise.all(sizes.map(renderFlagIcon));
  await Promise.all([
    fs.writeFile(path.join(outDir, 'favicon-16x16.png'), icons[0]),
    fs.writeFile(path.join(outDir, 'favicon-32x32.png'), icons[1]),
    fs.writeFile(path.join(outDir, 'apple-touch-icon.png'), icons[2]),
    fs.writeFile(path.join(outDir, 'android-chrome-192x192.png'), icons[3]),
    fs.writeFile(path.join(outDir, 'km-olad-masr-logo.png'), await renderLogo(512)),
    fs.writeFile(path.join(outDir, 'ad-card-logo.png'), await renderLogo(512)),
  ]);
  await fs.writeFile(path.join(outDir, 'favicon.ico'), await toIco([icons[0], icons[1]]));
};
main().catch((error) => { console.error(error); process.exitCode = 1; });
