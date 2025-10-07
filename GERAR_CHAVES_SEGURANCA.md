# 🔐 GERAR CHAVES DE SEGURANÇA

## Oxy v2.0 - Geração de Secrets para Produção

**Data:** 03/10/2025 01:50 BRT

---

## 🎯 OBJETIVO

Gerar chaves criptográficas seguras para uso em produção:
- `JWT_SECRET` - Para autenticação JWT
- `ENCRYPTION_KEY` - Para criptografia de dados sensíveis

---

## 📋 MÉTODO 1: Node.js (Recomendado)

### Gerar JWT_SECRET (64 bytes = 128 caracteres hex)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Exemplo de saída:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8
```

### Gerar ENCRYPTION_KEY (32 bytes = 64 caracteres hex)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de saída:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 📋 MÉTODO 2: OpenSSL

### Gerar JWT_SECRET

```bash
openssl rand -hex 64
```

### Gerar ENCRYPTION_KEY

```bash
openssl rand -hex 32
```

---

## 📋 MÉTODO 3: Python

### Gerar JWT_SECRET

```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

### Gerar ENCRYPTION_KEY

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🔒 BOAS PRÁTICAS

### ✅ O QUE FAZER

1. **Gerar chaves únicas para cada ambiente**
   - Desenvolvimento: chaves diferentes
   - Staging: chaves diferentes
   - Produção: chaves diferentes

2. **Armazenar com segurança**
   - Usar gerenciador de senhas (1Password, LastPass, etc)
   - Nunca commitar no Git
   - Nunca compartilhar por email/chat

3. **Rotacionar periodicamente**
   - JWT_SECRET: a cada 90 dias
   - ENCRYPTION_KEY: a cada 180 dias (requer migração de dados)

4. **Backup seguro**
   - Manter backup criptografado
   - Armazenar em local separado
   - Documentar processo de recuperação

### ❌ O QUE NÃO FAZER

1. ❌ Usar chaves fracas ou previsíveis
2. ❌ Reutilizar chaves entre ambientes
3. ❌ Commitar chaves no Git
4. ❌ Compartilhar chaves por canais inseguros
5. ❌ Usar chaves de exemplo/teste em produção

---

## 📝 TEMPLATE DE CONFIGURAÇÃO

### Para Render.com

**Backend (oxy-backend):**
```bash
# Gerar chaves
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Copiar e colar no Render Dashboard:
# https://dashboard.render.com/web/[SERVICE_ID]/env

# Variável: JWT_SECRET
# Valor: [colar valor gerado acima]

# Variável: ENCRYPTION_KEY
# Valor: [colar valor gerado acima]
```

### Para .env Local (Desenvolvimento)

```bash
# Gerar arquivo .env para desenvolvimento local
cat > backend/.env.local << EOF
# Gerado em: $(date)
# ATENÇÃO: NÃO COMMITAR ESTE ARQUIVO!

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOF

echo "✅ Arquivo backend/.env.local criado!"
echo "⚠️  IMPORTANTE: Adicione .env.local ao .gitignore"
```

---

## 🔄 ROTAÇÃO DE CHAVES

### Quando Rotacionar

**JWT_SECRET:**
- ✅ A cada 90 dias (recomendado)
- ✅ Após suspeita de comprometimento
- ✅ Após saída de funcionário com acesso
- ⚠️ Invalidará todos os tokens JWT ativos

**ENCRYPTION_KEY:**
- ✅ A cada 180 dias (recomendado)
- ✅ Após suspeita de comprometimento
- ⚠️ Requer migração de dados criptografados

### Processo de Rotação JWT_SECRET

```bash
# 1. Gerar nova chave
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Atualizar no Render
# - Ir em Environment Variables
# - Atualizar JWT_SECRET com novo valor
# - Salvar

# 3. Trigger redeploy
# - Clicar em "Manual Deploy"
# - Aguardar conclusão

# 4. Validar
# - Todos os usuários precisarão fazer login novamente
# - Tokens antigos serão invalidados
```

### Processo de Rotação ENCRYPTION_KEY

⚠️ **ATENÇÃO:** Rotação de ENCRYPTION_KEY é complexa e requer migração de dados!

```bash
# 1. Gerar nova chave
NEW_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Adicionar como ENCRYPTION_KEY_NEW no Render
# - Manter ENCRYPTION_KEY antiga
# - Adicionar ENCRYPTION_KEY_NEW

# 3. Deploy código de migração
# - Código deve descriptografar com chave antiga
# - Re-criptografar com chave nova
# - Atualizar registros no banco

# 4. Após migração completa
# - Remover ENCRYPTION_KEY antiga
# - Renomear ENCRYPTION_KEY_NEW para ENCRYPTION_KEY
# - Redeploy
```

---

## 📊 CHECKLIST DE SEGURANÇA

### Antes do Deploy

- [ ] JWT_SECRET gerado com 64 bytes (128 hex)
- [ ] ENCRYPTION_KEY gerado com 32 bytes (64 hex)
- [ ] Chaves armazenadas em gerenciador de senhas
- [ ] Chaves configuradas no Render
- [ ] .env.local adicionado ao .gitignore
- [ ] Nenhuma chave commitada no Git

### Após o Deploy

- [ ] Testar autenticação JWT
- [ ] Testar criptografia de dados
- [ ] Validar que tokens são gerados corretamente
- [ ] Validar que dados sensíveis são criptografados
- [ ] Documentar data de geração das chaves
- [ ] Agendar próxima rotação (90 dias)

---

## 🚨 EM CASO DE COMPROMETIMENTO

### Ação Imediata

1. **Rotacionar TODAS as chaves imediatamente**
2. **Invalidar todos os tokens JWT**
3. **Forçar logout de todos os usuários**
4. **Auditar logs de acesso**
5. **Notificar equipe de segurança**

### Investigação

1. **Identificar origem do comprometimento**
2. **Verificar acessos não autorizados**
3. **Revisar logs de auditoria**
4. **Documentar incidente**
5. **Implementar medidas preventivas**

---

## 📞 SUPORTE

**Documentação:**
- JWT: https://jwt.io/introduction
- Node.js Crypto: https://nodejs.org/api/crypto.html
- OpenSSL: https://www.openssl.org/docs/

**Ferramentas:**
- Gerador JWT: https://jwt.io/
- Validador JWT: https://jwt.io/#debugger

---

**Criado por:** Claude (Augment Agent)  
**Data:** 03/10/2025 01:50 BRT  
**Versão:** 1.0.0

**🔐 MANTENHA SUAS CHAVES SEGURAS! 🔐**

