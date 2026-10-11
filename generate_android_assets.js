import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public', 'icon-1024.svg');
const svgBuffer = fs.readFileSync(svgPath);

const resDir = path.resolve('android', 'app', 'src', 'main', 'res');

const iconDensities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generateIcons() {
  for (const density of iconDensities) {
    const dir = path.join(resDir, density.name);
    fs.mkdirSync(dir, { recursive: true });

    // 1. Regular ic_launcher.png
    await sharp(svgBuffer)
      .resize(density.size, density.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. Round ic_launcher_round.png
    const circleMask = Buffer.from(
      `<svg width="${density.size}" height="${density.size}"><circle cx="${density.size / 2}" cy="${density.size / 2}" r="${density.size / 2}" fill="white" /></svg>`
    );
    await sharp(svgBuffer)
      .resize(density.size, density.size)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. Adaptive Foreground ic_launcher_foreground.png
    // The logo should be ~66% of the foreground size to fit within the adaptive icon safe zone
    const innerSize = Math.round(density.fgSize * 0.66);
    const innerLogo = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    const x = Math.round((density.fgSize - innerSize) / 2);
    const y = Math.round((density.fgSize - innerSize) / 2);

    await sharp({
      create: {
        width: density.fgSize,
        height: density.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerLogo, left: x, top: y }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated ${density.name} icons.`);
  }

  // Update background color in values/ic_launcher_background.xml
  const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1E1B4B</color>
</resources>
`;
  fs.writeFileSync(path.join(resDir, 'values', 'ic_launcher_background.xml'), bgXml, 'utf8');

  // Splash Screens
  const splashConfigs = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const s of splashConfigs) {
    const sDir = path.join(resDir, s.dir);
    fs.mkdirSync(sDir, { recursive: true });

    // Logo size in splash: ~35% of min dimension
    const minDim = Math.min(s.w, s.h);
    const splashLogoSize = Math.max(120, Math.round(minDim * 0.38));
    const splashLogo = await sharp(svgBuffer)
      .resize(splashLogoSize, splashLogoSize)
      .png()
      .toBuffer();

    const left = Math.round((s.w - splashLogoSize) / 2);
    const top = Math.round((s.h - splashLogoSize) / 2);

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 30, g: 27, b: 75, alpha: 1 } // #1E1B4B navy
      }
    })
      .composite([{ input: splashLogo, left, top }])
      .png()
      .toFile(path.join(sDir, 'splash.png'));

    console.log(`Generated splash for ${s.dir}`);
  }

  // Also update iOS AppIcon if ios exists
  const iosIconDir = path.resolve('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  if (fs.existsSync(iosIconDir)) {
    await sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(iosIconDir, 'AppIcon-512@2x.png'));
    console.log('Updated iOS AppIcon-512@2x.png');
  }

  console.log('All icons and splash screens successfully generated!');
}

generateIcons().catch(console.error);
