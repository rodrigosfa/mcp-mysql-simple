#!/usr/bin/env node

/**
 * Script de teste simples para o servidor MCP MySQL
 * Este script testa as funcionalidades básicas do servidor
 */

import { spawn } from "child_process";

// Configurações do seu banco
const env = {
  ...process.env,
  MYSQL_HOST: "127.0.0.1",
  MYSQL_PORT: "3307",
  MYSQL_USER: "root",
  MYSQL_PASS: "root",
  MYSQL_DB: "voompcreators_back",
};

console.log("🧪 Testando servidor MCP MySQL...\n");

// Inicia o servidor MCP
const server = spawn("node", ["dist/index.js"], {
  env: env,
  stdio: ["pipe", "pipe", "pipe"],
});

// Mensagens de teste MCP
const testMessages = [
  // 1. Inicializar o servidor
  {
    name: "Initialize",
    message: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
    },
  },
  // 2. Listar ferramentas disponíveis
  {
    name: "List Tools",
    message: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    },
  },
  // 3. Listar recursos disponíveis
  {
    name: "List Resources",
    message: {
      jsonrpc: "2.0",
      id: 3,
      method: "resources/list",
      params: {},
    },
  },
  // 4. Listar prompts disponíveis
  {
    name: "List Prompts",
    message: {
      jsonrpc: "2.0",
      id: 4,
      method: "prompts/list",
      params: {},
    },
  },
];

let currentTest = 0;
let responses = [];

// Handle server output
server.stdout.on("data", (data) => {
  const response = data.toString().trim();
  if (response) {
    try {
      const parsed = JSON.parse(response);
      responses.push({
        test: testMessages[currentTest - 1]?.name || "Unknown",
        response: parsed,
      });

      console.log(
        `✅ ${testMessages[currentTest - 1]?.name}:`,
        JSON.stringify(parsed, null, 2)
      );

      // Enviar próximo teste
      if (currentTest < testMessages.length) {
        setTimeout(sendNextMessage, 1000);
      } else {
        console.log("\n🎉 Todos os testes básicos passaram!");
        console.log("\n📋 Resumo dos resultados:");
        responses.forEach((r, i) => {
          console.log(
            `${i + 1}. ${r.test}: ${
              r.response.error ? "❌ Erro" : "✅ Sucesso"
            }`
          );
        });
        server.kill();
      }
    } catch (error) {
      console.log("📤 Resposta do servidor:", response);
    }
  }
});

// Handle server errors
server.stderr.on("data", (data) => {
  console.log("📢 Log do servidor:", data.toString());
});

// Handle server exit
server.on("close", (code) => {
  console.log(`\n🔚 Servidor encerrado com código: ${code}`);
  process.exit(code);
});

// Send messages to server
function sendNextMessage() {
  if (currentTest < testMessages.length) {
    const testMessage = testMessages[currentTest];
    console.log(`\n📤 Enviando: ${testMessage.name}`);

    server.stdin.write(JSON.stringify(testMessage.message) + "\n");
    currentTest++;
  }
}

// Start testing after a short delay
setTimeout(() => {
  console.log("🚀 Iniciando testes...\n");
  sendNextMessage();
}, 2000);
