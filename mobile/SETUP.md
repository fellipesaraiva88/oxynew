# Guia de Configuração - Oxy Mobile

Este guia irá te ajudar a configurar e executar o app mobile Oxy pela primeira vez.

## 📋 Pré-requisitos

### Requisitos Obrigatórios

1. **Node.js 20+**
   ```bash
   node --version  # Deve ser >= 20.0.0
   ```

2. **npm ou yarn**
   ```bash
   npm --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   expo --version
   ```

### Para Testar no Dispositivo

- **Expo Go App**
  - [iOS](https://apps.apple.com/app/expo-go/id982107779)
  - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Para Testar em Simulador/Emulador

**iOS (macOS apenas):**
- Xcode instalado
- iOS Simulator configurado

**Android:**
- Android Studio instalado
- Android Emulator configurado

## 🚀 Instalação

### 1. Clonar o Repositório

Se ainda não clonou:

```bash
git clone https://github.com/fellipesaraiva88/autonomous-paw-actuator.git
cd autonomous-paw-actuator/mobile
```

Se já tem o repositório:

```bash
cd autonomous-paw-actuator/mobile
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências listadas no `package.json`, incluindo:
- React Native
- Expo
- React Query
- Supabase
- Socket.IO
- E outras...

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `mobile/`:

```bash
cp .env.example .env
```

O arquivo `.env` já vem pré-configurado com as variáveis de produção:

```env
EXPO_PUBLIC_API_URL=https://oxy-backend-8xyx.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**⚠️ Importante**: Nunca commite o arquivo `.env` no git!

## 🏃 Executando o App

### Opção 1: Expo Go (Recomendado para início)

1. **Iniciar o servidor de desenvolvimento:**

```bash
npm start
```

2. **Conectar seu dispositivo:**

   - Instale o **Expo Go** no seu celular
   - Escaneie o QR code que aparece no terminal/navegador
   - Aguarde o app carregar

### Opção 2: iOS Simulator (macOS)

```bash
npm run ios
```

Ou, após `npm start`, pressione `i` no terminal.

### Opção 3: Android Emulator

```bash
npm run android
```

Ou, após `npm start`, pressione `a` no terminal.

### Opção 4: Navegador Web (desenvolvimento)

```bash
npm run web
```

Ou, após `npm start`, pressione `w` no terminal.

## 🔐 Testando Autenticação

### Criar Conta de Teste

1. Abra o app
2. Clique em "Cadastre-se"
3. Preencha:
   - Nome: Seu nome
   - Email: teste@oxy.com
   - Senha: teste123
4. Clique em "Criar conta"
5. Verifique o email (se configurado) ou faça login diretamente

### Usuário de Demonstração

Se houver um usuário demo configurado no backend:

```
Email: demo@oxy.com
Senha: demo123
```

## 🐛 Solução de Problemas

### Erro: "Module not found"

```bash
# Limpar cache e reinstalar
rm -rf node_modules
npm install
npx expo start -c
```

### Erro: "Network request failed"

Verifique se:
1. O backend está rodando: https://oxy-backend-8xyx.onrender.com/health
2. As variáveis de ambiente estão corretas
3. Seu dispositivo está na mesma rede (se testando localmente)

### Expo Go não conecta

1. Certifique-se de estar na mesma rede Wi-Fi
2. Desative VPN
3. Tente modo tunnel:
   ```bash
   npx expo start --tunnel
   ```

### Build iOS falha

```bash
# Limpar cache do iOS
cd ios
pod cache clean --all
pod deintegrate
pod install
cd ..
```

### Build Android falha

```bash
# Limpar cache do Android
cd android
./gradlew clean
cd ..
```

## 📱 Recursos do App

### Telas Implementadas

- ✅ Login/Registro
- ✅ Dashboard com estatísticas
- ✅ Lista de clientes
- ✅ Conversas WhatsApp
- ✅ Chat com Aurora (IA)
- ✅ Configurações

### Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Integração com API backend
- ✅ WebSocket para tempo real
- ✅ Notificações push
- ✅ Pull-to-refresh
- ✅ Navegação com tabs

## 🔄 Atualizando o App

### Atualizar Dependências

```bash
npm update
```

### Atualizar Expo SDK

```bash
npx expo install --fix
```

## 🏗️ Build de Produção

### Configurar EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build iOS

```bash
eas build --platform ios --profile production
```

### Build Android

```bash
eas build --platform android --profile production
```

### Instalar Build no Dispositivo

Após o build, você receberá um link para download.

**iOS:**
- Download do arquivo `.ipa`
- Instale via TestFlight ou ferramentas de desenvolvimento

**Android:**
- Download do arquivo `.apk` ou `.aab`
- Instale diretamente no dispositivo (`.apk`)
- Publique no Google Play (`.aab`)

## 🧪 Desenvolvimento

### Hot Reload

O app recarrega automaticamente ao salvar arquivos.

Para forçar reload:
- Pressione `r` no terminal
- Ou sacuda o dispositivo e selecione "Reload"

### Debug

**React Native Debugger:**
```bash
npm install -g react-native-debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

**Console Logs:**
- Pressione `d` no terminal para abrir DevTools
- Ou sacuda o dispositivo → "Debug JS Remotely"

### Verificar Tipos

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## 📚 Recursos Úteis

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/)
- [React Query](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a seção "Solução de Problemas" acima
2. Procure no GitHub Issues
3. Entre em contato: eu@saraiva.ai

---

**Bom desenvolvimento! 🚀**
