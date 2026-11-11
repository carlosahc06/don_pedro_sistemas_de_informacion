import { App } from "./app-core.js";
import { Data } from "./data/api.js";
import { StoreError } from "./data/errors.js";
import { UI } from "./state.js";
import { formatMoney, escapeHtml } from "./utils/format.js";
import { metricCard, showToast } from "./components/helpers.js";

Object.assign(App, {
  async handleClick(event) {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      this.navigate(nav.dataset.view);
      return;
    }
    const element = event.target.closest("[data-action]");
    if (!element) return;
    const action = element.dataset.action;
    if (action === "backdrop-close" && event.target !== element) return;
    try {
      switch (action) {
        case "open-table": {
          const table = this.state.tables.find((entry) => entry.id === Number(element.dataset.id));
          if (table.status === "occupied") this.navigate("cocina");
          else this.openTableModal(table);
          break;
        }
        case "choose-table": this.openTableModal(); break;
        case "close-modal":
        case "backdrop-close": this.closeModal(); break;
        case "diners-change": {
          UI.modalDiners = Math.min(20, Math.max(1, UI.modalDiners + Number(element.dataset.delta)));
          document.querySelector("#diners-number").textContent = UI.modalDiners;
          break;
        }
        case "confirm-table": {
          const id = Number(document.querySelector("#modal-table").value);
          const table = this.state.tables.find((entry) => entry.id === id && entry.status === "free");
          if (!table) throw new StoreError("La mesa ya no está disponible.");
          UI.selectedTable = { id: table.id, number: table.number, diners: UI.modalDiners };
          this.closeModal();
          this.navigate("pedido");
          showToast("Mesa seleccionada", `Mesa ${table.number} • ${UI.modalDiners} comensales`);
          break;
        }
        case "filter-category": UI.category = element.dataset.category; this.render(); break;
        case "add-product": this.changeCart(Number(element.dataset.id), 1); break;
        case "cart-change": this.changeCart(Number(element.dataset.id), Number(element.dataset.delta)); break;
        case "remove-line": delete UI.cart[Number(element.dataset.id)]; this.render(); break;
        case "review-order": this.validateCart(); UI.view = "confirmacion"; this.render(); window.scrollTo({ top: 0, behavior: "smooth" }); break;
        case "back-menu": UI.view = "pedido"; this.render(); break;
        case "send-order": await this.sendOrder(element); break;
        case "go-tables": this.closeModal(); this.navigate("mesas"); break;
        case "go-kitchen": this.closeModal(); this.navigate("cocina"); break;
        case "refresh": await this.refresh(); showToast("Vista actualizada", "Se cargaron los datos más recientes."); break;
        case "kitchen-filter": UI.kitchenFilter = element.dataset.filter; this.render(); break;
        case "toggle-item": await this.perform(element, async () => {
          await Data.updateOrderItem(Number(element.dataset.order), Number(element.dataset.item), element.dataset.ready === "true");
          await this.refresh();
        }); break;
        case "priority": await this.perform(element, async () => {
          await Data.updatePriority(Number(element.dataset.id), element.dataset.priority === "true");
          await this.refresh();
        }); break;
        case "order-status": await this.perform(element, async () => {
          await Data.updateOrderStatus(Number(element.dataset.id), element.dataset.status);
          await this.refresh();
          showToast("Estado actualizado", element.dataset.status === "completed" ? "La mesa quedó libre." : "La cocina recibió el cambio.");
        }); break;
        case "mark-all-ready": await this.perform(element, async () => {
          const order = this.state.orders.find((entry) => entry.id === Number(element.dataset.id));
          for (const item of order.items.filter((entry) => !entry.ready)) {
            await Data.updateOrderItem(order.id, item.id, true);
          }
          await this.refresh();
          showToast("Orden lista", `La orden #${order.number} está lista para retirar.`);
        }); break;
        case "stock-change": await this.perform(element, async () => {
          const product = this.state.products.find((entry) => entry.id === Number(element.dataset.id));
          const stock = Math.max(0, product.stock + Number(element.dataset.delta));
          await Data.updateProduct(product.id, { stock });
          await this.refresh();
        }); break;
        case "edit-product": this.openProductModal(this.state.products.find((product) => product.id === Number(element.dataset.id))); break;
        case "new-product": this.openProductModal(); break;
        case "save-product": await this.saveProduct(element); break;
      }
    } catch (error) {
      showToast("No se pudo completar", error.message || "Inténtalo nuevamente.", "error");
    }
  },

  handleInput(event) {
    if (event.target.id === "menu-search") {
      UI.menuQuery = event.target.value;
      const grid = document.querySelector("#product-grid");
      if (grid) grid.innerHTML = this.productCards();
    }
    if (event.target.id === "admin-search") {
      UI.adminQuery = event.target.value;
      const query = UI.adminQuery.toLowerCase().trim();
      const products = this.state.products.filter((product) => !query || `${product.name} ${product.category}`.toLowerCase().includes(query));
      const body = document.querySelector("#admin-products");
      if (body) body.innerHTML = this.adminRows(products);
    }
    if (event.target.id === "order-notes") UI.orderNotes = event.target.value;
  },

  async handleChange(event) {
    const element = event.target.closest('[data-action="toggle-product"]');
    if (!element) return;
    try {
      await Data.updateProduct(Number(element.dataset.id), { active: element.checked });
      await this.refresh();
      showToast("Disponibilidad actualizada", element.checked ? "El plato vuelve a mostrarse en el menú." : "El plato se ocultó del menú.");
    } catch (error) {
      element.checked = !element.checked;
      showToast("No se pudo actualizar", error.message, "error");
    }
  },

  changeCart(productId, delta) {
    const product = this.state.products.find((entry) => entry.id === productId);
    if (!product || !product.active) throw new StoreError("Este plato ya no está disponible.");
    const current = UI.cart[productId] || 0;
    const next = current + delta;
    if (next > product.stock) {
      showToast("Plato agotado", `Solo quedan ${product.stock} unidades de ${product.name}.`, "error");
      return;
    }
    if (next <= 0) delete UI.cart[productId];
    else UI.cart[productId] = next;
    this.render();
  },

  async sendOrder(button) {
    if (UI.submitting) return;
    const lines = this.validateCart();
    UI.submitting = true;
    button.disabled = true;
    button.textContent = "Enviando…";
    try {
      const order = await Data.createOrder({
        table_id: UI.selectedTable.id,
        diners: UI.selectedTable.diners,
        notes: UI.orderNotes,
        items: lines.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
      });
      UI.cart = {};
      UI.orderNotes = "";
      UI.selectedTable = null;
      await this.refresh({ render: false });
      this.showSuccess(order);
      this.updateCounts();
    } finally {
      UI.submitting = false;
      if (document.body.contains(button)) {
        button.disabled = false;
        button.textContent = "✓ Confirmar y enviar a cocina";
      }
    }
  },

  async saveProduct(button) {
    const payload = {
      name: document.querySelector("#product-name").value,
      category: document.querySelector("#product-category").value,
      emoji: document.querySelector("#product-emoji").value,
      description: document.querySelector("#product-description").value,
      price: Number(document.querySelector("#product-price").value),
      stock: Number(document.querySelector("#product-stock").value),
    };
    await this.perform(button, async () => {
      if (button.dataset.id) await Data.updateProduct(Number(button.dataset.id), payload);
      else await Data.createProduct(payload);
      this.closeModal();
      await this.refresh();
      showToast(button.dataset.id ? "Plato actualizado" : "Plato creado", "El catálogo ya refleja los cambios.");
    });
  },

  async perform(button, operation) {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await operation();
    } finally {
      if (document.body.contains(button)) button.disabled = false;
    }
  },
});
