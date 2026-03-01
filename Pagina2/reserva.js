/* =========================
   RESERVA.JS
========================= */
document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // ELEMENTOS
  // =========================
  const reservarBtn = document.querySelector(".reservar");
  const modal = document.getElementById("modalReserva");
  const nomeInput = document.getElementById("nomeReserva");
  const cancelarBtn = document.getElementById("cancelarReserva");
  const confirmarBtn = document.getElementById("confirmarReserva");

  const pedidoForm = document.getElementById("pedido-form");
  const pedidoLoading = document.getElementById("pedido-loading");

  // Criar modal de confirmação (se ainda não existir)
  let reservaConfirmada = document.getElementById("reserva-confirmada");
  if (!reservaConfirmada) {
    reservaConfirmada = document.createElement("section");
    reservaConfirmada.id = "reserva-confirmada";
    Object.assign(reservaConfirmada.style, {
      display: "none",
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "30px 40px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      borderRadius: "12px",
      zIndex: "9999",
      textAlign: "left",
      maxWidth: "400px",
      width: "90%",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "#222",
    });
    reservaConfirmada.innerHTML = `
      <h2 style="margin-top:0; margin-bottom: 15px;">Reserva confirmada ✅</h2>
      <p>
        Número da reserva: <strong>#<span id="reservaId"></span></strong>
      </p>
      <p>Status: <strong><span id="reservaStatus">Aguardando</span></strong></p>
      <p>Sua reserva foi recebida pela loja e está sujeita à confirmação.</p>
      <button id="fecharReservaBtn" style="
        margin-top: 25px;
        padding: 10px 30px;
        font-weight: 600;
        background: linear-gradient(135deg, #27ae60, #219150);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 6px 12px rgba(33, 145, 80, 0.4);
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
        user-select: none;
      ">Fechar</button>
    `;
    document.body.appendChild(reservaConfirmada);
  }

  const reservaIdSpan = document.getElementById("reservaId");
  const reservaStatusSpan = document.getElementById("reservaStatus");
  const fecharReservaBtn = document.getElementById("fecharReservaBtn");

  // =========================
  // FUNÇÕES
  // =========================
  function gerarReservaID() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 90 + 10); // 2 dígitos
    return `RES-${timestamp}${random}`;
  }

  // Toast simples
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // =========================
  // ABRIR MODAL RESERVA
  // =========================
 reservarBtn.onclick = () => {
  // Verifica se o usuário está logado
  const token = localStorage.getItem("token");

if (!token) {

    // Mostra alerta
    abrirModal("Faça login para prosseguir com a reserva.");

    // 🔴 BOTÃO DE LOGIN DO MENU FLUTUANTE
    const btnLoginMenu = document.getElementById("btnLoginMenu");

    if (btnLoginMenu) {
      btnLoginMenu.classList.add("pulsar-login");

      // remove a animação após 3 segundos
      setTimeout(() => {
        btnLoginMenu.classList.remove("pulsar-login");
      }, 3000);
    }

    return; // bloqueia reserva
  }

  // Verifica se o carrinho está vazio
  if (!window.carrinho || window.carrinho.length === 0) {
    abrirModal("Adicione itens ao carrinho antes de reservar");
    return;
  }

  // Abre modal normalmente
  modal.style.display = "flex";
};




  // =========================
  // FECHAR MODAL RESERVA
  // =========================
  cancelarBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // =========================
  // CONFIRMAR RESERVA
  // =========================
  confirmarBtn.addEventListener("click", () => {
    const nome = nomeInput.value.trim();
    if (!nome) {
      showToast("Preencha o nome para confirmar a reserva");
      return;
    }

    const reservaID = gerarReservaID();
    reservaIdSpan.textContent = reservaID;
    reservaStatusSpan.textContent = "Aguardando";

    // Mostrar carregando e esconder formulário modal reserva
    modal.style.display = "none";
    pedidoForm.style.display = "none";
    pedidoLoading.style.display = "block";

   // Calcula total real da reserva a partir do carrinho
let totalCalculado = 0;
for (const item of window.carrinho) {
const preco = item.precoUnitario;
  if (!preco) continue;
  for (const qtd of Object.values(item.tamanhos)) {
    totalCalculado += Number(qtd || 0) * preco;
  }
}

const reserva = {
  tipo: "RESERVA",
  pedidoID: reservaID,
  nome,
  itens: window.carrinho,
  total: totalCalculado,   // <- envia o total real
  data: new Date().toISOString()
};

    const token = localStorage.getItem("token");

    if (!token) {
      abrirModal("Você precisa estar logado para fazer uma reserva.");
      window.location.href = "login.html";
      return;
    }

    fetch("http://localhost:3000/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(reserva)
    })
    .then(async res => {
      if (!res.ok) {
        const erro = await res.json();
        abrirModal("Erro ao salvar reserva: " + (erro.error || "Erro desconhecido"));
        throw new Error(erro.error || "Erro desconhecido");
      }
      return res.json();
    })
   .then(() => {
  pedidoLoading.style.display = "none";
  reservaConfirmada.style.display = "block";

  // 🔴 MOSTRA BADGE IMEDIATAMENTE (MESMA LÓGICA DO PEDIDO)
  localStorage.setItem("pedidosBadge", "1");

  sessionStorage.setItem(
    "reservaConfirmada",
    JSON.stringify({ reservaID })
  );
})

    .catch((err) => {
      console.error(err);
      abrirModal("Erro ao conectar com o servidor");
      pedidoLoading.style.display = "none";
      pedidoForm.style.display = "block";
    });
  });

  // =========================
  // FUNÇÃO PARA REINICIAR ESTADO E LIMPAR TUDO
  // =========================
  function resetTudo() {
    window.carrinho = [];
    window.total = 0;
    if (typeof atualizarCarrinho === "function") atualizarCarrinho();
    reservaConfirmada.style.display = "none";
    pedidoForm.style.display = "block";
    pedidoLoading.style.display = "none";
    sessionStorage.removeItem("reservaConfirmada");
    nomeInput.value = "";
  }

  // =========================
  // EVENTO FECHAR MODAL CONFIRMAÇÃO
  // =========================
  fecharReservaBtn.addEventListener("click", () => {
    resetTudo();
  });

  // =========================
  // RECUPERAR CONFIRMAÇÃO AO RECARREGAR
  // =========================
  const reservaSalva = sessionStorage.getItem("reservaConfirmada");
  if (reservaSalva) {
    const { reservaID } = JSON.parse(reservaSalva);
    sessionStorage.removeItem("reservaConfirmada");

    pedidoForm.style.display = "none";
    pedidoLoading.style.display = "none";
    reservaConfirmada.style.display = "block";
    reservaIdSpan.textContent = reservaID;
    reservaStatusSpan.textContent = "Aguardando";
  }

});


function abrirModal(mensagem) {
  document.getElementById("modalMessage").innerText = mensagem;
  document.getElementById("modalOverlay").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalOverlay").style.display = "none";
}