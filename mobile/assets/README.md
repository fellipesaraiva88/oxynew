# Assets do Oxy Mobile

Esta pasta contém todos os assets (ícones, splash screens, etc.) do app mobile.

## 🎨 Assets Necessários

### Ícones

1. **icon.png** (1024x1024px)
   - Ícone principal do app
   - Usado para iOS App Store e exportação
   - Formato: PNG com transparência
   - Design: Logo Oxy (🏥) com fundo roxo (#8B5CF6)

2. **adaptive-icon.png** (1024x1024px)
   - Ícone adaptativo para Android
   - Área segura: círculo central de 66% (688px)
   - Formato: PNG com transparência

3. **favicon.png** (48x48px ou maior)
   - Ícone para versão web
   - Formato: PNG

### Splash Screens

4. **splash.png** (1284x2778px - iPhone 13 Pro Max)
   - Tela de abertura do app
   - Recomendado: Logo centralizado em fundo branco
   - Formato: PNG

### Notificações

5. **notification-icon.png** (96x96px)
   - Ícone para notificações push
   - Android: monocromático, fundo transparente
   - iOS: colorido com transparência

### Sons (Opcional)

6. **notification-sound.wav**
   - Som de notificação customizado
   - Formato: WAV ou MP3
   - Duração: 1-2 segundos

---

## 🚀 Geração Automática de Assets

### Opção 1: Usando Figma/Design

Se você tem o design no Figma:

1. Exporte cada asset nas dimensões especificadas
2. Salve nesta pasta (`mobile/assets/`)
3. Execute `npx expo start` para validar

### Opção 2: Gerando Programaticamente

Use a ferramenta `expo-splash-screen` para gerar assets:

```bash
cd mobile

# Gerar splash screen a partir de uma imagem
npx expo install expo-splash-screen
npx expo-splash-screen --image-path ./assets/splash-source.png
```

### Opção 3: Assets Temporários (Para Desenvolvimento)

Para desenvolvimento, você pode usar assets temporários:

```bash
# Criar ícone temporário (quadrado roxo com emoji)
cd mobile/assets

# No macOS, você pode usar sips para criar placeholders:
# (ou use qualquer editor de imagem)
```

---

## 📝 Checklist de Assets

Antes de fazer build de produção, verifique:

- [ ] icon.png existe e tem 1024x1024px
- [ ] adaptive-icon.png existe e tem 1024x1024px
- [ ] splash.png existe e tem pelo menos 1284x2778px
- [ ] favicon.png existe
- [ ] notification-icon.png existe
- [ ] Todos os assets seguem as diretrizes de design do Oxy
- [ ] Cores consistentes (#8B5CF6 roxo principal)
- [ ] Logo/emoji de pata (🏥) presente

---

## 🎨 Diretrizes de Design

### Cores

- **Primary**: #8B5CF6 (Roxo)
- **Secondary**: #6366F1 (Azul)
- **White**: #FFFFFF
- **Background**: #F9FAFB

### Logo

- Emoji de pata: 🏥
- Texto "Oxy" em fonte bold
- Roxo vibrante como cor principal

### Estilo

- Moderno e minimalista
- Cantos arredondados
- Sombras suaves
- Ícones outline ou preenchidos consistentemente

---

## 📂 Estrutura Esperada

```
mobile/assets/
├── icon.png              (Obrigatório)
├── adaptive-icon.png     (Obrigatório Android)
├── splash.png            (Obrigatório)
├── favicon.png           (Opcional)
├── notification-icon.png (Recomendado)
└── notification-sound.wav (Opcional)
```

---

## 🔗 Recursos Úteis

- [Expo Icon/Splash Generator](https://docs.expo.dev/guides/app-icons/)
- [Figma](https://figma.com) - Para criar assets
- [Canva](https://canva.com) - Para criar rapidamente
- [Icon Kitchen](https://icon.kitchen/) - Gerar ícones Android

---

**Nota**: Por enquanto, você pode usar placeholders. O importante é ter arquivos com os nomes corretos para o app compilar.
