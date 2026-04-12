const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient (blue to purple)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#9333ea');
  
  // Rounded rect background
  const r = size * 0.25; // 128/512 ratio
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Chart line
  const s = size / 512; // scale factor
  ctx.beginPath();
  ctx.moveTo(130 * s, 350 * s);
  ctx.lineTo(220 * s, 250 * s);
  ctx.lineTo(280 * s, 290 * s);
  ctx.lineTo(370 * s, 170 * s);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 44 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  // Arrow tip
  ctx.beginPath();
  ctx.moveTo(290 * s, 170 * s);
  ctx.lineTo(370 * s, 170 * s);
  ctx.lineTo(370 * s, 250 * s);
  ctx.stroke();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

generateIcon(192, './public/icons/icon-192.png');
generateIcon(512, './public/icons/icon-512.png');
