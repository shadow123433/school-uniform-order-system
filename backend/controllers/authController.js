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
// LOGIN
// ===============================
exports.login = (req, res) => {
  const { email, senha } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    // 1. Se o usuário não existe, retorna 404
    if (!user) {
      return res.status(404).json({ error: "Este e-mail não está cadastrado" });
    }

    // 2. Se o usuário existe, mas a senha está errada, retorna 401
    const ok = await bcrypt.compare(senha, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(     //gera um token JWT para o usuário autenticado.
      { id: user.id, role: user.role }, //dados que serão incluidos no tokem, nesse caso o id do usuário e a função (role) do usuário, que pode ser "cliente" ou "admin". Essas informações podem ser usadas posteriormente para autorizar o acesso a recursos específicos com base na função do usuário.
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({  //resposta que o meu servidor da para o cliente, caso o login seja bem-sucedido.
    token, 
    role: user.role,
    user: {
        nome: user.nome, // Enviando o nome que está no banco de dados
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




// ===============================
// PROMOVER PARA ADMIN (TEMPORÁRIO)
// ===============================
exports.makeMeAdmin = (req, res) => {
  const { email } = req.params;

  db.run(`UPDATE users SET role = 'admin' WHERE email = ?`, [email], function(err) {
    if (err) {
      return res.status(500).json({ error: "Erro ao acessar o banco de dados." });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Usuário não encontrado com esse e-mail." });
    }

    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #28a745;">✅ Sucesso!</h1>
        <p style="font-size: 18px;">O usuário <b>${email}</b> agora é <b>Administrador</b>.</p>
        <p>Você já pode fechar esta aba e fazer login no painel.</p>
      </div>
    `);
  });
};