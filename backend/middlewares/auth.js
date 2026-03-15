const jwt = require("jsonwebtoken");
const config = require("../config/env"); // Importa o objeto inteiro

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];

  try {
    // BUSCAMOS A CHAVE DO OBJETO CONFIG NO MOMENTO DA VERIFICAÇÃO
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next(); 

  } catch (err) {
    console.error("❌ ERRO NA VERIFICAÇÃO NA RENDER:", err.message);
    return res.status(401).json({ error: "Sessão expirada ou token inválido." });
  }
}

function onlyAdmin(req, res, next) {  
  if (!req.user || req.user.role !== "admin") { 
    return res.status(403).json({ error: "Acesso negado: Requer privilégios de administrador" });
  }
  next();
}

module.exports = { auth, onlyAdmin };