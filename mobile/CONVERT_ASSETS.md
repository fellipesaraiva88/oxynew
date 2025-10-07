# 🎨 Guia de Conversão de Assets

Os assets SVG foram gerados na pasta `mobile/assets/`. Agora você precisa convertê-los para PNG.

## 🚀 Opção 1: Conversão Online (Mais Fácil)

### Passo a Passo:

1. Acesse: https://svgtopng.com/ ou https://cloudconvert.com/svg-to-png

2. Faça upload dos SVGs e converta nas seguintes dimensões:

   - **icon.svg** → **icon.png** (1024x1024px)
   - **adaptive-icon.svg** → **adaptive-icon.png** (1024x1024px)
   - **splash.svg** → **splash.png** (1284x2778px)
   - **favicon.svg** → **favicon.png** (48x48px)
   - **notification-icon.svg** → **notification-icon.png** (96x96px)

3. Baixe os PNGs e salve na pasta `mobile/assets/`

4. Delete os SVGs (opcional)

---

## 🔧 Opção 2: Conversão Local com ImageMagick

Se tiver ImageMagick instalado:

```bash
cd mobile/assets

# Converter todos de uma vez
for file in *.svg; do
  convert "$file" "${file%.svg}.png"
done
```

### Instalar ImageMagick:

**macOS:**
```bash
brew install imagemagick
```

**Linux:**
```bash
sudo apt-get install imagemagick
```

**Windows:**
Baixe de: https://imagemagick.org/script/download.php

---

## 🎯 Opção 3: Conversão com Node.js

Se preferir automatizar com Node.js:

```bash
cd mobile/assets

# Instalar dependência
npm install -g svg2png-cli

# Converter
svg2png icon.svg --output icon.png --width 1024 --height 1024
svg2png adaptive-icon.svg --output adaptive-icon.png --width 1024 --height 1024
svg2png splash.svg --output splash.png --width 1284 --height 2778
svg2png favicon.svg --output favicon.png --width 48 --height 48
svg2png notification-icon.svg --output notification-icon.png --width 96 --height 96
```

---

## ✅ Verificar Assets

Após conversão, verifique se todos os PNGs foram criados:

```bash
cd mobile/assets
ls -la

# Deve mostrar:
# icon.png
# adaptive-icon.png
# splash.png
# favicon.png
# notification-icon.png
```

---

## 🎨 Melhorar Design (Opcional)

Os assets gerados são placeholders simples. Para um design profissional:

### 1. Use Figma/Canva

- Crie designs personalizados
- Exporte nas dimensões corretas
- Substitua os PNGs na pasta `assets/`

### 2. Contratar Designer

- Forneça as especificações da pasta `assets/README.md`
- Peça assets nas dimensões corretas
- Use as cores do Oxy (#8B5CF6)

### 3. Ferramentas Online

- [Canva](https://canva.com) - Templates gratuitos
- [Icon Kitchen](https://icon.kitchen/) - Gerador de ícones Android
- [App Icon Generator](https://appicon.co/) - Gerador completo

---

## 🚀 Testar Assets no App

Após converter:

```bash
cd mobile
npm start
```

Os assets serão carregados automaticamente!

---

## ⚠️ Importante

- **NÃO commite** os SVGs no git (apenas os PNGs finais)
- Mantenha cópias dos arquivos originais em outro lugar
- Para produção, use assets de alta qualidade

---

## 📝 Checklist Final

- [ ] icon.png existe (1024x1024px)
- [ ] adaptive-icon.png existe (1024x1024px)
- [ ] splash.png existe (1284x2778px)
- [ ] favicon.png existe (48x48px)
- [ ] notification-icon.png existe (96x96px)
- [ ] Todos os PNGs têm boa qualidade
- [ ] Assets seguem identidade visual do Oxy
- [ ] App inicia sem erros de assets

---

**Pronto!** Após converter, você pode testar o app com `npm start` 🎉
