const express = require("express");
const router = express.Router();

const db = require("../database/db");
const { auth, onlyAdmin } = require("../middlewares/auth");
const PRECOS = require("../utils/precos");

// ===============================
// CRIAR PEDIDO
// ===============================
router.post("/", auth, (req, res) => {
  try {
    const body = req.body;
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (itens.length === 0)
      return res.status(400).json({ error: "Carrinho vazio" });

    let totalCalculado = 0;

    for (const item of itens) {
      const preco = PRECOS[item.produto];
      if (!preco)
        return res.status(400).json({ error: "Produto inválido" });

      for (const qtd of Object.values(item.tamanhos)) {
        totalCalculado += Number(qtd || 0) * preco;
      }
    }

if (!body.nome || body.nome.trim() === "") {
  return res.status(400).json({ error: "Nome é obrigatório" });
}
const pedidoID = body.pedidoID || Date.now().toString();    const statusInicial =
      body.tipo === "RESERVA" ? "aguardando" : "pendente";

    db.run(
      `INSERT INTO pedidos
      (tipo,pedidoID,nome,endereco,numeroCasa,referencia,itens,total,data,status,user_id,ativo_usuario)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
      body.tipo || "PEDIDO",
      pedidoID,
      body.nome,
      body.endereco || "",
      body.numeroCasa || "",
      body.referencia || "",
      JSON.stringify(itens),
      totalCalculado,
      new Date().toISOString(),
      statusInicial,
      req.user.id,
      1
      ],
      function (err) {
        if (err)
          return res.status(500).json({ error: "Erro ao salvar pedido" });

        res.json({
          success: true,
          data: {
            pedidoID,
            total: totalCalculado.toFixed(2),
            status: statusInicial,
          },
        });
      }
    );
  } catch {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ===============================
// CLIENTE - VER SEUS PEDIDOS
// ===============================
router.get("/meus", auth, (req, res) => {
  db.all(
    "SELECT * FROM pedidos WHERE user_id=? AND ativo_usuario=1 ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err)
        return res.status(500).json({ error: "Erro ao buscar pedidos" });

      const pedidos = rows.map((p) => ({
        ...p,
        itens: JSON.parse(p.itens || "[]"),
      }));

      res.json({ success: true, data: pedidos });
    }
  );
});

// ===============================
// ADMIN - VER TODOS
// ===============================
router.get("/", auth, onlyAdmin, (req, res) => {
  db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, rows) => {
    if (err)
      return res.status(500).json({ error: "Erro ao buscar pedidos" });

    const pedidos = rows.map((p) => ({
      ...p,
      itens: JSON.parse(p.itens || "[]"),
    }));

    res.json({ success: true, data: pedidos });
  });
});

// ===============================
// ADMIN - ALTERAR STATUS (PADRÃO NOVO)
// ===============================
router.patch("/:id/status", auth, onlyAdmin, (req, res) => {
  const { status } = req.body;

  const statusValidos = ["pendente", "pago", "aguardando", "retirado"];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  db.run(
    "UPDATE pedidos SET status=? WHERE id=?",
    [status, req.params.id],
    function (err) {
      if (err)
        return res.status(500).json({ error: "Erro ao atualizar status" });

      if (this.changes === 0)
        return res.status(404).json({ error: "Pedido não encontrado" });

      res.json({ success: true });
    }
  );
});

// ===============================
// ADMIN - DELETAR
// ===============================
router.delete("/:id", auth, onlyAdmin, (req, res) => {
  db.run("DELETE FROM pedidos WHERE id=?", [req.params.id], function (err) {
    if (err)
      return res.status(500).json({ error: "Erro ao deletar pedido" });

    if (this.changes === 0)
      return res.status(404).json({ error: "Pedido não encontrado" });

    res.json({ success: true });
  });
});


// ===============================
// CLIENTE - OCULTAR PEDIDO (apenas para ele)
// ===============================
router.patch("/ocultar/:id", auth, (req, res) => {
  db.run(
    `UPDATE pedidos 
     SET ativo_usuario=0 
     WHERE id=? AND user_id=?`,
    [req.params.id, req.user.id],
    function (err) {
      if (err)
        return res.status(500).json({ error: "Erro ao ocultar pedido" });

      if (this.changes === 0)
        return res.status(404).json({ error: "Pedido não encontrado" });

      res.json({ success: true });
    }
  );
});

module.exports = router;