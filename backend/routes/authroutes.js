const express = require("express");
const router = express.Router();  //ferramenta criada pra organizar rotas de api.

const authController = require("../controllers/authController"); //aqui vai a logica dessas rotas que estao declaradas abaixo.
const { auth } = require("../middlewares/auth"); //antes do cliente passar pelas rotas ele cai em um processo de verificação de tokem.

// Rotas
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", auth, authController.me);
// aqui sao as rotas de api somente, a logica dessas rotas vao ser feitas na pasta controllers.

module.exports = router;