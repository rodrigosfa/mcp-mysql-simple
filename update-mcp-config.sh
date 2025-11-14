#!/bin/bash

# Script para atualizar a configuração do MCP MySQL Simple
# Este script modifica o arquivo ~/.cursor/mcp.json para usar o script wrapper

MCP_CONFIG_FILE="$HOME/.cursor/mcp.json"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$PROJECT_DIR/start-mcp.sh"

echo "🔧 Atualizando configuração do MCP MySQL Simple..."

# Verifica se o arquivo de configuração existe
if [ ! -f "$MCP_CONFIG_FILE" ]; then
    echo "❌ Arquivo de configuração MCP não encontrado: $MCP_CONFIG_FILE"
    exit 1
fi

# Verifica se o script wrapper existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script wrapper não encontrado: $SCRIPT_PATH"
    exit 1
fi

# Faz backup do arquivo original
cp "$MCP_CONFIG_FILE" "$MCP_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup criado: $MCP_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Atualiza a configuração usando sed
sed -i "s|\"command\": \"node\"|\"command\": \"$SCRIPT_PATH\"|g" "$MCP_CONFIG_FILE"
sed -i "s|\"args\": \[\"$PROJECT_DIR/dist/index.js\"\]|\"args\": \[\]|g" "$MCP_CONFIG_FILE"

echo "✅ Configuração atualizada com sucesso!"
echo ""
echo "📋 Resumo das alterações:"
echo "   - Command alterado de 'node' para '$SCRIPT_PATH'"
echo "   - Args alterado de '[\"$PROJECT_DIR/dist/index.js\"]' para '[]'"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Reinicie o Cursor"
echo "   2. Verifique se o MCP mysql-simple está habilitado"
echo "   3. Teste as ferramentas disponíveis"
echo ""
echo "📖 Para mais detalhes, consulte o arquivo CONFIGURACAO-MCP.md" 