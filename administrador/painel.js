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
    const res = await fetch(API + "/pedidos",{
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
        await fetch(`${API}/pedidos/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ status })
        });
        carregarPedidos();
    } catch (err) { abrirModal("Erro ao atualizar status."); }
}

function deletarPedido(id) {
    abrirModal("Excluir pedido permanentemente?");
    const btn = document.getElementById("btnFecharModalAviso");
    btn.innerText = "Sim, Excluir";
    btn.style.background = "#dc3545";
    btn.style.color = "#fff";

    btn.onclick = async () => {
        const token = getToken();
        try {
            const res = await fetch(`${API}/pedidos/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) { fecharModal(); carregarPedidos(); }
        } catch (err) { abrirModal("Erro de conexão."); }
    };
}

// AUTO LOGIN
if(getToken()){
  iniciarPainel();
}