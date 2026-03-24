const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT, JWT_SECRET } = require("./config/env"); 

const authRoutes = require("./routes/authroutes");
const pedidosRoutes = require("./routes/pedidosroutes");

require("./database/db"); 

const app = express();

// ===============================
// CORS
// ===============================
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://school-uniform-order-system.onrender.com" 
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// ===============================
// Middlewares Globais
// ===============================
app.use(express.json());

// Serve arquivos do front-end
app.use(express.static(path.join(__dirname, "..")));

// ===============================
// ENDEREÇO DAS ROTAS DE API
// ===============================
app.use("/auth", authRoutes);
app.use("/pedidos", pedidosRoutes);

// ===============================
// Middleware de erro global
// ===============================
app.use((err, req, res, next) => {
  console.error("ERRO GLOBAL:", err);
  res.status(500).json({
    error: "Erro interno do servidor"
  });
});

// ===============================
// Inicialização do servidor
// ===============================
// A Render prioriza process.env.PORT, se não houver, usa a do env.js ou 10000
const runningPort = process.env.PORT || PORT || 10000;

app.listen(runningPort, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${runningPort}`);
  // Log de segurança para você ver no console se a chave está presente
  console.log("JWT_SECRET carregado:", JWT_SECRET ? "SIM ✅" : "NÃO ❌");
});