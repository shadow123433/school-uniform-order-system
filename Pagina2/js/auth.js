// js/auth.js

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : ""; // Em produção (Render), usa o próprio domínio do site

export const Auth = {
    getToken() {
        return localStorage.getItem("token");
    },

    setToken(token) {
        localStorage.setItem("token", token);
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("pedidosBadge");
        
        // Note: as funções de UI (atualizarMenu, showToast) 
        // serão tratadas pelo arquivo principal que importar este módulo.
    },

    isLogged() {
        return !!this.getToken();
    }
};

/**
 * Função global para requisições autenticadas
 */
export async function apiFetch(url, options = {}) {
    const token = Auth.getToken();

    options.headers = {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
    };

    const res = await fetch(API_URL + url, options);

    if (res.status === 401) {    //credenciais inválidas ou token expirado
        Auth.logout();
        // Se não estiver autorizado, redireciona para o login
        window.location.href = "/login-usuarios/login.html";
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
    }

    return res;
}