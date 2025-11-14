#!/usr/bin/env node

/**
 * Servidor MCP Simples para MySQL
 *
 * Este servidor demonstra os conceitos fundamentais do protocolo MCP:
 * - Tools: Para executar queries SQL
 * - Resources: Para acessar schemas e metadados
 * - Prompts: Para templates de consultas comuns
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

// Interface para configuração do MySQL
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
}

// Classe principal do servidor MCP MySQL
class MySQLMCPServer {
  private server: Server;
  private connection: mysql.Connection | null = null;
  private config: MySQLConfig;

  constructor() {
    // Carrega configuração do MySQL
    this.config = this.loadMySQLConfig();
	// Versão correta

    // Inicializa o servidor MCP
    this.server = new Server(
      {
        name: "mysql-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          // Declaramos as capacidades que nosso servidor suporta
          tools: {}, // Suporte a ferramentas/tools
          resources: {}, // Suporte a recursos/resources
          prompts: {}, // Suporte a prompts/templates
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Carrega configuração do MySQL das variáveis de ambiente do MCP
   */
  private loadMySQLConfig(): MySQLConfig {
    try {
      // Sempre usa variáveis de ambiente definidas na configuração do MCP
      const config = {
        host: process.env.MYSQL_HOST || "localhost",
        port: parseInt(process.env.MYSQL_PORT || "3306"),
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS || "",
        database: process.env.MYSQL_DATABASE || process.env.MYSQL_DB,
      };

      // Valida se as configurações essenciais estão presentes
      if (!config.host || !config.user) {
        throw new Error("Configurações MySQL incompletas. Verifique MYSQL_HOST e MYSQL_USER nas variáveis de ambiente do MCP.");
      }

      console.error("✅ Configuração MySQL carregada das variáveis de ambiente do MCP");
      console.error(`🔗 Conectando em: ${config.host}:${config.port} (usuário: ${config.user})`);
      
      return config;
    } catch (error) {
      console.error("❌ Erro ao carregar configuração MySQL:", error);
      throw error;
    }
  }

  // Conecta ao MySQL
  private async connectToMySQL(): Promise<void> {
    try {
      this.connection = await mysql.createConnection(this.config);
      console.error(`✅ Conectado ao MySQL em ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error("❌ Erro ao conectar ao MySQL:", error);
      throw error;
    }
  }

  // Configura os handlers do protocolo MCP
  private setupHandlers(): void {
    // 1. TOOLS - Ferramentas que o LLM pode usar
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "execute_query",
            description: "Executa uma query SQL no banco MySQL",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "A query SQL para executar",
                },
                database: {
                  type: "string",
                  description:
                    "Banco de dados opcional (se não especificado na conexão)",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "describe_table",
            description: "Descreve a estrutura de uma tabela",
            inputSchema: {
              type: "object",
              properties: {
                table_name: {
                  type: "string",
                  description: "Nome da tabela para descrever",
                },
                database: {
                  type: "string",
                  description: "Nome do banco de dados",
                },
              },
              required: ["table_name"],
            },
          },
          {
            name: "list_tables",
            description: "Lista todas as tabelas do banco de dados",
            inputSchema: {
              type: "object",
              properties: {
                database: {
                  type: "string",
                  description: "Nome do banco de dados",
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    // Handler para executar tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Conecta ao MySQL se não estiver conectado
        if (!this.connection) {
          await this.connectToMySQL();
        }

        switch (name) {
          case "execute_query":
            return await this.executeQuery(
              args?.query as string,
              args?.database as string
            );

          case "describe_table":
            return await this.describeTable(
              args?.table_name as string,
              args?.database as string
            );

          case "list_tables":
            return await this.listTables(args?.database as string);

          default:
            throw new Error(`Tool desconhecido: ${name}`);
        }
      } catch (error) {
      console.error(`❌ Erro ao executar tool ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Erro ao executar ${name}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    });

    // 2. RESOURCES - Dados que o LLM pode acessar
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "mysql://databases",
            name: "Lista de Bancos de Dados",
            description: "Lista todos os bancos de dados disponíveis",
            mimeType: "application/json",
          },
          {
            uri: "mysql://tables",
            name: "Lista de Tabelas",
            description: "Lista todas as tabelas do banco atual",
            mimeType: "application/json",
          },
          {
            uri: "mysql://schema",
            name: "Schema do Banco",
            description: "Schema completo do banco de dados atual",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Handler para ler resources
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        try {
          if (!this.connection) {
            await this.connectToMySQL();
          }

          switch (uri) {
            case "mysql://databases":
              return await this.getDatabases();

            case "mysql://tables":
              return await this.getTables();

            case "mysql://schema":
              return await this.getSchema();

            default:
              throw new Error(`Resource não encontrado: ${uri}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao ler resource ${uri}:`, error);
          return {
            contents: [
              {
                uri: uri,
                mimeType: "text/plain",
                text: `Erro ao acessar resource: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    // 3. PROMPTS - Templates pré-definidos
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "analyze_table",
            description: "Analisa uma tabela específica",
            arguments: [
              {
                name: "table_name",
                description: "Nome da tabela para analisar",
                required: true,
              },
            ],
          },
          {
            name: "find_large_tables",
            description: "Encontra tabelas com mais registros",
            arguments: [],
          },
          {
            name: "database_overview",
            description: "Visão geral do banco de dados",
            arguments: [],
          },
        ],
      };
    });

    // Handler para obter prompts
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_table":
          const tableName = args?.table_name as string;
          if (!tableName) {
            throw new Error("table_name é obrigatório");
          }
          return {
            description: `Análise da tabela ${tableName}`,
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Por favor, analise a tabela "${tableName}". 
                  
                  1. Primeiro, descreva a estrutura da tabela
                  2. Mostre alguns dados de exemplo 
                  3. Calcule estatísticas básicas (contagem de registros)
                  4. Identifique possíveis problemas ou oportunidades de otimização`,
                },
              },
            ],
          };

        case "find_large_tables":
          return {
            description: "Encontrar tabelas com mais registros",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Liste todas as tabelas do banco atual e me mostre:
                  
                  1. O número de registros de cada tabela
                  2. Ordene por quantidade de registros (maior para menor)
                  3. Identifique as 5 maiores tabelas
                  4. Sugira estratégias de otimização se necessário`,
                },
              },
            ],
          };

        case "database_overview":
          return {
            description: "Visão geral do banco de dados",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Me dê uma visão geral completa do banco de dados:
                  
                  1. Liste todos os bancos disponíveis
                  2. Para o banco atual, mostre todas as tabelas
                  3. Identifique relacionamentos entre tabelas (foreign keys)
                  4. Sugira melhorias na estrutura se aplicável`,
                },
              },
            ],
          };

        default:
          throw new Error(`Prompt não encontrado: ${name}`);
      }
    });
  }

  // Métodos auxiliares para executar operações MySQL

  /**
   * Executa uma query SQL no banco MySQL.
   * Usa connection.query para todas as queries para evitar problemas com prepared statements.
   */
  private async executeQuery(query: string, database?: string): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      // Muda para o banco específico se fornecido
      if (database) {
        await this.connection.query(`USE \`${database}\``);
      }

      // Usa query simples para todas as operações para evitar problemas com prepared statements
      const [rows, fields] = await this.connection.query(query);

      return {
        content: [
          {
            type: "text",
            text: `Resultado da query:\n\`\`\`sql\n${query}\n\`\`\`\n\nResultados:\n\`\`\`json\n${JSON.stringify(
              rows,
              null,
              2
            )}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao executar query:", error);
      throw error;
    }
  }

  private async describeTable(
    tableName: string,
    database?: string
  ): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      if (database) {
        await this.connection.query(`USE \`${database}\``);
      }

      const [rows] = await this.connection.query(`DESCRIBE \`${tableName}\``);

      return {
        content: [
          {
            type: "text",
            text: `Estrutura da tabela "${tableName}":\n\`\`\`json\n${JSON.stringify(
              rows,
              null,
              2
            )}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao descrever tabela:", error);
      throw error;
    }
  }

  private async listTables(database?: string): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      if (database) {
        await this.connection.query(`USE \`${database}\``);
      }

      const [rows] = await this.connection.query("SHOW TABLES");

      return {
        content: [
          {
            type: "text",
            text: `Lista de tabelas:\n\`\`\`json\n${JSON.stringify(
              rows,
              null,
              2
            )}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao listar tabelas:", error);
      throw error;
    }
  }

  private async getDatabases(): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      const [rows] = await this.connection.query("SHOW DATABASES");

      return {
        contents: [
          {
            uri: "mysql://databases",
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao obter bancos de dados:", error);
      throw error;
    }
  }

  private async getTables(): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      const [rows] = await this.connection.query("SHOW TABLES");

      return {
        contents: [
          {
            uri: "mysql://tables",
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao obter tabelas:", error);
      throw error;
    }
  }

  private async getSchema(): Promise<any> {
    if (!this.connection) {
      throw new Error("Não conectado ao MySQL");
    }

    try {
      // Obtém informações do schema
      const [tables] = await this.connection.query("SHOW TABLES");
      const schema: any = { tables: [] };

      for (const table of tables as any[]) {
        const tableName = Object.values(table)[0] as string;
        const [columns] = await this.connection.query(
          `DESCRIBE \`${tableName}\``
        );
        schema.tables.push({
          name: tableName,
          columns: columns,
        });
      }

      return {
        contents: [
          {
            uri: "mysql://schema",
            mimeType: "application/json",
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("❌ Erro ao obter schema:", error);
      throw error;
    }
  }

  // Inicia o servidor
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("🚀 Servidor MCP MySQL iniciado! Aguardando conexões...");
    } catch (error) {
      console.error("❌ Erro ao iniciar servidor MCP:", error);
      throw error;
    }
  }

  // Fecha conexões
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.error("🔌 Conexão MySQL fechada");
    }
  }
}

// Função principal para iniciar o servidor
async function main() {
  const server = new MySQLMCPServer();
  
  // Manipula sinais do sistema para fechamento gracioso
  process.on('SIGINT', async () => {
    console.error('\n🛑 Recebido SIGINT, fechando servidor...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n🛑 Recebido SIGTERM, fechando servidor...');
    await server.close();
    process.exit(0);
  });

  try {
    await server.run();
  } catch (error) {
    console.error("❌ Falha ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Inicia o servidor
main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});

export { MySQLMCPServer };
