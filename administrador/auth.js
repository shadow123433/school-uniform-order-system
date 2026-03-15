// Detecta se o site está rodando localmente ou na nuvem
const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000" 
  : "https://school-uniform-order-system.onrender.com";

console.log("Conectado à API:", API);

function getToken(){
  return localStorage.getItem("token"); // o token é salvo no localStorage do navegador, e essa função é para pegar ele quando precisar usar.
}

function setToken(t){ // essa função é para salvar o token no localStorage, ela é chamada depois do login bem sucedido.
  localStorage.setItem("token", t);
}

function logout(){ // essa função é para deslogar o usuario, ela remove o token do localStorage e recarrega a pagina para atualizar o estado do app.
  localStorage.removeItem("token");
  location.reload();
}

async function login() {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
// pegam o que o usuario digitou nos campos de email e senha do formulario de login.

  try {
    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value, senha: senhaInput.value })// aqui a gente faz a requisição para o backend, enviando o email e senha digitados pelo usuario. O backend vai validar e retornar um token se for bem sucedido.
    });

    const data = await res.json(); //Pega a resposta bruta do servidor e a transforma em um objeto (JSON) que o JS entende.

    if (!res.ok || !data.token) { //Verifica se a resposta deu erro (ex: 401 ou 400) OU se o servidor esqueceu de enviar o token.
      alert(data.error || "Login inválido");
      return;
    }

    setToken(data.token);  //Se chegou aqui, o login deu certo! Salva o "crachá" (token) na memória do navegador.
    iniciarPainel(); // Esta função está no painel.js
  } catch (err) { //O "Plano B": se o servidor estiver desligado ou a internet cair, o código pula para cá.
    alert("Erro ao conectar com o servidor.");
  }
}