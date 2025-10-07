# 🚀 Configuração do Render - Oxy Backend

## 📝 Persistent Disk Configuration

### Problema Resolvido
O Render Persistent Disk sobrescreve permissões quando montado diretamente em `/app/sessions`.

**Solução:** Montar em `/app/data` e criar subdiretório `/app/data/sessions` via código.

---

## ⚙️ Passos no Render Dashboard

### 1. Acessar Configuração de Discos

1. Acesse: https://dashboard.render.com
2. Selecione: **oxy-backend** (Web Service)
3. Vá em: **Settings** → **Disks**

### 2. Atualizar Mount Path

**IMPORTANTE:** Se já existe um disco configurado:

- **Mount Path Antigo:** `/app/sessions` ❌
- **Mount Path Novo:** `/app/data` ✅
- **Size:** 1GB (mínimo recomendado)

**Como atualizar:**

1. Clique no disco existente
2. Mude **Mount Path** de `/app/sessions` para `/app/data`
3. Salve as alterações
4. Render vai fazer rebuild automático

**Se NÃO existe disco configurado:**

1. Clique em **Add Disk**
2. **Name:** `whatsapp-sessions`
3. **Mount Path:** `/app/data`
4. **Size:** 1GB
5. Clique em **Create**

### 3. Verificar Environment Variables (opcional)

Se quiser sobrescrever o path padrão:

- **Key:** `WHATSAPP_SESSION_PATH`
- **Value:** `/app/data/sessions` (ou outro caminho desejado)

**Nota:** Não é necessário se usar o padrão `/app/data/sessions`.

---

## 🔍 Como Funciona

```
/app/data                    ← Render Persistent Disk (mount point)
└── sessions/                ← Criado pelo código (user node)
    ├── org1_instance1/      ← Sessão WhatsApp 1
    │   ├── creds.json
    │   └── ...
    └── org2_instance2/      ← Sessão WhatsApp 2
        ├── creds.json
        └── ...
```

**Por que funciona?**
- `/app/data` = mount do Render (permissões do Render)
- `/app/data/sessions` = criado pelo app como usuário `node` (sem problemas de permissão)

---

## ✅ Checklist Pós-Deploy

Após atualizar mount path e fazer rebuild:

- [ ] Rebuild do backend completou com sucesso
- [ ] Logs mostram: `"Session path is writable": { "sessionPath": "/app/data/sessions" }`
- [ ] Teste conexão WhatsApp (pairing code ou QR code)
- [ ] Verifique que sessão persiste após restart do serviço

---

## 🐛 Troubleshooting

### Erro: "permission denied mkdir /app/data"

**Causa:** Mount path não foi atualizado no Render Dashboard

**Solução:**
1. Vá em Settings → Disks
2. Confirme que Mount Path = `/app/data` (não `/app/sessions`)
3. Salve e aguarde rebuild

### Logs mostram: "using fallback /tmp/sessions"

**Causa:** `/app/data` não está acessível

**Solução:**
1. Confirme que disco foi criado no Render Dashboard
2. Confirme que Mount Path = `/app/data`
3. Se problema persistir, sessões vão para `/tmp` (funcional mas não persistente)

### Sessions perdidas após restart

**Causa:** Usando `/tmp/sessions` (fallback) que é efêmero

**Solução:** Configure Persistent Disk corretamente conforme instruções acima

---

## 📚 Referências

- [Render Persistent Disks Documentation](https://render.com/docs/disks)
- [Baileys WhatsApp Auth State](https://github.com/WhiskeySockets/Baileys#saving-session-data)
