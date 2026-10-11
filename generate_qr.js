import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/HP/.gemini/antigravity/brain/ad32bcdb-5bbd-42a6-8e0a-b6225db26977';
const publicDir = 'C:/Users/HP/.gemini/antigravity/scratch/legerly-an-accounting-app/public';

if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function gen(url, name, label) {
  const pngBrain = path.join(brainDir, name + '.png');
  const svgBrain = path.join(brainDir, name + '.svg');
  const pngPub = path.join(publicDir, name + '.png');
  const svgPub = path.join(publicDir, name + '.svg');

  const optsPng = { width: 450, margin: 2, color: { dark: '#111827', light: '#FFFFFF' } };
  const optsSvg = { margin: 2, color: { dark: '#111827', light: '#FFFFFF' } };

  await QRCode.toFile(pngBrain, url, optsPng);
  await QRCode.toFile(svgBrain, url, optsSvg);
  await QRCode.toFile(pngPub, url, optsPng);
  await QRCode.toFile(svgPub, url, optsSvg);

  const dataUri = await QRCode.toDataURL(url, optsPng);
  console.log(`Generated ${label}: ${url}`);
  return { name, url, label, dataUri };
}

async function run() {
  const expo = await gen('exp://192.168.1.38:8081', 'expo_go_qr', 'Tenant Expo Go Deep-Link');
  const prod = await gen('https://legerly-an-accounting-app.vercel.app', 'mobile_app_prod_qr', 'Live Production Cloud App');
  const wifi = await gen('http://192.168.1.38:5173', 'mobile_wifi_dev_qr', 'Local Wi-Fi Dev Server');

  fs.writeFileSync(path.join(brainDir, 'qr_data.json'), JSON.stringify({ expo, prod, wifi }, null, 2));
  console.log('All QR codes generated successfully!');
}

run().catch(console.error);
