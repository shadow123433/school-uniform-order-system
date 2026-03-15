const URL_ADMIN = (
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1"
) 
? "http://localhost:3000" 
: "https://school-uniform-order-system.onrender.com";

// Garante que o console nos diga onde estamos conectando
console.log("Painel conectando em:", URL_ADMIN);

// Elementos do DOM
const loginBox = document.getElementById("loginBox");
const painel = document.getElementById("painel");
const listaPedidos = document.getElementById("listaPedidos");

let intervaloPedidos = null;

function iniciarPainel(){
  loginBox.style.display="none";
  painel.style.display="block";

  carregarPedidos();
  
  if(intervaloPedidos) clearInterval(intervaloPedidos);
  intervaloPedidos = setInterval(carregarPedidos, 5000);
}

async function carregarPedidos(){
  const token = getToken();
  if(!token) return;

  try {
    const res = await fetch(URL_ADMIN + "/pedidos",{
      headers:{ "Authorization":"Bearer " + token }
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    const response = await res.json();
    const pedidos = Array.isArray(response) ? response : (response.data || []);

    listaPedidos.innerHTML = "";

    if (pedidos.length === 0) {
      listaPedidos.innerHTML = "<p style='text-align:center; padding:20px; color:#666;'>Nenhum pedido encontrado.</p>";
      return;
    }

    pedidos.forEach(p => {
      let itensHtml = "";
      if (p.itens) {
        p.itens.forEach(item => {
          if (item.tamanhos) {
            for (const [tam, qtd] of Object.entries(item.tamanhos)) {
              itensHtml += `<div>• ${item.produto} (${tam} x ${qtd})</div>`;
            }
          }
        });
      }

      const acaoTexto = p.tipo === "RESERVA" ? "Marcar como retirado" : "Marcar como pago";
      const novoStatus = p.tipo === "RESERVA" ? "retirado" : "pago";

    const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="grid">
          <div><div class="label">ID do Pedido</div><div class="value">${p.pedidoID || p.id}</div></div>
          <div><div class="label">Tipo</div><div class="value">${p.tipo}</div></div>
          <div><div class="label">Status</div><div class="status ${p.status}">${p.status}</div></div>
          <div><div class="label">Nome</div><div class="value">${p.nome}</div></div>
          <div><div class="label">Total</div><div class="value">R$ ${Number(p.total).toFixed(2)}</div></div>
          <div><div class="label">Data</div><div class="value">${p.data ? new Date(p.data).toLocaleString("pt-BR") : "-"}</div></div>
          ${p.tipo !== "RESERVA" ? `
          <div><div class="label">Endereço</div><div class="value">${p.endereco || "-"}</div></div>
          <div><div class="label">Número da casa</div><div class="value">${p.numeroCasa || "-"}</div></div>
          <div><div class="label">Referência</div><div class="value">${p.referencia || "-"}</div></div>
          ` : ""}
        </div>
        <div class="itens">${itensHtml}</div>
        <div class="acoes">
          ${p.status === "cancelado_cliente" 
            ? `<span style="color:#dc3545;font-weight:bold;">Cancelado pelo cliente</span>`
            : `
              ${(p.status === "pendente" || p.status === "aguardando")
                ? `<button class="btn btn-success" onclick="alterarStatus(${p.id}, '${novoStatus}')">${acaoTexto}</button>`
                : ""
              }
              <button class="btn btn-delete" onclick="deletarPedido(${p.id})">Excluir</button>
            `
          }
        </div>
      `;
      listaPedidos.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
  }
}

/* MODAL E AÇÕES */
function abrirModal(mensagem) {
    document.getElementById("modalMessage").innerText = mensagem;
    document.getElementById("modalOverlay").style.display = "flex";
}

function fecharModal() {
    const modal = document.getElementById("modalOverlay");
    const btn = document.getElementById("btnFecharModalAviso");
    modal.style.display = "none";
    btn.onclick = fecharModal;
}

async function alterarStatus(id, status){
    const token = getToken();
    try {
        await fetch(`${URL_ADMIN}/pedidos/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ status })
        });
        carregarPedidos();
    } catch (err) { abrirModal("Erro ao atualizar status."); }
}

async function deletarPedido(id) {
    // 1. Configura e abre o modal para confirmação
    const btnAcao = document.getElementById("btnConfirmarAcao");
    const msg = document.getElementById("modalMessage");
    
    msg.innerText = "Tem certeza que deseja excluir este pedido permanentemente?";
    
    // Configura o botão de exclusão
    btnAcao.innerText = "Sim, Excluir";
    btnAcao.style.background = "#dc3545"; 
    btnAcao.style.color = "#fff";
    btnAcao.style.display = "inline-block";
    btnAcao.disabled = false; // Garante que comece habilitado

    // Abre o modal (exibe o overlay)
    document.getElementById("modalOverlay").style.display = "flex";

    // 2. Define o clique de exclusão
    btnAcao.onclick = async () => {
        const token = getToken();
        btnAcao.disabled = true; // Evita cliques repetidos
        btnAcao.innerText = "Excluindo...";

        try {
            const res = await fetch(`${URL_ADMIN}/pedidos/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });

            if (res.ok) { 
                fecharModal(); 
                carregarPedidos(); 
            } else {
                // Em caso de erro do servidor, altera o modal ATUAL em vez de abrir outro
                exibirErroNoModal("Erro ao excluir o pedido no servidor.");
            }
        } catch (err) { 
            console.error(err);
            // Em caso de conexão, altera o modal ATUAL
            exibirErroNoModal("Erro de conexão. Tente novamente.");
        }
    };
}

// Função auxiliar para transformar o modal de confirmação em um modal de erro
function exibirErroNoModal(mensagem) {
    const msg = document.getElementById("modalMessage");
    const btnAcao = document.getElementById("btnConfirmarAcao");
    
    msg.innerText = mensagem;
    msg.style.color = "#b91c1c"; // Texto em vermelho para destaque
    
    // Transforma o botão de excluir em um botão de "Entendi" que apenas fecha
    btnAcao.innerText = "Entendi";
    btnAcao.style.background = "#6b7280"; // Cinza
    btnAcao.disabled = false;
    btnAcao.onclick = fecharModal; 
}

function fecharModal() {
    document.getElementById("modalOverlay").style.display = "none";
    // Resetar a cor da mensagem para o padrão quando fechar
    document.getElementById("modalMessage").style.color = "#4b5563";
}

// AUTO LOGIN
if(getToken()){
  iniciarPainel();
}