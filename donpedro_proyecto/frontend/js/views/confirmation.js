import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  renderConfirmation() {
    let lines;
    try {
      lines = this.validateCart();
    } catch (error) {
      queueMicrotask(() => {
        showToast("No se puede confirmar", error.message, "error");
        this.navigate("pedido");
      });
      return "";
    }
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    return `
      <section class="page">
        <div class="page-header">
          <div class="page-heading">
            <span class="eyebrow">Último paso</span>
            <h1>Revisa y confirma el pedido</h1>
            <p>Comprueba la mesa, los platos y sus cantidades. La comanda llegará a cocina únicamente después de confirmar.</p>
          </div>
          <div class="header-actions"><button class="button button-secondary" data-action="back-menu">← Volver al menú</button></div>
        </div>
        <div class="confirmation-shell">
          <div class="card confirmation-card">
            <h2>Detalle de la comanda</h2>
            <table class="confirm-table">
              <thead><tr><th>Plato</th><th>Precio unitario</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${lines.map(({ product, quantity }) => `
                  <tr>
                    <td><div class="confirm-item"><span class="confirm-emoji">${product.emoji}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span></div></td>
                    <td>${formatMoney(product.price)}</td>
                    <td>${quantity}</td>
                    <td><strong>${formatMoney(product.price * quantity)}</strong></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
          <aside class="card confirmation-summary">
            <h2>Resumen</h2>
            <div class="summary-info">
              <div><span>Mesa</span><strong>Mesa ${UI.selectedTable.number}</strong></div>
              <div><span>Comensales</span><strong>${UI.selectedTable.diners}</strong></div>
              <div><span>Platos</span><strong>${lines.reduce((sum, line) => sum + line.quantity, 0)}</strong></div>
              <div><span>Destino</span><strong>Cocina</strong></div>
            </div>
            <div class="field">
              <label for="order-notes">Indicaciones para cocina (opcional)</label>
              <textarea id="order-notes" maxlength="500" placeholder="Ej.: sin cebolla, término medio…">${escapeHtml(UI.orderNotes)}</textarea>
            </div>
            <div class="summary-total"><span>Total del pedido</span><strong>${formatMoney(total)}</strong></div>
            <div class="confirmation-actions">
              <button class="button button-primary" data-action="send-order">✓ Confirmar y enviar a cocina</button>
              <button class="button button-secondary" data-action="back-menu">Modificar pedido</button>
            </div>
          </aside>
        </div>
      </section>`;
  },


});
