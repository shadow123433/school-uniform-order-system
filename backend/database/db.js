const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const env = require("../config/env");
const path = require("path"); 

const dbPath = path.join(__dirname, "..", "pedidos.db");

const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

db.configure("busyTimeout", 10000); //configura um tempo limite de 10 segundos para as operações de banco de dados. 

db.serialize(() => {
  // Performance
  db.run("PRAGMA journal_mode = WAL;"); // "destrava", configura o modo de journal do SQLite para "Write-Ahead Logging" (WAL). O modo WAL melhora a performance em cenários de leitura e escrita concorrentes, permitindo que as operações de leitura e escrita ocorram simultaneamente sem bloqueios significativos. Isso é especialmente benéfico para aplicações web que podem ter múltiplas requisições acessando o banco de dados ao mesmo tempo.
  db.run("PRAGMA synchronous = NORMAL;");//"veloz", configura o nível de sincronização do SQLite para "NORMAL". Isso significa que o SQLite não garantirá a integridade total dos dados em caso de falha de energia ou travamento do sistema, mas isso pode melhorar a performance em cenários onde a velocidade é mais importante do que a segurança total dos dados. Essa configuração é adequada para aplicações onde a perda de alguns dados em casos extremos é aceitável, como em um sistema de pedidos onde os dados podem ser recuperados ou reprocessados.

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
  db.all("PRAGMA table_info(pedidos)", (err, columns) => {     //executa uma consulta SQL para obter informações sobre a estrutura da tabela "pedidos". O comando "PRAGMA table_info(pedidos)" retorna uma lista de colunas presentes na tabela "pedidos", incluindo seus nomes, tipos e outras informações. O resultado é passado para uma função de callback que processa as informações das colunas.
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

  console.log("✅ Banco e tabelas prontos");      //essa parte serve pra garantir que a coluna "ativo_usuario" exista na tabela "pedidos". Ele verifica a estrutura da tabela "pedidos" para ver se a coluna "ativo_usuario" já está presente. Se a coluna não existir, ele executa um comando SQL para adicionar a coluna "ativo_usuario" à tabela, com um valor padrão de 1. Isso é importante para garantir que o sistema possa usar essa coluna para controlar a visibilidade dos pedidos para os clientes, mesmo que o banco de dados tenha sido criado antes dessa funcionalidade ser implementada. Se a coluna já existir, ele apenas loga uma mensagem indicando que a coluna está OK.

  
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
});     // essa parte serve pra criar adm padrão, caso ele não exista. Ele verifica se já existe um usuário com o email definido em ADMIN_EMAIL no banco de dados. Se não existir, ele cria um novo usuário com o nome "Admin", o email definido em ADMIN_EMAIL, a senha definida em ADMIN_PASSWORD (após ser hashada) e a função "admin". Se o usuário já existir, ele apenas loga uma mensagem indicando que o admin já existe. Isso garante que sempre haja um usuário administrador disponível para acessar o painel administrativo do sistema.
module.exports = db;