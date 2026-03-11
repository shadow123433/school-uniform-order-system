const express = require("express");
const cors = require("cors");
const path = require("path");
const { PORT } = require("./config/env");

const authRoutes = require("./routes/authroutes");
const pedidosRoutes = require("./routes/pedidosroutes");

require("./database/db"); // Inicializa o banco ao subir o servidor

const app = express(); //coração do server, sem isso a framework nao funciona.


// ===============================
// CORS
// ===============================
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], //metodos que o sistema vai aceitar.
  allowedHeaders: ["Content-Type", "Authorization"]  // cabeçalhos permitidos, incluindo o Authorization para tokens JWT, permite que o usuario entre com o tokem jwt.
};

app.use(cors(corsOptions)); // Permite que o front-end acesse a API sem problemas de CORS, garantindo que apenas os domínios especificados possam fazer requisições.


// ===============================
// Middlewares Globais
// ===============================
app.use(express.json()); // Permite que o Express entenda JSON no corpo das requisições

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
});   // se der algum erro no servidor, ele cai aqui e mostra a mensagem de erro, evitando que o servidor quebre.


// ===============================
// Inicialização do servidor
// ===============================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});