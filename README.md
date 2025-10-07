# 🏥 Oxy - Sistema de Gestão Clínica com IA

**Plataforma SaaS de Automação WhatsApp para Clínicas Médicas e Hospitais**

[![Status](https://img.shields.io/badge/status-production-green)]()
[![Version](https://img.shields.io/badge/version-2.0.2-blue)]()
[![License](https://img.shields.io/badge/license-proprietary-red)]()

## 📱 Dual Platform

Este repositório contém:

### 🌐 **Frontend Web** (Raiz do projeto)
- React + Vite + TypeScript
- Shadcn/UI + Tailwind CSS
- Dashboard completo para gestão clínica
- **Deploy**: [oxy-frontend.onrender.com](https://oxy-frontend.onrender.com)

### 📱 **Mobile App** (`/mobile`)
- React Native + Expo
- App nativo iOS/Android
- Todas as funcionalidades do web em mobile
- **Documentação**: [mobile/README.md](./mobile/README.md)

---

## 🚀 Quick Start

### Frontend Web

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Mobile App

```bash
# Navegar para pasta mobile
cd mobile

# Instalar dependências
npm install

# Iniciar app
npm start

# Escanear QR code com Expo Go
```

**📖 Guia completo**: [mobile/SETUP.md](./mobile/SETUP.md)

---

## 🏗️ Arquitetura

```
oxy/
├── src/                    # Frontend Web (React)
├── backend/                # Backend (Node.js + Express)
├── mobile/                 # App Mobile (React Native)
├── supabase/              # Migrations & SQL
├── public/                # Assets estáticos
└── docs/                  # Documentação
```

### Stack Tecnológica

**Frontend Web:**
- React 18.3 + Vite 5.4
- TypeScript 5.8
- Tailwind CSS 3.4
- Shadcn/UI
- React Query 5.83
- Supabase Client

**Mobile:**
- React Native 0.76
- Expo 52
- TypeScript 5.8
- Expo Router 4.0
- React Query 5.83
- Socket.IO Client

**Backend:**
- Node.js 20+
- Express 4.21
- TypeScript 5.8
- Baileys (WhatsApp)
- BullMQ (Queues)
- OpenAI GPT-4
- Socket.IO

**Infraestrutura:**
- Hosting: Render (Web Service + Workers)
- Database: Supabase PostgreSQL
- Queue/Cache: Upstash Redis
- Monitoring: Render Logs + Pino

---

## 🏥 Funcionalidades Principais

### Para Pacientes (via WhatsApp)
- ✅ Agendamento de consultas médicas
- ✅ Confirmação de presença
- ✅ Consulta de resultados de exames
- ✅ Renovação de receitas
- ✅ Orientações pré-consulta
- ✅ Lembretes automáticos

### Para Gestores Clínicos
- ✅ Dashboard com analytics médicos
- ✅ Gestão de agenda de médicos
- ✅ Prontuário eletrônico
- ✅ Controle de convênios
- ✅ Relatórios gerenciais
- ✅ Automações de campanhas

### IA Dupla Camada
1. **Patient AI** - Atendimento automático a pacientes
2. **Oxy Assistant** - Inteligência de gestão para administradores

---

## 📖 Documentação

- [CLAUDE.md](./CLAUDE.md) - Guia completo para desenvolvimento
- [SETUP.md](./SETUP.md) - Configuração inicial
- [docs/](./docs/) - Documentação técnica detalhada

---

## 🔒 Segurança & Compliance

- ✅ LGPD compliance para dados médicos
- ✅ Criptografia de prontuários
- ✅ Audit logs de todos os acessos
- ✅ RLS (Row Level Security) no banco
- ✅ Autenticação JWT
- ✅ Rate limiting

---

## 📊 Status do Projeto

**Versão Atual**: 2.0.2  
**Status**: Production MVP  
**Última Atualização**: Janeiro 2025

---

## 👥 Equipe

**Desenvolvedor**: Fellipe Saraiva (eu@saraiva.ai)  
**Workspace**: Work Space Pangeia

---

## 📄 Licença

Proprietary - Todos os direitos reservados
