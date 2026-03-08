const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("./config/env");

const authRoutes = require("./routes/authroutes");
const pedidosRoutes = require("./routes/pedidosroutes");

require("./database/db"); // Inicializa o banco ao subir o servidor

const app = express();


// ===============================
// CORS
// ===============================
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));


// ===============================
// Middlewares Globais
// ===============================
app.use(express.json());

// Servir arquivos do front (coloque seu front na pasta /public)
app.use(express.static(path.join(__dirname, "..")));


// ===============================
// ENDEREÇO DAS ROTAS DE API
// ===============================
app.use("/auth", authRoutes);   //authroutes.js
app.use("/pedidos", pedidosRoutes); //pedidosroutes.js
// essas duas linhas sao o gatilho para as rotas funcionarem, tudo aqui e enviado para a pasta routes.



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
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});