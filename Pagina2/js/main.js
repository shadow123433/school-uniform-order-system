// js/main.js

import { PedidoService } from './api.js';
import { Auth, apiFetch } from './auth.js';
import { produtosPorEscola } from './produtos.js';
import { 
    carregarCarrinho, 
    salvarCarrinho, 
    addCarrinho, 
    removerItem 
} from './carrinho.js';
import { 
    showToast, 
    abrirModal, 
    fecharModal, 
    lightbox, 
    lightboxImg, 
    fecharLightbox, 
    resetLightbox, 
    configurarZoom 
} from './ui.js';
import { 
    abrirModalReserva, 
    fecharModalReserva, 
    confirmarReserva, 
    verificarReservaSalva,
    validarAcesso 
} from './reserva.js';

/* =========================
   ELEMENTOS FIXOS (DO SEU ORIGINAL)
========================= */
const container = document.querySelector(".container");
const finalizarBtn = document.querySelector(".finalizar");
const botoesEscola = document.querySelectorAll(".escola-card button");
const secaoEscolas = document.querySelector(".escolas");
const pedidoForm = document.getElementById("pedido-form");
const pedidoLoading = document.getElementById("pedido-loading");
const pedidoConfirmado = document.getElementById("pedido-confirmado");
const pedidoIdSpan = document.getElementById("pedidoId");

const carrinhoContainer = document.getElementById("carrinhoContainer");
const totalValor = document.getElementById("totalValor");

// ELEMENTOS DO MENU
const navLogin = document.getElementById("navLogin");
const navPedidos = document.getElementById("navPedidos");
const navLogout = document.getElementById("navLogout");
const btnLogoutNav = document.getElementById("btnLogoutNav");

/* =========================
   LÓGICA DE PEDIDOS
========================= */
function gerarPedidoID() {
  return "PED-" + Date.now().toString().slice(-6);
}

// Criar seção de produtos dinamicamente
const produtosSec = document.createElement("section");
produtosSec.className = "produtos";
produtosSec.id = "secao-produtos";
produtosSec.style.display = "none";
produtosSec.innerHTML = `
  <h2>Uniformes disponíveis</h2>
  <div class="produtos-grid"></div>
  <button class="botao-voltar" id="fecharProdutos">← Voltar para escolas</button>
`;
container.insertBefore(produtosSec, document.querySelector(".carrinho"));
const produtosGrid = produtosSec.querySelector(".produtos-grid");

/* =========================
   FUNÇÕES DE INTERFACE (ADAPTADAS DO ORIGINAL)
========================= */
function atualizarMenu() {
  if (Auth.isLogged()) {
    navLogin.style.display = "none";
    navPedidos.style.display = "block";
    navLogout.style.display = "block";
  } else {
    navLogin.style.display = "block";
    navPedidos.style.display = "none";
    navLogout.style.display = "none";
  }
}

function atualizarCarrinho() {
  carrinhoContainer.innerHTML = "";
  window.carrinho.forEach(item => {
    Object.entries(item.tamanhos).forEach(([tamanho, qtd]) => {
      const linha = document.createElement("div");
      linha.className = "linha-carrinho";
      linha.innerHTML = `
        <span>• ${item.produto} (${tamanho} × ${qtd})</span>
        <button class="btn-remover" data-produto="${item.produto}" data-tamanho="${tamanho}">✖</button>
      `;
      carrinhoContainer.appendChild(linha);
    });
  });

  document.querySelectorAll(".btn-remover").forEach(btn => {
    btn.onclick = e => removerItem(e.target.dataset.produto, e.target.dataset.tamanho, atualizarCarrinho, abrirModal);
  });
  totalValor.textContent = window.total.toFixed(2);
}

function mostrarProdutos(escola) {
  produtosGrid.innerHTML = "";
  produtosPorEscola[escola].forEach(produto => {
    const card = document.createElement("div");
    card.className = "produto-card";
    card.innerHTML = `
      <img src="${produto.imagem}" class="produto-img">
      <strong>${produto.nome}</strong>
      <select>
        <option value="">Tamanhos</option>
        ${produto.tamanhos.map(t => `<option>${t}</option>`).join("")}
      </select>
      <div class="preco">R$ ${produto.preco.toFixed(2)}</div>
      <button>Adicionar</button>
    `;

    card.querySelector("img").onclick = () => {
      lightboxImg.src = produto.imagem;
      lightbox.style.display = "flex";
      document.body.style.overflow = "hidden";
      resetLightbox();
    };

    card.querySelector("button").onclick = () => {
      const select = card.querySelector("select");
      const tamanho = select.value;
      if (!tamanho) {
        abrirModal("Selecione um tamanho");
        select.classList.add("tamanho-destaque");
        setTimeout(() => select.classList.remove("tamanho-destaque"), 3000);
        return;
      }
      addCarrinho(produto.id, tamanho, produto.preco, atualizarCarrinho, abrirModal);
    };
    produtosGrid.appendChild(card);
  });

  secaoEscolas.style.display = "none";
  produtosSec.style.display = "block";
  produtosSec.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================
   MODAL DE FINALIZAÇÃO (ESTRUTURA ORIGINAL)
========================= */
const modal = document.createElement("div");
modal.className = "modal-overlay";
modal.style.display = "none";
modal.innerHTML = `
  <div class="modal">
    <h2>Confirmação de entrega</h2>
    <input id="nome" placeholder="Nome completo">
    <input id="endereco" placeholder="Rua / Avenida">
    <input id="numero" placeholder="Número da casa" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
    <input id="referencia" placeholder="Ponto de referência">
    <div>
      <button id="cancelar">Cancelar pedido</button>
      <button id="confirmar">Enviar pedido</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

/* =========================
   EVENTOS E FINALIZAÇÃO
========================= */
finalizarBtn.onclick = () => {
    // Usamos a função mestre do reserva.js que você já criou
    if (validarAcesso()) {
        modal.style.display = "flex";
    }
};

modal.querySelector("#cancelar").onclick = () => modal.style.display = "none";

modal.querySelector("#confirmar").onclick = () => {
    const nome = document.getElementById("nome").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const referencia = document.getElementById("referencia").value.trim();
    const pedidoID = gerarPedidoID();

    if (!nome || !endereco || !numero) return showToast("Preencha os campos obrigatórios");

    const totalCalculado = window.carrinho.reduce((acc, item) => {
        return acc + Object.values(item.tamanhos).reduce((sum, qtd) => sum + qtd * item.precoUnitario, 0);
    }, 0);

    const pedido = {
        tipo: "PEDIDO",
        pedidoID,
        nome,
        endereco,
        numeroCasa: numero,
        referencia,
        itens: window.carrinho,
        total: totalCalculado,
        data: new Date().toISOString()
    };

    modal.style.display = "none";
    pedidoForm.style.display = "none";
    pedidoLoading.style.display = "block";

    // CHAMADA DA API VIA SERVIÇO
    PedidoService.enviar(pedido)
    .then(() => {
        pedidoLoading.style.display = "none";

        const modalSucesso = document.createElement("div");
        modalSucesso.id = "reserva-confirmada"; 
        modalSucesso.innerHTML = `
            <h2>Pedido confirmado ✅</h2>
            <p>Número do pedido: <strong>#${pedidoID}</strong></p>
            <p>Status: <strong>Recebido</strong></p>
            <p>A loja já recebeu seu pedido e irá processá-lo.</p>
            <button id="fecharPedidoModal">Fechar</button>
        `;

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.style.display = "flex"; 
        
        document.body.appendChild(overlay);
        overlay.appendChild(modalSucesso);

        document.getElementById("fecharPedidoModal").onclick = () => {
            overlay.remove();
            
            // Limpeza dos campos
            ["nome", "endereco", "numero", "referencia"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });

            window.carrinho = [];
            window.total = 0;
            localStorage.removeItem("carrinho");
            localStorage.removeItem("total");
            sessionStorage.removeItem("pedidoConfirmado");
            
            if (pedidoForm) pedidoForm.style.display = "block";
            if (secaoEscolas) secaoEscolas.style.display = "block";
            if (produtosSec) produtosSec.style.display = "none";
            
            atualizarCarrinho();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        localStorage.setItem("pedidosBadge", "1");
    })
    .catch(err => {
        console.error(err);
        pedidoLoading.style.display = "none";
        pedidoForm.style.display = "block";
        abrirModal("Erro ao enviar pedido.");
    });
};

/* =========================
   INICIALIZAÇÃO (DOMContentLoaded)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicializa estados básicos e recupera dados
  atualizarMenu();
  carregarCarrinho(atualizarCarrinho);
  configurarZoom();
  
  // Importante: Verifica se há uma reserva ativa no sessionStorage ao recarregar
  if (typeof verificarReservaSalva === "function") {
    verificarReservaSalva();
  }

 
 // --- CORREÇÃO: Modal de Aviso (SÓ FECHA NO BOTÃO) ---
  const btnFecharAviso = document.getElementById("btnFecharModalAviso");
  if (btnFecharAviso) {
      btnFecharAviso.onclick = fecharModal;
  }

  // Removida a lógica que fechava ao clicar no modalOverlay (fundo escuro)
  // Agora, mesmo que o usuário clique fora, o aviso continuará na tela.

  // --- LOGICA DE RESERVA (Conexão com reserva.js) ---
  const btnReservar = document.querySelector(".reservar");
  if (btnReservar) {
      btnReservar.onclick = () => {
          // A função abrirModalReserva já checa login e carrinho vazio internamente
          abrirModalReserva(); 
      };
  }

  const btnCancelarReserva = document.getElementById("cancelarReserva");
  if (btnCancelarReserva) {
      btnCancelarReserva.onclick = fecharModalReserva;
  }

  const btnConfirmarReserva = document.getElementById("confirmarReserva");
  if (btnConfirmarReserva) {
      btnConfirmarReserva.onclick = () => {
          // Passamos atualizarCarrinho como callback para limpar a tela após o sucesso
          confirmarReserva(atualizarCarrinho);
      };
  }

  // --- EVENTOS DE INTERFACE ---
  
  // Cliques nas escolas
  botoesEscola.forEach(btn => btn.onclick = () => mostrarProdutos(btn.dataset.escola));
  
  // Botão voltar das escolas
  const btnFecharProdutos = document.getElementById("fecharProdutos");
  if (btnFecharProdutos) {
    btnFecharProdutos.onclick = () => {
      produtosSec.style.display = "none";
      secaoEscolas.style.display = "block";
    };
  }

  // Fechar Lightbox
  if (fecharLightbox) {
    fecharLightbox.onclick = () => {
      lightbox.style.display = "none";
      document.body.style.overflow = "auto";
    };
  }

  // Logout no Menu
  if (btnLogoutNav) {
    btnLogoutNav.onclick = () => {
      Auth.logout();
      atualizarMenu();
      abrirModal("Você saiu da conta");
    };
  }

 // --- REDIRECIONAMENTOS E RESTAURAÇÃO DE PEDIDOS ---

  // 1. Lógica do Bilhete (Abre o modal automaticamente após Login/Registro)
  const checkoutAviso = localStorage.getItem("abrirModalCheckout");
  
  if (checkoutAviso === "true") {
      // Limpa o bilhete para não abrir de novo no F5
      localStorage.removeItem("abrirModalCheckout");

      // Verifica se está logado e se o carrinho tem algo
      if (Auth.isLogged() && window.carrinho && window.carrinho.length > 0) {
          // 'modal' é a variável que você criou lá em cima no main.js
          modal.style.display = "flex"; 
      }
  }

  // 2. Restaurar modal de Pedido Confirmado (Venda Direta)
  const pedidoSalvo = sessionStorage.getItem("pedidoConfirmado");
  if (pedidoSalvo && Auth.isLogged()) {
    const dadosPedido = JSON.parse(pedidoSalvo);
    if (pedidoForm) pedidoForm.style.display = "none";
    
    const pedidoModalConfirmacao = document.getElementById("pedido-modal-confirmacao");
    const pedidoIdModal = document.getElementById("pedidoIdModal");
    if (pedidoModalConfirmacao && pedidoIdModal) {
        pedidoIdModal.textContent = dadosPedido.pedidoID;
        pedidoModalConfirmacao.style.display = "flex";
    }
  }
});