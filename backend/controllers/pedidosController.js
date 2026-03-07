const db = require("../database/db");
const PRECOS = require("../utils/precos");

// ===============================
// CRIAR PEDIDO
// ===============================
exports.criarPedido = (req, res) => {
  try {
    const body = req.body;  // requisição que o http/cliente trás pro meu servidor, contendo os dados do pedido que o cliente deseja criar. O corpo da requisição deve incluir informações como nome, endereço, itens do pedido, etc. O servidor irá processar esses dados para criar um novo pedido no sistema.
    const itens = Array.isArray(body.itens) ? body.itens : []; //segurança da lista de itens do cliente.

    if (itens.length === 0)  //verifica se tem itens dentro do carrinho.
      return res.status(400).json({ error: "Carrinho vazio" });

    let totalCalculado = 0;
    for (const item of itens) {
      const preco = PRECOS[item.produto];
      if (!preco) return res.status(400).json({ error: "Produto inválido" }); //verifica se o produto é válido, ou seja, se ele existe na tabela de preços. Se o produto não for encontrado, o servidor retorna um erro indicando que o produto é inválido.

      for (const qtd of Object.values(item.tamanhos)) {  //calcula o total do pedido multiplicando a quantidade de cada item pelo seu preço correspondente. O total é acumulado na variável totalCalculado, que será usada posteriormente para salvar o pedido no banco de dados e retornar o valor total para o cliente.
        totalCalculado += Number(qtd || 0) * preco;
      }
    }

    if (!body.nome || body.nome.trim() === "") //verifica se o campo "nome" está presente e não é vazio. Se o nome for inválido, o servidor retorna um erro indicando que o nome é obrigatório. Isso garante que cada pedido tenha um nome associado a ele, o que pode ser importante para identificação e processamento do pedido.
      return res.status(400).json({ error: "Nome é obrigatório" });

    const pedidoID = body.pedidoID || Date.now().toString();//gera um ID único para o pedido. Se o cliente não fornecer um ID, o servidor gera um ID usando a data e hora atual (Date.now()), convertendo-a para string. Isso garante que cada pedido tenha um identificador único, mesmo que o cliente não forneça um ID específico.
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
        1 //ativo_usuario é uma flag que indica se o pedido deve ser visível para o cliente. Quando um pedido é criado, ele é marcado como ativo (ativo_usuario=1), o que significa que o cliente pode vê-lo em sua lista de pedidos. Se o cliente optar por ocultar ou cancelar o pedido, essa flag pode ser atualizada para 0, tornando o pedido invisível para o cliente, mas ainda presente no banco de dados para fins administrativos ou de histórico.
      ],
      function (err) {
        if (err) return res.status(500).json({ error: "Erro ao salvar pedido" });  //verifica se houve um erro ao tentar salvar o pedido no banco de dados. Se ocorrer um erro, o servidor retorna uma resposta de erro com status 500 e uma mensagem indicando que houve um problema ao salvar o pedido. Isso ajuda a garantir que o cliente seja informado sobre qualquer problema que possa ter ocorrido durante o processo de criação do pedido.

        res.json({  //resposta que o meu servidor da para o cliente, caso a criação do pedido seja bem-sucedida. A resposta inclui um campo "success" indicando que a operação foi bem-sucedida, e um campo "data" contendo informações sobre o pedido criado, como o ID do pedido, o total calculado e o status inicial do pedido. Isso permite que o cliente receba uma confirmação de que seu pedido foi criado com sucesso e obtenha detalhes relevantes sobre o pedido.
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
    res.status(500).json({ error: "Erro interno do servidor" });  //bloco catch para capturar qualquer erro inesperado que possa ocorrer durante o processo de criação do pedido. Se ocorrer um erro que não foi tratado especificamente, o servidor retorna uma resposta de erro com status 500 e uma mensagem indicando que houve um erro interno no servidor. Isso ajuda a garantir que o cliente seja informado sobre problemas inesperados e que o servidor possa lidar com erros de forma robusta.
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
      if (err) return res.status(500).json({ error: "Erro ao buscar pedidos" }); //verifica se houve um erro ao tentar buscar os pedidos do cliente no banco de dados. Se ocorrer um erro, o servidor retorna uma resposta de erro com status 500 e uma mensagem indicando que houve um problema ao buscar os pedidos. Isso ajuda a garantir que o cliente seja informado sobre qualquer problema que possa ter ocorrido durante o processo de recuperação dos pedidos.

      const pedidos = rows.map((p) => ({ ...p, itens: JSON.parse(p.itens || "[]") })); //processa os pedidos recuperados do banco de dados, convertendo a string JSON armazenada no campo "itens" de volta para um formato de objeto JavaScript. Isso é necessário porque os itens do pedido foram armazenados como uma string JSON no banco de dados, e para que o cliente possa trabalhar com esses dados de forma mais conveniente, eles precisam ser convertidos de volta para um formato de objeto. O resultado é uma lista de pedidos, onde cada pedido inclui seus detalhes e os itens associados a ele em um formato mais acessível para o cliente.
      res.json({ success: true, data: pedidos }); //resposta que o meu servidor da para o cliente, caso a recuperação dos pedidos seja bem-sucedida. A resposta inclui um campo "success" indicando que a operação foi bem-sucedida, e um campo "data" contendo a lista de pedidos do cliente, onde cada pedido inclui seus detalhes e os itens associados a ele. Isso permite que o cliente receba uma confirmação de que seus pedidos foram recuperados com sucesso e obtenha acesso às informações relevantes sobre seus pedidos.
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
};  // "Apaga a luz" do pedido (muda pra 0) para o usuário não ver, sem deletar do banco.  "meio que uma trava de segurança"


// ===============================
// CANCELAR PEDIDO (CLIENTE)
// ===============================
exports.cancelarPedido = (req, res) => {
  db.get(
    "SELECT status FROM pedidos WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err, pedido) => {
      if (err) return res.status(500).json({ error: "Erro interno" });
      if (!pedido) return res.status(404).json({ error: "Pedido não encontrado" });

      if (!["pendente", "aguardando"].includes(pedido.status))
        return res.status(400).json({ error: "Pedido não pode ser cancelado" });

      db.run(
        "UPDATE pedidos SET status=? WHERE id=?",
        ["cancelado_cliente", req.params.id],
        function (err) {
          if (err) return res.status(500).json({ error: "Erro ao cancelar pedido" }); //se o pedido for marcado como pago no banco de dados/painel adm nao sera possivel cancelar o pedido.
          res.json({ success: true }); //resposta que o meu servidor da para o cliente, caso o cancelamento do pedido seja bem-sucedido. A resposta inclui um campo "success" indicando que a operação foi bem-sucedida. Isso permite que o cliente receba uma confirmação de que seu pedido foi cancelado com sucesso.
        }
      );
    }
  );
};