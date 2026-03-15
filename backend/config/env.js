const path = require("path");
const fs = require("fs");

// Caminho para o seu arquivo .env local
const envPath = path.resolve(__dirname, "../../.env");

// Só tenta carregar o arquivo se ele realmente existir (evita erro na Render)
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  // Na Render, apenas inicializa o dotenv padrão
  require("dotenv").config();
}

module.exports = {
  // Forçamos a mesma string que você colocou no painel da Render
  JWT_SECRET: process.env.JWT_SECRET || "uma_frase_bem_longa_e_aleatoria_123",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  PORT: process.env.PORT || 10000
};