import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public', 'icon-1024.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Generate public PNGs
await sharp(svgBuffer).resize(1024, 1024).png().toFile('public/logo.png');
await sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png');

console.log('Public logo PNGs generated successfully.');
