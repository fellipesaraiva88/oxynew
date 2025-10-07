#!/bin/sh
# Garante que o diretório de sessões existe e tem permissões corretas
# Usado no startup do Render para inicializar Persistent Disk

set -e

SESSION_DIR="${WHATSAPP_SESSION_PATH:-/app/data/sessions}"

echo "🔧 Initializing WhatsApp sessions directory: $SESSION_DIR"

# Criar diretório se não existir
mkdir -p "$SESSION_DIR"

# Verificar se temos permissão de escrita
if [ -w "$SESSION_DIR" ]; then
  echo "✅ Sessions directory writable: $SESSION_DIR"
else
  echo "⚠️  Warning: Sessions directory not writable: $SESSION_DIR"
  echo "Attempting to fix permissions..."

  # Tentar corrigir permissões (pode falhar se não for root)
  chmod 755 "$SESSION_DIR" 2>/dev/null || true
fi

# Criar arquivo de teste
TEST_FILE="$SESSION_DIR/.write-test"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
  echo "✅ Write test successful"
  rm -f "$TEST_FILE"
else
  echo "❌ ERROR: Cannot write to sessions directory!"
  exit 1
fi

echo "✅ Sessions directory initialized successfully"
