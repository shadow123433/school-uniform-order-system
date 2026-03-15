const db = require("../database/db"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// AQUI ESTÁ A CHAVE PARA O SUCESSO:
const { JWT_SECRET } = require("../config/env");


// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  const { nome, email, senha } = req.body;

  // 1. Verifica se os campos estão vazios
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  // 2. Validação de Nome Real (Nome e Sobrenome)
  const regexNomeReal = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;
  if (!regexNomeReal.test(nome.trim())) {
    return res.status(400).json({ error: "Digite seu nome completo (Nome e Sobrenome)" });
  }

  // 3. Validação rigorosa do Gmail
  if (!email.toLowerCase().endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Apenas contas @gmail.com são permitidas" });
  }

 // Validação: Mínimo 6 caracteres E pelo menos 3 números
  const possuiTresNumeros = (senha.match(/\d/g) || []).length >= 3;

  if (senha.length < 6 || !possuiTresNumeros) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres e conter pelo menos 3 números." });
  }

  const hash = await bcrypt.hash(senha, 10);  //cria um hash da senha do usuário usando bcrypt, com um custo de 10. O hash é uma versão criptografada da senha que será armazenada no banco de dados, em vez da senha original, para aumentar a segurança.

  db.run(
    `INSERT INTO users (nome,email,password_hash) VALUES (?,?,?)`,
    [nome, email, hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Email já cadastrado" }); // se o usuario inserir um email que ja existe no register/banco vai da erro.

      const token = jwt.sign( //gera um token JWT para o usuário recém-registrado.
        { id: this.lastID, role: "cliente" }, //dados que serão incluidos no tokem.
        JWT_SECRET,  //carimbo secreto usado para assinar o token, garantindo que ele não possa ser alterado por terceiros.
        { expiresIn: "8h" }
      );

      res.json({ token }); //entrega o token para o cliente, para que ele possa usar esse token para autenticar suas requisições futuras. O token contém informações sobre o usuário, como seu ID e função (role), e tem um tempo de expiração de 8 horas.
    }
  );
};

// ===============================
// LOGIN (VERSÃO DEFINITIVA)
// ===============================
exports.login = (req, res) => {
  const { email, senha } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    // 1. Verifica se o usuário existe
    if (!user) {
      return res.status(404).json({ error: "Este e-mail não está cadastrado" });
    }

    // 2. Verifica a senha
    const ok = await bcrypt.compare(senha, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // 3. A SOLUÇÃO CERTEIRA:
    // Compara o email do login com o ADMIN_EMAIL que está na Render (admin@gmail.com)
    const adminEmailConfig = process.env.ADMIN_EMAIL;
    const userRole = (email.toLowerCase() === adminEmailConfig?.toLowerCase()) ? "admin" : user.role;

    const token = jwt.sign(
      { id: user.id, role: userRole }, 
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token, 
      role: userRole,
      user: {
          nome: user.nome,
          email: user.email
      }
    });
  });
};

// ===============================
// ME
// ===============================
exports.me = (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role
  });
};      //o navegador manda uma req, e eu envio uma resposta com base no banco de dados, se for admin ou usuario.
