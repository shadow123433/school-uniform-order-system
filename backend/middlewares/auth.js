const jwt = require("jsonwebtoken");
const env = require("../config/env");

const JWT_SECRET = env.JWT_SECRET;

function auth(req, res, next) {   // porteiro que identifica o cliente, verificando se ele tem um token válido para acessar as rotas protegidas. Ele verifica se o client forneceu um token JWT no cabeçalho de autorização da requisição, e se o token for válido, ele decodifica o token e adiciona as informações do usuário à requisição para que as rotas possam usar essas informações para autorizar o acesso. Se o token for inválido ou expirado, ele retorna uma resposta de erro com status 401 e uma mensagem indicando que o token é inválido ou expirado.
  const header = req.headers.authorization; // porteiro pede o token JWT que o cliente deve fornecer no cabeçalho de autorização da requisição. O token é uma string que o cliente recebe após fazer login e que deve ser incluída em todas as requisições subsequentes para acessar rotas protegidas. O middleware "auth" verifica se o token está presente e é válido antes de permitir o acesso às rotas protegidas, garantindo que apenas usuários autenticados possam acessar essas rotas.

  if (!header || !header.startsWith("Bearer ")) {  //checa se o token JWT está presente.
    return res.status(401).json({ error: "Token não fornecido" }); //se o tokem nao estiver presente, o middleware retorna uma resposta de erro com status 401 e uma mensagem indicando que o token não foi fornecido. Isso impede que usuários não autenticados acessem rotas protegidas, garantindo que apenas usuários com um token válido possam acessar essas rotas.
  }

  const token = header.split(" ")[1]; // serve pra apagar o texto e ficar somente com o codigo que o servidor da para o cliente, ou seja, o token JWT. O token é a parte que vem depois de "Bearer " no cabeçalho de autorização.

  try {
    req.user = jwt.verify(token, JWT_SECRET); //verifica se o token JWT fornecido pelo cliente é válido usando a chave secreta JWT_SECRET. Se o token for válido, ele decodifica o token e adiciona as informações do usuário (como id e role) à requisição (req.user) para que as rotas possam usar essas informações para autorizar o acesso. Se o token for inválido ou expirado, ele retorna uma resposta de erro com status 401 e uma mensagem indicando que o token é inválido ou expirado.
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" }); // depois que passar do tempo de atividade do token, ele vai expirar, e o cliente vai precisar fazer login novamente para obter um novo token. Isso é uma medida de segurança para garantir que os tokens não sejam usados indefinidamente, reduzindo o risco de uso indevido caso um token seja comprometido.
  }
}

function onlyAdmin(req, res, next) {  
  if (req.user.role !== "admin") {     //se for admin, acesso liberado.
    return res.status(403).json({ error: "Acesso negado" });  // se não for admin, vai jogar no vasco, ou seja, acesso negado.
  }
  next();
}

module.exports = { auth, onlyAdmin }; // serve pra compartilhar as funções de autenticação e autorização com outras partes do sistema, como os controladores e as rotas. Ao exportar essas funções, elas podem ser importadas e usadas em diferentes arquivos para proteger rotas específicas, garantindo que apenas usuários autenticados e autorizados possam acessá-las. Por exemplo, o middleware "auth" pode ser usado para proteger rotas que exigem autenticação, enquanto o middleware "onlyAdmin" pode ser usado para proteger rotas que exigem privilégios de administrador.

// a pasta middlewares serve como se fosse um segurança, o cliente passa por aqui primeiro antes de ter acesso a certas rotas. O middleware "auth" verifica se o cliente forneceu um token JWT válido na requisição, e se for válido, ele decodifica o token e adiciona as informações do usuário à requisição para que as rotas possam usar essas informações para autorizar o acesso. O middleware "onlyAdmin" verifica se o usuário autenticado tem a função de "admin", e se não tiver, ele retorna uma resposta de acesso negado. Esses middlewares são usados para proteger rotas específicas, garantindo que apenas usuários autenticados e autorizados possam acessá-las.