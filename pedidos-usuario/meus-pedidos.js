document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // Se não estiver logado
  if (!token) {
    window.location.href = "../login-usuarios/login.html";
    return;
  }

  carregarPedidos(token);
});

// ===============================
// BUSCAR PEDIDOS DO USUÁRIO
// ===============================
function carregarPedidos(token) {
  const lista = document.getElementById("listaPedidos");
  lista.innerHTML = "Carregando pedidos...";

  fetch("http://localhost:3000/pedidos/meus", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => {
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "../login-usuarios/login.html";
        throw new Error("Sessão expirada");
      }
      return res.json();
    })
    .then(response => {
      const pedidos = response.data;

      if (!pedidos || pedidos.length === 0) {
        lista.innerHTML = "<p>Nenhum pedido ou reserva encontrado.</p>";
        return;
      }

      lista.innerHTML = "";

      pedidos.forEach(pedido => {
        const div = document.createElement("div");
        div.className =
          pedido.tipo === "RESERVA" ? "pedido reserva" : "pedido";

        // ===============================
        // ITENS
        // ===============================
        let itensHTML = "";

        if (pedido.itens && pedido.itens.length > 0) {
          pedido.itens.forEach(item => {
            if (item.tamanhos) {
              Object.entries(item.tamanhos).forEach(([tam, qtd]) => {
                if (qtd > 0) {
                  itensHTML += `<li>${item.produto} - ${tam} × ${qtd}</li>`;
                }
              });
            }
          });
        } else {
          itensHTML = "<li>—</li>";
        }

        // ===============================
        // DADOS
        // ===============================
        const total = pedido.total
          ? `R$ ${Number(pedido.total).toFixed(2)}`
          : "—";

        const status = pedido.status || "pendente";

        const data = pedido.data
          ? new Date(pedido.data).toLocaleString()
          : "—";

        // ===============================
        // HTML
        // ===============================
        div.innerHTML = `
          <strong>Tipo:</strong> ${pedido.tipo}<br>
          <strong>ID:</strong> ${pedido.pedidoID}<br>
          <strong>Nome:</strong> ${pedido.nome}<br>
          <strong>Total:</strong> ${total}<br>
          <strong>Status:</strong> 
          <span class="status-${status}">${status}</span><br>
          <strong>Data:</strong> ${data}<br>
          ${pedido.tipo !== "RESERVA" ? `
          <strong>Endereço:</strong> ${pedido.endereco || "—"}<br>
          <strong>Número da casa:</strong> ${pedido.numeroCasa || "—"}<br>
          <strong>Referência:</strong> ${pedido.referencia || "—"}
          ` : ""}

          <div class="itens">
            <strong>Itens:</strong>
            <ul>${itensHTML}</ul>
          </div>

          ${(status === "pendente" || status === "aguardando")
          ? `<button class="btn-cancelar">Cancelar Pedido</button>`
          : ""}

          <button class="btn-ocultar">Excluir da minha conta</button>
          `;

        // ===============================
        // BOTÃO OCULTAR
        // ===============================
        
        const btnCancelar = div.querySelector(".btn-cancelar");

if (btnCancelar) {
  btnCancelar.onclick = () => {
    abrirModal("Cancelar este pedido?", () => {

      fetch(
        `http://localhost:3000/pedidos/${pedido.id}/cancelar`,
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer " + token
          }
        }
      )
       .then(data => {
     if (data.success) {
     // Abre como aviso (sem callback)
     abrirModal("Pedido cancelado com sucesso!");
     carregarPedidos(token);
     } else {
      // Joga o erro do back-end (Pedido não pode ser cancelado) no modal
      abrirModal(data.error || "O cancelamento só é permitido para pedidos com status 'Pendente' ou 'Aguardando'.");
     }
     })
        .catch(err => {
          console.error(err);
          alert("Erro ao conectar com o servidor");
        });

    });
  };
}
        
        const btnOcultar = div.querySelector(".btn-ocultar");

       btnOcultar.onclick = () => {
  abrirModal("Excluir este pedido da sua conta?", () => {

    fetch(
      `http://localhost:3000/pedidos/ocultar/${pedido.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    )
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          div.remove();
          abrirModal("Pedido excluido com sucesso!");
        } else {
          alert(data.error || "Erro ao ocultar pedido");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erro ao conectar com o servidor");
      });

  });
};

        lista.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      lista.innerHTML = "Erro ao carregar pedidos.";
    });
}

// ===============================
// BOTÃO VOLTAR
// ===============================
const btnVoltar = document.getElementById("btnVoltar");
if (btnVoltar) {
  btnVoltar.onclick = () => {
    window.location.href = "../Pagina2/index2.html";
  };
}

// Variável global para armazenar o que deve ser feito ao confirmar
let acaoAoConfirmar = null;

/**
 * Função para abrir o modal personalizado
 * @param {string} mensagem - O texto que aparecerá no modal
 * @param {function} callback - (Opcional) A função que será executada ao clicar em Confirmar
 */
function abrirModal(mensagem, callback = null) {
    const modal = document.getElementById("modalOverlay");
    const texto = document.getElementById("modalMessage");
    const btnConfirmar = modal.querySelector("button[onclick='confirmarModal()']");
    const btnFechar = modal.querySelector("button[onclick='fecharModal()']");

    if (modal && texto) {
        texto.innerText = mensagem;
        modal.style.display = "flex";
        acaoAoConfirmar = callback;

        if (callback) {
            // Se tem ação (pergunta), mostra o botão confirmar
            btnConfirmar.style.display = "inline-block";
            btnFechar.innerText = "Cancelar";
        } else {
            // Se não tem ação (aviso de erro), esconde o confirmar
            btnConfirmar.style.display = "none";
            btnFechar.innerText = "Fechar";
        }
    }
}

/**
 * Função chamada pelo botão "Confirmar" no HTML
 */
window.confirmarModal = function() {
    if (acaoAoConfirmar && typeof acaoAoConfirmar === "function") {
        acaoAoConfirmar(); // Executa o cancelamento ou exclusão que estava pendente
    }
    fecharModal(); // Fecha o modal após a ação
};

/**
 * Função chamada pelo botão "Cancelar" no HTML ou após confirmar
 */
window.fecharModal = function() {
    const modal = document.getElementById("modalOverlay");
    if (modal) {
        modal.style.display = "none";
        acaoAoConfirmar = null; // Limpa a ação pendente
    }
};