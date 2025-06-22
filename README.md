# Servidor MCP MySQL Simples

Este é um servidor MCP (Model Context Protocol) simples para MySQL, criado do zero para demonstrar os conceitos fundamentais do protocolo MCP da Anthropic.

## 🎯 Objetivo

Este projeto foi criado para entender como funciona o protocolo MCP implementando um servidor básico mas funcional que conecta LLMs ao MySQL.

## 📋 Conceitos MCP Implementados

### 1. **Tools (Ferramentas)**

Funções que o LLM pode executar:

- `execute_query`: Executa queries SQL no banco
- `describe_table`: Descreve a estrutura de uma tabela

### 2. **Resources (Recursos)**

Dados que o LLM pode acessar:

- `mysql://databases`: Lista todos os bancos de dados
- `mysql://tables`: Lista todas as tabelas do banco atual
- `mysql://schema`: Schema completo do banco

### 3. **Prompts (Templates)**

Templates pré-definidos para o usuário:

- `analyze_table`: Analisa uma tabela específica
- `find_large_tables`: Encontra tabelas com mais registros
- `database_overview`: Visão geral do banco de dados

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar MySQL

Com base na sua configuração, defina as variáveis de ambiente:

```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3307
export MYSQL_USER=root
export MYSQL_PASS=root
export MYSQL_DB=voompcreators_back
```

### 3. Compilar o Projeto

```bash
npm run build
```

### 4. Executar o Servidor

```bash
npm start
```

### 5. Para Desenvolvimento

```bash
npm run dev
```

## 🔧 Configuração do Cliente MCP

Para usar este servidor com Claude Desktop, adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mysql-voompcreators": {
      "command": "node",
      "args": ["/home/fabio/mcp-server-fabio/dist/index.js"],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3307",
        "MYSQL_USER": "root",
        "MYSQL_PASS": "root",
        "MYSQL_DB": "voompcreators_back"
      }
    }
  }
}
```

> **Nota**: O arquivo `claude_desktop_config.json` já está pronto no arquivo `config-example.json`. Você pode copiar o conteúdo para o local correto do Claude Desktop.

## 🏗️ Arquitetura do Código

### Estrutura Principal

```typescript
class MySQLMCPServer {
  private server: Server;           // Servidor MCP
  private connection: Connection;   // Conexão MySQL
  private config: MySQLConfig;      // Configuração

  constructor() {
    // Inicializa servidor com capacidades
    this.server = new Server({...}, {
      capabilities: {
        tools: {},      // Suporte a ferramentas
        resources: {},  // Suporte a recursos
        prompts: {}     // Suporte a prompts
      }
    });
  }
}
```

### Ciclo de Vida MCP

1. **Inicialização**: Cliente conecta e negocia capacidades
2. **Operação**: Cliente faz requests, servidor responde
3. **Shutdown**: Conexão é encerrada graciosamente

### Handlers Implementados

```typescript
// Lista ferramentas disponíveis
ListToolsRequestSchema -> tools[]

// Executa ferramenta específica
CallToolRequestSchema -> resultado

// Lista recursos disponíveis
ListResourcesRequestSchema -> resources[]

// Lê recurso específico
ReadResourceRequestSchema -> dados

// Lista prompts disponíveis
ListPromptsRequestSchema -> prompts[]

// Obtém prompt específico
GetPromptRequestSchema -> template
```

## 🔍 Exemplos de Uso

### 1. Executar Query SQL

O LLM pode executar:

```sql
SELECT * FROM usuarios LIMIT 5;
```

### 2. Descrever Tabela

```sql
DESCRIBE produtos;
```

### 3. Acessar Resources

- Listar bancos: `mysql://databases`
- Listar tabelas: `mysql://tables`
- Ver schema: `mysql://schema`

### 4. Usar Prompts

- Analisar tabela: `analyze_table(table_name="usuarios")`
- Encontrar tabelas grandes: `find_large_tables`
- Visão geral: `database_overview`

## 📡 Protocolo MCP em Ação

### 1. Mensagens JSON-RPC 2.0

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "execute_query",
    "arguments": {
      "query": "SELECT COUNT(*) FROM usuarios"
    }
  },
  "id": 1
}
```

### 2. Transporte STDIO

O servidor usa `StdioServerTransport` para comunicação via stdin/stdout.

### 3. Capacidades Negociadas

```json
{
  "capabilities": {
    "tools": {},
    "resources": {},
    "prompts": {}
  }
}
```

## 🛡️ Segurança

### Práticas Implementadas:

- ✅ Escape de nomes de tabelas/bancos com backticks
- ✅ Tratamento de erros
- ✅ Validação de parâmetros
- ✅ Conexão controlada ao MySQL

### Melhorias Futuras:

- 🔒 Validação de queries SQL (whitelist)
- 🔒 Rate limiting
- 🔒 Autenticação/autorização
- 🔒 Logs de auditoria

## 🧪 Testando o Servidor

### 1. Teste Básico

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npm start
```

### 2. Teste com MySQL

Certifique-se de ter um MySQL rodando e configurado.

## 📚 Aprendizados sobre MCP

### Conceitos-Chave:

1. **Servidor MCP**: Expõe capacidades via protocolo padronizado
2. **Cliente MCP**: Consome capacidades (Ex: Claude Desktop)
3. **Host**: Aplicação que hospeda o cliente (Ex: Claude)
4. **JSON-RPC 2.0**: Protocolo de comunicação base
5. **Capabilities**: Negociação de recursos disponíveis

### Vantagens do MCP:

- 🔌 **Interoperabilidade**: Um servidor, múltiplos clientes
- 🧩 **Modularidade**: Cada servidor tem responsabilidade específica
- 🔒 **Segurança**: Isolamento entre servidores
- 📈 **Escalabilidade**: Fácil adicionar novas capacidades

## 🚧 Próximos Passos

Para expandir este servidor:

1. **Adicionar mais Tools**:

   - `create_table`
   - `backup_database`
   - `optimize_table`

2. **Melhorar Resources**:

   - Índices das tabelas
   - Estatísticas de performance
   - Logs de queries

3. **Expandir Prompts**:

   - Templates para relatórios
   - Queries de otimização
   - Análises de performance

4. **Implementar Sampling**:
   - Permitir que o servidor faça requests para o LLM

## 📖 Referências

- [Documentação MCP Oficial](https://spec.modelcontextprotocol.io/)
- [SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Exemplos da Anthropic](https://github.com/modelcontextprotocol/servers)

---

**Criado com ❤️ para aprender o protocolo MCP da Anthropic**
