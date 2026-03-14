const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const required = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]; // Removi o PORT daqui

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`AVISO: ${key} não definido nas variáveis de ambiente!`);
    // Removido o process.exit(1) para não derrubar o servidor na Render
  }
});

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  PORT: process.env.PORT || 10000 // A Render usa 10000 por padrão
};