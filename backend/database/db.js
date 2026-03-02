const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const env = require("../config/env");

const db = new sqlite3.Database(
  __dirname + "/../pedidos.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

db.configure("busyTimeout", 10000);

db.serialize(() => {
  // Performance
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");

  // ===============================
  // TABELA USERS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cliente',
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ===============================
  // TABELA PEDIDOS
  // ===============================
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      pedidoID TEXT NOT NULL,
      nome TEXT NOT NULL,
      endereco TEXT,
      numeroCasa TEXT,
      referencia TEXT,
      itens TEXT NOT NULL,
      total REAL NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      user_id INTEGER,
      ativo_usuario INTEGER DEFAULT 1
    )
  `);

  // ===============================
  // GARANTIR COLUNA ativo_usuario
  // (caso banco antigo não tenha)
  // ===============================
  db.all("PRAGMA table_info(pedidos)", (err, columns) => {
    if (err) {
      console.log("Erro ao verificar estrutura da tabela:", err.message);
      return;
    }

    const temColuna = columns.some(col => col.name === "ativo_usuario");

    if (!temColuna) {
      db.run(
        `ALTER TABLE pedidos ADD COLUMN ativo_usuario INTEGER DEFAULT 1`,
        (err) => {
          if (err) {
            console.log("Erro ao adicionar ativo_usuario:", err.message);
          } else {
            console.log("Coluna ativo_usuario adicionada");
          }
        }
      );
    } else {
      console.log("Coluna ativo_usuario OK");
    }
  });

  console.log("✅ Banco e tabelas prontos");

  // ===============================
  // CRIAR ADMIN PADRÃO
  // ===============================
  const adminEmail = env.ADMIN_EMAIL;
  const adminSenha = env.ADMIN_PASSWORD;

  if (!adminEmail || !adminSenha) {
    console.log("⚠️ ADMIN_EMAIL ou ADMIN_PASSWORD não definidos no .env");
    return;
  }

  db.get(
    "SELECT * FROM users WHERE email=?",
    [adminEmail],
    async (err, user) => {
      if (err) {
        console.log("Erro ao buscar admin:", err.message);
        return;
      }

      if (!user) {
        const hash = await bcrypt.hash(adminSenha, 10);

        db.run(
          `INSERT INTO users (nome,email,password_hash,role)
           VALUES (?,?,?,?)`,
          ["Admin", adminEmail, hash, "admin"],
          () => console.log(`Admin criado: ${adminEmail}`)
        );
      } else {
        console.log("Admin já existe:", adminEmail);
      }
    }
  );
});

module.exports = db;