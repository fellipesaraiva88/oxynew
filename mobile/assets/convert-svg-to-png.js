#!/usr/bin/env node

/**
 * Script para converter SVGs em PNGs
 * Execute: node convert-svg-to-png.js
 */

const fs = require('fs');
const path = require('path');

// Configuração dos assets a serem gerados
const assets = [
  { input: 'icon.svg', output: 'icon.png', width: 1024, height: 1024 },
  { input: 'adaptive-icon.svg', output: 'adaptive-icon.png', width: 1024, height: 1024 },
  { input: 'splash.svg', output: 'splash.png', width: 1284, height: 2778 },
  { input: 'favicon.svg', output: 'favicon.png', width: 48, height: 48 },
  { input: 'notification-icon.svg', output: 'notification-icon.png', width: 96, height: 96 },
];

// Verificar se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp não está instalado!');
  console.log('\n📦 Instalando sharp...\n');
  require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

async function convertSVGtoPNG() {
  console.log('🎨 Convertendo SVGs para PNGs...\n');

  for (const asset of assets) {
    const inputPath = path.join(__dirname, asset.input);
    const outputPath = path.join(__dirname, asset.output);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  ${asset.input} não encontrado, pulando...`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(asset.width, asset.height)
        .png()
        .toFile(outputPath);

      console.log(`✅ ${asset.output} criado (${asset.width}x${asset.height})`);
    } catch (error) {
      console.error(`❌ Erro ao converter ${asset.input}:`, error.message);
    }
  }

  console.log('\n🎉 Conversão concluída!');
  console.log('\n📁 Assets PNG gerados:');

  assets.forEach(asset => {
    const outputPath = path.join(__dirname, asset.output);
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`   - ${asset.output} (${(stats.size / 1024).toFixed(2)} KB)`);
    }
  });
}

// Executar conversão
convertSVGtoPNG().catch(error => {
  console.error('❌ Erro durante conversão:', error);
  process.exit(1);
});
