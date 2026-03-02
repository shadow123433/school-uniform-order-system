const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { auth, onlyAdmin } = require("../middlewares/auth");

// ROTAS
router.post("/", auth, pedidosController.criarPedido);
router.get("/meus", auth, pedidosController.listarMeusPedidos);
router.get("/", auth, onlyAdmin, pedidosController.listarTodosPedidos);
router.patch("/:id/status", auth, onlyAdmin, pedidosController.alterarStatus);
router.delete("/:id", auth, onlyAdmin, pedidosController.deletarPedido);
router.patch("/ocultar/:id", auth, pedidosController.ocultarPedido);

module.exports = router;