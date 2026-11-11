import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  renderKitchen() {
    const statuses = { new: "Nuevo", preparing: "Preparando", ready: "Listo" };
    const filtered = this.state.orders.filter((order) => UI.kitchenFilter === "all" || order.status === UI.kitchenFilter);
    const average = this.state.orders.length
      ? Math.round(this.state.orders.reduce((sum, order) => sum + order.age_minutes, 0) / this.state.orders.length)
      : 0;
    return `
      <section class="page">
        <div class="page-header">
          <div class="page-heading">
            <span class="eyebrow">KDS • Cocina</span>
            <h1>Órdenes activas</h1>
            <p>Inicia la preparación, marca cada plato y completa la orden cuando el mesero la haya retirado.</p>
          </div>
          <div class="header-actions"><button class="button button-secondary" data-action="refresh">↻ Actualizar</button></div>
        </div>
        <div class="kitchen-layout">
          <div>
            <div class="kitchen-toolbar">
              <div class="filter-tabs">
                ${[["all", "Todas"], ["new", "Nuevas"], ["preparing", "Preparando"], ["ready", "Listas"]].map(([key, label]) => `<button class="tab ${UI.kitchenFilter === key ? "active" : ""}" data-action="kitchen-filter" data-filter="${key}">${label}</button>`).join("")}
              </div>
              <span class="badge">${filtered.length} órdenes</span>
            </div>
            <div class="orders-list">
              ${filtered.length ? filtered.map((order) => `
                <article class="order-card ${order.priority ? "urgent" : ""}">
                  <div class="order-header">
                    <div class="order-title">
                      ${order.priority ? `<span class="badge urgent-badge">Urgente</span>` : ""}
                      <div><h3>Orden #${order.number} • Mesa ${order.table_number}</h3><p>Hace ${order.age_minutes} min • ${order.diners} comensales</p></div>
                    </div>
                    <div class="order-meta">
                      <button class="button button-ghost button-small" data-action="priority" data-id="${order.id}" data-priority="${!order.priority}" aria-label="${order.priority ? "Quitar prioridad" : "Marcar urgente"}">⚑</button>
                      <span class="badge status-${order.status}">${statuses[order.status]}</span>
                    </div>
                  </div>
                  <div class="order-body">
                    ${order.items.map((item) => `
                      <div class="kitchen-item ${item.ready ? "ready" : ""}">
                        <span class="item-quantity">${item.ready ? "✓" : item.quantity}</span>
                        <div><strong>${item.quantity > 1 ? `${item.quantity} × ` : ""}${escapeHtml(item.name)}</strong>${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</div>
                        <button class="button button-secondary button-small" data-action="toggle-item" data-order="${order.id}" data-item="${item.id}" data-ready="${!item.ready}">${item.ready ? "Reabrir" : "Marcar listo"}</button>
                      </div>`).join("")}
                  </div>
                  ${order.notes ? `<div style="padding:10px 16px;background:#fff9e9;color:#745419;font-size:11px"><strong>Nota:</strong> ${escapeHtml(order.notes)}</div>` : ""}
                  <div class="order-footer">
                    ${order.status === "new" ? `<button class="button button-primary button-small" data-action="order-status" data-id="${order.id}" data-status="preparing">Iniciar preparación</button>` : ""}
                    ${order.status === "preparing" ? `<button class="button button-primary button-small" data-action="mark-all-ready" data-id="${order.id}">Marcar todo listo</button>` : ""}
                    ${order.status === "ready" ? `<button class="button button-small" data-action="order-status" data-id="${order.id}" data-status="completed">Completar y liberar mesa</button>` : ""}
                  </div>
                </article>`).join("") : `<div class="empty-state"><span>✓</span><h3>No hay órdenes en esta vista</h3><p>Las nuevas comandas aparecerán automáticamente.</p></div>`}
            </div>
          </div>
          <aside class="card station-panel">
            <h2>Vista de estación</h2>
            <div class="station-metrics">
              <div><span>Órdenes listas</span><strong>${this.state.stats.ready_orders}</strong></div>
              <div><span>Tiempo medio</span><strong>${average}m</strong></div>
            </div>
            <h3>En cola</h3>
            <div class="queue-list">
              ${this.state.orders.filter((order) => order.status !== "ready").slice(0, 5).map((order) => `<div class="queue-item"><span>Orden #${order.number} • Mesa ${order.table_number}</span><strong>${order.age_minutes} min</strong></div>`).join("") || `<div class="queue-item">Sin órdenes pendientes</div>`}
            </div>
          </aside>
        </div>
      </section>`;
  },


});
