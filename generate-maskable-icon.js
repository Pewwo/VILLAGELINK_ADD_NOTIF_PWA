import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const inputLogo = path.join(__dirname, 'src/assets/Logo.png'); // your logo file
const outputIcon = path.join(__dirname, 'public/icons/pwa-512x512-maskable.png');

// Sizes
const canvasSize = 512;
const logoSize = 384;
const padding = (canvasSize - logoSize) / 2;

sharp(inputLogo)
  .resize(logoSize, logoSize) // resize logo to 384x384
  .toBuffer()
  .then(data => {
    return sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
      }
    })
      .composite([{ input: data, left: padding, top: padding }])
      .png()
      .toFile(outputIcon);
  })
  .then(() => {
    console.log('Maskable icon generated successfully:', outputIcon);
  })
  .catch(err => {
    console.error('Error generating maskable icon:', err);
  });
