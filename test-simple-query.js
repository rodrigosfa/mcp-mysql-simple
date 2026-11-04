#!/usr/bin/env node

/**
 * Teste simples para verificar se o problema está na implementação do MCP
 */

import mysql from "mysql2/promise";

async function testSimpleQuery() {
  const config = {
    host: process.env.MYSQL_HOST",
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  };

  console.log("🔍 Testando queries simples...");
  console.log(`📡 Host: ${config.host}:${config.port}`);
  console.log(`👤 Usuário: ${config.user}`);
  console.log(`🗃️ Banco: ${config.database}\n`);

  let connection = null;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Conectado ao MySQL\n");

    // Teste 1: Query simples com execute (prepared statement)
    console.log("1️⃣ Testando query simples com execute (prepared statement)...");
    const [rows1] = await connection.execute("SELECT 1 as test");
    console.log("✅ Resultado:", rows1);

    // Teste 2: Query com SHOW TABLES usando execute
    console.log("\n2️⃣ Testando SHOW TABLES com execute...");
    const [rows2] = await connection.execute("SHOW TABLES");
    console.log("✅ Resultado:", rows2.length, "tabelas encontradas");

    // Teste 3: Query com SHOW TABLES usando query (não prepared)
    console.log("\n3️⃣ Testando SHOW TABLES com query (não prepared)...");
    const [rows3] = await connection.query("SHOW TABLES");
    console.log("✅ Resultado:", rows3[0].length, "tabelas encontradas");

    // Teste 4: Query específica para e-notas
    console.log("\n4️⃣ Testando query específica para e-notas...");
    const [rows4] = await connection.execute("SELECT COUNT(*) as total FROM fiscal_center_integrations WHERE name = 'Enotas'");
    console.log("✅ Resultado:", rows4);

    console.log("\n🎉 Todos os testes passaram! O problema não está na implementação MySQL.");

  } catch (error) {
    console.error("\n❌ Erro durante os testes:");
    console.error("📋 Detalhes do erro:", error.message);
    console.error("🔍 Stack trace:", error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔚 Conexão encerrada.");
    }
  }
}

// Executar o teste
testSimpleQuery().catch((error) => {
  console.error("💢 Erro fatal:", error);
  process.exit(1);
});
