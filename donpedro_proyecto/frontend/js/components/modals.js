import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  openTableModal(table = null) {
    const freeTables = this.state.tables.filter((entry) => entry.status === "free");
    const selected = table || freeTables[0];
    UI.modalDiners = UI.selectedTable?.diners || 2;
    this.showModal(`
      <div class="modal-header"><div><h2>${table ? `Abrir Mesa ${table.number}` : "Seleccionar mesa"}</h2><p>Indica dónde se registrará el nuevo pedido.</p></div><button class="modal-close" data-action="close-modal">×</button></div>
      <div class="modal-body">
        ${!table ? `<div class="field"><label for="modal-table">Mesa disponible</label><select id="modal-table">${freeTables.map((entry) => `<option value="${entry.id}" ${UI.selectedTable?.id === entry.id ? "selected" : ""}>Mesa ${entry.number}</option>`).join("")}</select></div>` : `<input id="modal-table" type="hidden" value="${table.id}" />`}
        <div class="field" style="margin-top:18px"><label>¿Cuántos comensales?</label></div>
        <div class="diners-picker">
          <button data-action="diners-change" data-delta="-1" aria-label="Restar comensal">−</button>
          <div class="diners-value"><strong id="diners-number">${UI.modalDiners}</strong><small>comensales</small></div>
          <button data-action="diners-change" data-delta="1" aria-label="Sumar comensal">+</button>
        </div>
      </div>
      <div class="modal-footer"><button class="button button-secondary" data-action="close-modal">Cancelar</button><button class="button button-primary" data-action="confirm-table">Continuar al menú</button></div>`);
  },

  openProductModal(product = null) {
    const categories = ["Entradas", "Platos de fondo", "Bebidas", "Postres"];
    this.showModal(`
      <div class="modal-header"><div><h2>${product ? "Editar plato" : "Nuevo plato"}</h2><p>${product ? "Actualiza los datos del catálogo." : "Añade un producto al menú de Don Pedro."}</p></div><button class="modal-close" data-action="close-modal">×</button></div>
      <div class="modal-body">
        <div class="field"><label for="product-name">Nombre</label><input id="product-name" maxlength="80" value="${escapeHtml(product?.name || "")}" placeholder="Ej.: Papa a la huancaína" /></div>
        <div style="display:grid;grid-template-columns:1fr 90px;gap:12px;margin-top:14px">
          <div class="field"><label for="product-category">Categoría</label><select id="product-category">${categories.map((category) => `<option ${product?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
          <div class="field"><label for="product-emoji">Ícono</label><input id="product-emoji" maxlength="4" value="${escapeHtml(product?.emoji || "🍽️")}" /></div>
        </div>
        <div class="field"><label for="product-description">Descripción</label><textarea id="product-description" maxlength="240" placeholder="Ingredientes o presentación">${escapeHtml(product?.description || "")}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
          <div class="field"><label for="product-price">Precio (S/)</label><input id="product-price" type="number" min="0" step="0.5" value="${product?.price ?? ""}" /></div>
          <div class="field"><label for="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" value="${product?.stock ?? ""}" /></div>
        </div>
      </div>
      <div class="modal-footer"><button class="button button-secondary" data-action="close-modal">Cancelar</button><button class="button button-primary" data-action="save-product" data-id="${product?.id || ""}">${product ? "Guardar cambios" : "Crear plato"}</button></div>`);
  },

  showSuccess(order) {
    this.showModal(`
      <div class="modal-body" style="padding:28px">
        <div class="success-mark">✓</div>
        <div class="success-copy"><h2>¡Pedido enviado!</h2><p>La orden fue registrada correctamente y ya aparece en la vista de cocina.</p></div>
        <div class="success-receipt"><span>Mesa ${order.table_number}<br /><small>${order.items.reduce((sum, item) => sum + item.quantity, 0)} platos</small></span><strong>Pedido #${order.number}</strong></div>
      </div>
      <div class="modal-footer"><button class="button button-secondary" data-action="go-tables">Volver a mesas</button><button class="button" data-action="go-kitchen">Ver en cocina</button></div>`);
  },

  showModal(content, wide = false) {
    this.modalRoot.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true">${content}</section></div>`;
    queueMicrotask(() => this.modalRoot.querySelector("button, input, select")?.focus());
  },

  closeModal() {
    this.modalRoot.innerHTML = "";
  },


});
