const db = require("../database/db"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env"); // Importamos o objeto inteiro aqui

// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  const regexNomeReal = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;
  if (!regexNomeReal.test(nome.trim())) {
    return res.status(400).json({ error: "Digite seu nome completo (Nome e Sobrenome)" });
  }

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Apenas contas @gmail.com são permitidas" });
  }

  const possuiTresNumeros = (senha.match(/\d/g) || []).length >= 3;
  if (senha.length < 6 || !possuiTresNumeros) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres e conter pelo menos 3 números." });
  }

  const hash = await bcrypt.hash(senha, 10);

  db.run(
    `INSERT INTO users (nome,email,password_hash) VALUES (?,?,?)`,
    [nome, email, hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Email já cadastrado" });

      // AJUSTE AQUI: Usando config.JWT_SECRET para bater com o login e middleware
      const token = jwt.sign(
        { id: this.lastID, role: "cliente" }, 
        config.JWT_SECRET, 
        { expiresIn: "8h" }
      );

      res.json({ token });
    }
  );
};

// ===============================
// LOGIN
// ===============================
exports.login = (req, res) => {
  const { email, senha } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) return res.status(404).json({ error: "Este e-mail não está cadastrado" });

    const ok = await bcrypt.compare(senha, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Senha incorreta" });

    const userRole = (email.toLowerCase() === config.ADMIN_EMAIL?.toLowerCase()) ? "admin" : user.role;

    // AJUSTE AQUI: Garantindo o uso do config.JWT_SECRET
    const token = jwt.sign(
      { id: user.id, role: userRole }, 
      config.JWT_SECRET, 
      { expiresIn: "8h" }
    );

    res.json({
      token, 
      role: userRole,
      user: { nome: user.nome, email: user.email }
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
};