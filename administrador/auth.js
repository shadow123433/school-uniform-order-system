const API = "http://localhost:3000";

function getToken(){
  return localStorage.getItem("token");
}

function setToken(t){
  localStorage.setItem("token", t);
}

function logout(){
  localStorage.removeItem("token");
  location.reload();
}

async function login() {
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");

  try {
    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value, senha: senhaInput.value })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      alert(data.error || "Login inválido");
      return;
    }

    setToken(data.token);
    iniciarPainel(); // Esta função está no painel.js
  } catch (err) {
    alert("Erro ao conectar com o servidor.");
  }
}