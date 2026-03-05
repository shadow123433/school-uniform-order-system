const API_URL = "http://localhost:3000";

// =====================
// UTILITÁRIOS (TOKEN)
// =====================
const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "/login-usuarios/login.html";
}

// =====================
// FUNÇÕES DO MODAL
// =====================
function abrirModal(mensagem) {
    const modal = document.getElementById('modalOverlay'); 
    const texto = document.getElementById('modalMessage');
    
    if (modal && texto) {
        texto.innerText = mensagem;
        modal.style.display = 'flex';
    } else {
        alert(mensagem); // Fallback caso o HTML do modal não exista na página
    }
}

function fecharModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'none';
}

// =====================
// LOGIN 
// =====================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("email");
        const senhaInput = document.getElementById("senha");

        emailInput.classList.remove('input-error');
        senhaInput.classList.remove('input-error');

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: emailInput.value.trim(), 
                    senha: senhaInput.value.trim() 
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    emailInput.classList.add('input-error');
                    senhaInput.classList.add('input-error');
                    abrirModal("E-mail ou senha incorretos.");
                } else if (res.status === 404) {
                    emailInput.classList.add('input-error');
                    abrirModal("Este e-mail não está cadastrado.");
                } else {
                    abrirModal(data.error || "Erro ao realizar login.");
                }
                return;
            }

            // SUCESSO
            setToken(data.token);
            const nomeExibicao = (data.user && data.user.nome) || data.nome || "Usuário";
            
            if (data.user) {
                localStorage.setItem("userName", data.user.nome);
                localStorage.setItem("userEmail", data.user.email);
            }

            // AVISO PARA A PÁGINA 2: Abrir checkout automaticamente
            localStorage.setItem("abrirModalCheckout", "true");

            abrirModal(`Bem-vindo de volta, ${nomeExibicao}! Redirecionando para o seu pedido...`);

            setTimeout(() => {
                const redirect = sessionStorage.getItem("redirectAfterLogin");
                window.location.href = redirect ? redirect : "../Pagina2/index2.html";
                if(redirect) sessionStorage.removeItem("redirectAfterLogin");
            }, 1500);

        } catch (err) {
            console.error("Erro:", err);
            abrirModal("Erro na comunicação com o servidor.");
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
        
        const nomeInput = document.getElementById("nome");
        const emailInput = document.getElementById("email");
        const senhaInput = document.getElementById("senha");

        nomeInput.classList.remove('input-error');
        emailInput.classList.remove('input-error');
        senhaInput.classList.remove('input-error');

        const nomeValor = nomeInput.value.trim();
        const regexNomeReal = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;

        if (!regexNomeReal.test(nomeValor)) {
            nomeInput.classList.add('input-error');
            abrirModal("Por favor, digite seu nome completo (Nome e Sobrenome).");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    nome: nomeValor, 
                    email: emailInput.value.trim(), 
                    senha: senhaInput.value.trim() 
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const erroMsg = data.error ? data.error.toLowerCase() : "";
                if (res.status === 409 || erroMsg.includes("email")) emailInput.classList.add('input-error');
                if (erroMsg.includes("nome")) nomeInput.classList.add('input-error');
                if (erroMsg.includes("senha")) senhaInput.classList.add('input-error');
                abrirModal(data.error || "Erro ao cadastrar.");
                return;
            }

            // SUCESSO
            setToken(data.token);
            if (data.user) {
                localStorage.setItem("userName", data.user.nome);
                localStorage.setItem("userEmail", data.user.email);
            }

            // AVISO PARA A PÁGINA 2: Abrir checkout automaticamente
            localStorage.setItem("abrirModalCheckout", "true");

            abrirModal(`Conta criada! Bem-vindo, ${nomeValor}. Vamos finalizar seu pedido?`);

            setTimeout(() => {
                window.location.href = "../Pagina2/index2.html";
            }, 1500);

        } catch (err) {
            abrirModal("Erro ao conectar com o servidor.");
        }
    });
}

// =====================
// CONTROLE DA PAGINA 2 E EVENTOS GERAIS
// =====================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Lógica do Dropdown e Perfil
    const btnPerfil = document.getElementById("btnPerfil");
    const userNome = document.getElementById("userNome");
    const btnPedidos = document.getElementById("btnPedidos");
    const userDropdown = document.getElementById("userDropdown");

    if (btnPerfil) {
        const token = getToken();
        if (token) {
            if (btnPedidos) btnPedidos.style.display = "flex";
            if (userNome) userNome.textContent = localStorage.getItem("userName") || "Usuário";
        }

        btnPerfil.addEventListener("click", () => {
            if (!getToken()) {
                sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
                window.location.href = "../login-usuarios/login.html";
                return;
            }
            if (userDropdown) {
                userDropdown.style.display = userDropdown.style.display === "none" ? "block" : "none";
            }
        });
    }

  const toggleIcon = document.getElementById("toggleSenhaIcon");
const senhaInput = document.getElementById("senha");

// Ícones Estáveis (Icons8 - Material Design)
const OLHO_ABERTO = "https://img.icons8.com/material-outlined/24/000000/visible.png";
const OLHO_COM_TRACO = "https://img.icons8.com/material-outlined/24/000000/invisible.png";

if (toggleIcon && senhaInput) {
    toggleIcon.addEventListener("click", function () {
        if (senhaInput.type === "password") {
            // Ação: Mostrar Senha
            senhaInput.type = "text";
            this.src = OLHO_ABERTO; // Fica o olho aberto
        } else {
            // Ação: Esconder Senha
            senhaInput.type = "password";
            this.src = OLHO_COM_TRACO; // Fica o olho com o traço
        }
    });
}

    // 3. Remover erro ao digitar
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('input-error'));
    });
});