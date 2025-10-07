#!/usr/bin/env node

/**
 * Script para gerar assets placeholder para desenvolvimento
 * Execute: node generate-placeholders.js
 *
 * Requer: sharp (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// SVG template para ícone
const iconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#8B5CF6" rx="${size * 0.2}"/>
  <text
    x="50%"
    y="50%"
    font-size="${size * 0.5}"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="white"
  >🏥</text>
</svg>
`;

// SVG template para splash
const splashSVG = (width, height) => `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  <text
    x="50%"
    y="45%"
    font-size="120"
    text-anchor="middle"
    dominant-baseline="middle"
  >🏥</text>
  <text
    x="50%"
    y="55%"
    font-size="60"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#8B5CF6"
    font-family="Arial, sans-serif"
    font-weight="bold"
  >Oxy</text>
</svg>
`;

// Criar SVGs
const assets = {
  'icon.svg': iconSVG(1024),
  'adaptive-icon.svg': iconSVG(1024),
  'splash.svg': splashSVG(1284, 2778),
  'favicon.svg': iconSVG(48),
  'notification-icon.svg': iconSVG(96),
};

// Salvar SVGs
Object.entries(assets).forEach(([filename, content]) => {
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, content.trim());
  console.log(`✅ Created ${filename}`);
});

console.log('\n📝 SVG placeholders created!');
console.log('\n🔄 Para converter para PNG, instale sharp:');
console.log('   npm install sharp');
console.log('\n   Depois execute:');
console.log('   npx @expo/cli prebuild --clean');
console.log('\n   Ou converta manualmente cada SVG para PNG online:');
console.log('   https://svgtopng.com/');
