const db = require("../database/db");
const PRECOS = require("../utils/precos");

// ===============================
// CRIAR PEDIDO
// ===============================
exports.criarPedido = (req, res) => {
  try {
    const body = req.body;
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (itens.length === 0)
      return res.status(400).json({ error: "Carrinho vazio" });

    let totalCalculado = 0;
    for (const item of itens) {
      const preco = PRECOS[item.produto];
      if (!preco) return res.status(400).json({ error: "Produto inválido" });

      for (const qtd of Object.values(item.tamanhos)) {
        totalCalculado += Number(qtd || 0) * preco;
      }
    }

    if (!body.nome || body.nome.trim() === "")
      return res.status(400).json({ error: "Nome é obrigatório" });

    const pedidoID = body.pedidoID || Date.now().toString();
    const statusInicial = body.tipo === "RESERVA" ? "aguardando" : "pendente";

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
        if (err) return res.status(500).json({ error: "Erro ao salvar pedido" });

        res.json({
          success: true,
          data: {
            pedidoID,
            total: totalCalculado.toFixed(2),
            status: statusInicial
          }
        });
      }
    );
  } catch {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// ===============================
// LISTAR PEDIDOS DO CLIENTE
// ===============================
exports.listarMeusPedidos = (req, res) => {
  db.all(
    "SELECT * FROM pedidos WHERE user_id=? AND ativo_usuario=1 ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar pedidos" });

      const pedidos = rows.map((p) => ({ ...p, itens: JSON.parse(p.itens || "[]") }));
      res.json({ success: true, data: pedidos });
    }
  );
};

// ===============================
// LISTAR TODOS PEDIDOS (ADMIN)
// ===============================
exports.listarTodosPedidos = (req, res) => {
  db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar pedidos" });

    const pedidos = rows.map((p) => ({ ...p, itens: JSON.parse(p.itens || "[]") }));
    res.json({ success: true, data: pedidos });
  });
};

// ===============================
// ALTERAR STATUS (ADMIN)
// ===============================
exports.alterarStatus = (req, res) => {
  const { status } = req.body;
  const statusValidos = ["pendente", "pago", "aguardando", "retirado"];

  if (!statusValidos.includes(status))
    return res.status(400).json({ error: "Status inválido" });

  db.run("UPDATE pedidos SET status=? WHERE id=?", [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Erro ao atualizar status" });
    if (this.changes === 0) return res.status(404).json({ error: "Pedido não encontrado" });
    res.json({ success: true });
  });
};

// ===============================
// DELETAR PEDIDO (ADMIN)
// ===============================
exports.deletarPedido = (req, res) => {
  db.run("DELETE FROM pedidos WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Erro ao deletar pedido" });
    if (this.changes === 0) return res.status(404).json({ error: "Pedido não encontrado" });
    res.json({ success: true });
  });
};

// ===============================
// OCULTAR PEDIDO (CLIENTE)
// ===============================
exports.ocultarPedido = (req, res) => {
  db.run(
    "UPDATE pedidos SET ativo_usuario=0 WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Erro ao ocultar pedido" });
      if (this.changes === 0) return res.status(404).json({ error: "Pedido não encontrado" });
      res.json({ success: true });
    }
  );
};