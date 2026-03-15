// Substitua as primeiras linhas por isso:
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://school-uniform-order-system.onrender.com"; // Coloque sua URL real aqui
    
// =====================
// UTILITÁRIOS (TOKEN)
// =====================
const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);

function logout() {
    abrirModal("Token expirado, faça login novamente", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        window.location.href = "/login-usuarios/login.html";
    });
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
                emailInput.classList.remove('input-error');
                senhaInput.classList.remove('input-error');

                // Se o status for 401 e a mensagem indicar que a conta sumiu, desloga na hora
                if (res.status === 401 && data.error && data.error.includes("inexistente")) {
                    abrirModal("Sua conta não foi encontrada. Você será desconectado.", () => {
                        logout(); 
                    });
                    return;
                }

                if (res.status === 404) {
                    emailInput.classList.add('input-error');
                } else if (res.status === 401) {
                    senhaInput.classList.add('input-error');
                } else {
                    emailInput.classList.add('input-error');
                }

                const mensagemFinal = data.error || data.message || "Erro ao realizar login.";
                abrirModal(mensagemFinal);
                console.error(`[${res.status}] Erro no login:`, data.error);
                return;
            }

            // =====================
            // SUCESSO
            // =====================
            setToken(data.token);
            
            // Pegamos o nome que agora vem dentro de data.user
            const nomeExibicao = data.user?.nome || "Usuário";

            localStorage.setItem("userName", nomeExibicao);
            localStorage.setItem("userEmail", data.user?.email || "");

            // Aviso para o Checkout na Página 2
            localStorage.setItem("abrirModalCheckout", "true");

            abrirModal(`Bem-vindo de volta, ${nomeExibicao}! Redirecionando...`);

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
        const senhaValor = senhaInput.value.trim();
        const regexNomeReal = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;
        const possuiTresNumeros = (senhaValor.match(/\d/g) || []).length >= 3;

        // Avisos no console para sabermos que o Front detectou, mas vai deixar o HTTP 400 acontecer
        if (!regexNomeReal.test(nomeValor)) {
            console.warn("Validação local: Nome incompleto, enviando para gerar erro 400.");
        }

        if (senhaValor.length < 6 || !possuiTresNumeros) {
            console.warn("Validação local: Senha fraca, enviando para gerar erro 400.");
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

                // Marca o campo de e-mail se o erro for duplicata (409) ou domínio inválido
                if (res.status === 409 || erroMsg.includes("email") || erroMsg.includes("gmail")) {
                    emailInput.classList.add('input-error');
                }
                
                // Marca o campo de nome se o erro vier do backend (400) ou contiver "nome"
                if (res.status === 400 && erroMsg.includes("nome")) {
                    nomeInput.classList.add('input-error');
                }
                
                if (erroMsg.includes("senha")) {
                    senhaInput.classList.add('input-error');
                }

                // Exibe a mensagem exata definida no backend (ex: "Digite seu nome completo")
                abrirModal(data.error || "Erro ao cadastrar.");
                console.error(`[${res.status}] Erro no cadastro:`, data.error);
                
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