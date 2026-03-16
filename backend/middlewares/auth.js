const jwt = require("jsonwebtoken");
// Importamos o objeto 'config' inteiro para acessar a propriedade dinamicamente
const config = require("../config/env");

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];

  try {
    // AQUI ESTÁ O SEGREDO: 
    // Usamos config.JWT_SECRET aqui dentro para garantir que ele leia o valor da Render na hora da requisição.
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next(); 

  } catch (err) {
    // Este log vai te mostrar na Render o motivo exato se falhar
    console.error("❌ ERRO NA VERIFICAÇÃO:", err.message);
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