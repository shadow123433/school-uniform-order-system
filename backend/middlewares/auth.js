const jwt = require("jsonwebtoken"); //biblioteca para criar e verificar tokens JWT, que são usados para autenticação e autorização no sistema.
const { JWT_SECRET } = require("../config/env"); //para que o auth receba a chave secreta que está salva no env.js, seja na Render ou localmente, e use essa chave para verificar os tokens JWT que os clientes enviam nas requisições. Isso é fundamental para garantir a segurança da autenticação e autorização no sistema.

function auth(req, res, next) { //pega a requisição do cliente, verifica se o token JWT enviado é válido e, se for, permite que a requisição continue para a próxima etapa (como acessar uma rota protegida). Se o token for inválido ou ausente, ele retorna um erro de autenticação.
  const header = req.headers.authorization; //limpa a mensagem bruta que o http envia e pega somente o tokem.

  // 1. Verifica se o "crachá" (Token) foi enviado
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1]; // serve para pegar somente o tokem e ignora o texto inutil que vem com o navegador

  try {
    // 2. Verifica se o token é legítimo usando sua chave secreta
    const decoded = jwt.verify(token, JWT_SECRET); // se o tokem estiver carimbado com a chave correta, ele é decodificado e as informações do usuário ficam disponíveis. Se o token for inválido ou tiver expirado, ele vai lançar um erro que será capturado pelo catch.
    
    // 3. Em vez de consultar o banco (que reseta na Render), 
    // usamos os dados que já estão guardados dentro do próprio Token.
    req.user = {
      id: decoded.id, // O ID do usuário, que pode ser usado para identificar o cliente ou admin
      role: decoded.role // A função do usuário (cliente ou admin), que já está embutida no token
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

module.exports = { auth, onlyAdmin }; //serve para o sistema ter acesso a essas funções em outros arquivos, como nas rotas, onde podemos proteger certas rotas para que apenas usuários autenticados ou administradores possam acessá-las.