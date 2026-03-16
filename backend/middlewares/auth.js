const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function auth(req, res, next) {
  const header = req.headers.authorization;

  // 1. Verifica se o "crachá" (Token) foi enviado
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];

  try {
    // 2. Verifica se o token é legítimo usando sua chave secreta
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Em vez de consultar o banco (que reseta na Render), 
    // usamos os dados que já estão guardados dentro do próprio Token.
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next(); 

  } catch (err) {
    // Se o token estiver vencido (passou de 8h) ou for inválido
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