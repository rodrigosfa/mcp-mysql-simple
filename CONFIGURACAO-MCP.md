# Configuração do MCP MySQL Simple

## Problema Resolvido ✅

O problema era que o Node.js instalado no sistema (versão 12.22.9) não suportava os recursos modernos do JavaScript usados no código (como o operador `??`).

## Solução Implementada

1. **Instalado NVM (Node Version Manager)** para gerenciar versões do Node.js
2. **Instalado Node.js 20.19.4** via NVM
3. **Criado script wrapper** `start-mcp.sh` que carrega o NVM e executa o servidor

## Como Atualizar a Configuração do MCP

Você precisa atualizar o arquivo de configuração do MCP em `~/.cursor/mcp.json` para usar o script wrapper em vez do Node.js diretamente.

### Configuração Atual (PROBLEMÁTICA):
```json
"mysql-simple": {
  "command": "node",
  "args": ["/home/rodrigosfa/Projetos/Cogna/mcp-mysql-simple/dist/index.js"],
  "env": {
    "MYSQL_HOST": "mysql-admin-prd.voompcreators.net",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "rodrigo_silveira",
    "MYSQL_PASS": "GO4PC@diGr5N",
    "MYSQL_DB": "voompcreators_back_prd"
  }
}
```

### Configuração Corrigida (FUNCIONAL):
```json
"mysql-simple": {
  "command": "/home/rodrigosfa/Projetos/Cogna/mcp-mysql-simple/start-mcp.sh",
  "args": [],
  "env": {
    "MYSQL_HOST": "mysql-admin-prd.voompcreators.net",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "rodrigo_silveira",
    "MYSQL_PASS": "GO4PC@diGr5N",
    "MYSQL_DB": "voompcreators_back_prd"
  }
}
```

## Passos para Aplicar a Correção

1. Abra o arquivo `~/.cursor/mcp.json`
2. Localize a seção `"mysql-simple"`
3. Substitua a linha `"command": "node"` por `"command": "/home/rodrigosfa/Projetos/Cogna/mcp-mysql-simple/start-mcp.sh"`
4. Substitua a linha `"args": ["/home/rodrigosfa/Projetos/Cogna/mcp-mysql-simple/dist/index.js"]` por `"args": []`
5. Salve o arquivo
6. Reinicie o Cursor

## Verificação

Após aplicar a correção, o MCP mysql-simple deve aparecer como habilitado no Cursor, mostrando as ferramentas disponíveis em vez de "0 tools enabled".

## Ferramentas Disponíveis

O servidor MCP oferece as seguintes ferramentas:
- `execute_query`: Executa queries SQL
- `describe_table`: Descreve estrutura de tabelas
- `list_tables`: Lista todas as tabelas do banco

## Troubleshooting

Se ainda houver problemas:
1. Verifique se o script `start-mcp.sh` tem permissão de execução: `chmod +x start-mcp.sh`
2. Teste o script manualmente: `./start-mcp.sh`
3. Verifique se o NVM está instalado: `nvm --version`
4. Verifique se o Node.js 20 está disponível: `nvm list` 