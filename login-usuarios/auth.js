const API_URL = "http://localhost:3000";

// =====================
// TOKEN
// =====================

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}


function isLogged() {
  return !!getToken();
}

// =====================
// LOGIN
// =====================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const res = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro no login");
        return;
      }

      // salva token e dados do usuário
      setToken(data.token);

      if (data.user) {
        localStorage.setItem("userName", data.user.nome);
        localStorage.setItem("userEmail", data.user.email);
      }

      // redirecionamento pós-login
      const redirect = sessionStorage.getItem("redirectAfterLogin");

      if (redirect) {
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirect;
      } else {
        window.location.href = "../Pagina2/index2.html";
      }

    } catch (err) {
      abrirModal("Erro ao conectar com o servidor");
      console.error(err);
    }
  });
}

// =====================
// REGISTER
// =====================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const res = await fetch(API_URL + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao cadastrar");
        return;
      }

      // salva token e dados do usuário
      setToken(data.token);

      if (data.user) {
        localStorage.setItem("userName", data.user.nome);
        localStorage.setItem("userEmail", data.user.email);
      }

      // redirecionamento pós-cadastro
      const redirect = sessionStorage.getItem("redirectAfterLogin");

      if (redirect) {
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirect;
      } else {
        window.location.href = "../Pagina2/index2.html";
      }

    } catch (err) {
      abrirModal("Erro ao conectar com o servidor");
      console.error(err);
    }
  });
}




// =====================
// CONTROLE DE USUÁRIO NA PAGINA2
// =====================

document.addEventListener("DOMContentLoaded", () => {
  const btnPerfil = document.getElementById("btnPerfil");
  const btnPedidos = document.getElementById("btnPedidos");
  const userDropdown = document.getElementById("userDropdown");
  const userNome = document.getElementById("userNome");
  const btnLogout = document.getElementById("btnLogout");

  // se não for essa página, não faz nada
  if (!btnPerfil) return;

  const token = getToken();

  if (token) {
    // LOGADO
    if (btnPedidos) btnPedidos.style.display = "flex";

    if (userNome) {
      const nome = localStorage.getItem("userName");
      userNome.textContent = nome || "Usuário";
    }
  }

  // toggle dropdown
  btnPerfil.addEventListener("click", () => {
    if (!getToken()) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "../login-usuarios/login.html";
      return;
    }

    if (userDropdown) {
      userDropdown.style.display =
        userDropdown.style.display === "none" ? "block" : "none";
    }
  });

  // logout
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      logout();
    });
  }
});



function toggleSenha() {
  const senhaInput = document.getElementById("senha");
  senhaInput.type = senhaInput.type === "password" ? "text" : "password";
}

let confirmCallback = null;

function abrirModal(mensagem, callback) {
  document.getElementById("modalMessage").innerText = mensagem;
  document.getElementById("modalOverlay").style.display = "flex";
  confirmCallback = callback;
}

function confirmarModal() {
  if (confirmCallback) {
    confirmCallback();
    confirmCallback = null;
  }
  fecharModal();
}

function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
  confirmCallback = null;
}



 // TOGGLE SENHA
    const senhaInput = document.getElementById("senha");
    const toggleIcon = document.getElementById("toggleSenhaIcon");

    toggleIcon.addEventListener("click", function () {
      if (senhaInput.type === "password") {
        senhaInput.type = "text";
        toggleIcon.src = "https://cdn-icons-png.flaticon.com/512/709/709586.png";
      } else {
        senhaInput.type = "password";
        toggleIcon.src = "https://cdn-icons-png.flaticon.com/512/709/709612.png";
      }
    });

    // FECHAR MODAL (caso use)
    function fecharModal() {
      document.getElementById("modalOverlay").style.display = "none";
    }