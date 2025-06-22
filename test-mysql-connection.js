#!/usr/bin/env node

/**
 * Script para testar conexão direta com MySQL
 * Este script verifica se conseguimos conectar ao seu banco MySQL
 */

import mysql from "mysql2/promise";
import { config } from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env
config();

// Configurações do banco a partir das variáveis de ambiente
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS || "",
  database: process.env.MYSQL_DATABASE || process.env.MYSQL_DB,
};

async function testMySQLConnection() {
  console.log("🔍 Testando conexão com MySQL...");
  console.log(`📡 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 Usuário: ${dbConfig.user}`);
  console.log(`🗃️ Banco: ${dbConfig.database}\n`);

  let connection = null;

  try {
    // Tentar conectar
    console.log("🔗 Conectando...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conexão estabelecida com sucesso!\n");

    // Testar queries básicas
    console.log("📊 Executando testes básicos...\n");

    // 1. Listar bancos de dados
    console.log("1️⃣ Listando bancos de dados...");
    const [databases] = await connection.execute("SHOW DATABASES");
    console.log(
      `   Encontrados ${databases.length} bancos:`,
      databases.map((db) => Object.values(db)[0]).join(", ")
    );

    // 2. Listar tabelas do banco atual
    console.log("\n2️⃣ Listando tabelas do banco atual...");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(
      `   Encontradas ${tables.length} tabelas:`,
      tables.map((t) => Object.values(t)[0]).join(", ")
    );

    // 3. Versão do MySQL
    console.log("\n3️⃣ Versão do MySQL...");
    const [version] = await connection.execute("SELECT VERSION() as version");
    console.log(`   Versão: ${version[0].version}`);

    // 4. Informações do banco atual
    console.log("\n4️⃣ Informações do banco atual...");
    const [currentDb] = await connection.execute(
      "SELECT DATABASE() as current_db"
    );
    console.log(`   Banco atual: ${currentDb[0].current_db}`);

    // Se houver tabelas, vamos examinar algumas
    if (tables.length > 0) {
      console.log("\n5️⃣ Examinando estrutura de algumas tabelas...");

      // Pegar até 3 tabelas para examinar
      const tablesToExamine = tables.slice(0, 3);

      for (const table of tablesToExamine) {
        const tableName = Object.values(table)[0];
        console.log(`\n   📋 Estrutura da tabela "${tableName}":`);

        try {
          const [columns] = await connection.execute(
            `DESCRIBE \`${tableName}\``
          );
          columns.forEach((col, index) => {
            console.log(
              `      ${index + 1}. ${col.Field} (${col.Type}) ${
                col.Null === "NO" ? "NOT NULL" : "NULL"
              } ${col.Key ? col.Key : ""}`
            );
          });

          // Contar registros
          const [count] = await connection.execute(
            `SELECT COUNT(*) as total FROM \`${tableName}\``
          );
          console.log(`      📊 Total de registros: ${count[0].total}`);
        } catch (error) {
          console.log(`      ❌ Erro ao examinar tabela: ${error.message}`);
        }
      }
    }

    console.log(
      "\n🎉 Todos os testes passaram! Seu servidor MCP MySQL está pronto para uso."
    );
  } catch (error) {
    console.error("\n❌ Erro ao conectar com MySQL:");
    console.error("📋 Detalhes do erro:", error.message);
    console.error("\n🔧 Possíveis soluções:");
    console.error("   • Verifique se o MySQL está rodando na porta 3307");
    console.error("   • Confirme se as credenciais estão corretas");
    console.error("   • Verifique se o banco existe");
    console.error(
      "   • Teste a conexão: mysql -h 127.0.0.1 -P 3307 -u root -p"
    );

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔚 Conexão encerrada.");
    }
  }
}

// Executar o teste
testMySQLConnection().catch((error) => {
  console.error("💢 Erro fatal:", error);
  process.exit(1);
});
