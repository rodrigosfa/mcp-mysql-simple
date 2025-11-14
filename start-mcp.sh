#!/bin/bash

# Script wrapper para iniciar o servidor MCP MySQL
# Executa o servidor com Node.js disponível no sistema

# Executa o servidor MCP
exec node "$(dirname "$0")/dist/index.js" 