import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  renderTables() {
    const free = this.state.tables.filter((table) => table.status === "free").length;
    const occupied = this.state.tables.length - free;
    return `
      <section class="page">
        <div class="page-header">
          <div class="page-heading">
            <span class="eyebrow">Salón</span>
            <h1>Selecciona una mesa</h1>
            <p>Abre una mesa libre para registrar un nuevo pedido o revisa en cocina las comandas activas.</p>
          </div>
          <div class="header-actions">
            <div class="legend">
              <span><i style="background:#f4ce73"></i> Libre</span>
              <span><i style="background:#bd8e67"></i> Ocupada</span>
            </div>
          </div>
        </div>
        <div class="metric-grid">
          ${metricCard("Mesas libres", free, "Disponibles para sentar", "#fff2cd")}
          ${metricCard("Mesas ocupadas", occupied, "Con pedido activo", "#f2e2d3")}
          ${metricCard("Pedidos en cocina", this.state.stats.active_orders, `${this.state.stats.ready_orders} listos`, "#edf4ff")}
          ${metricCard("Platos con stock bajo", this.state.stats.low_stock, "Requieren atención", "#fff0f0")}
        </div>
        <div class="tables-grid">
          ${this.state.tables.map((table) => this.tableCard(table)).join("")}
        </div>
      </section>`;
  },

  tableCard(table) {
    const occupied = table.status === "occupied";
    return `
      <button class="table-card ${occupied ? "occupied" : ""}" data-action="open-table" data-id="${table.id}" aria-label="Mesa ${table.number}, ${occupied ? "ocupada" : "libre"}">
        <span class="table-card-header">
          <span class="table-number">Mesa ${table.number}</span>
          ${occupied ? `<span class="badge">#${table.active_order_number || "—"}</span>` : ""}
        </span>
        <span class="table-card-body">
          <span class="status-pill">${occupied ? "Ocupada" : "Libre"}</span>
          <p>${occupied ? `${table.diners} comensal${table.diners === 1 ? "" : "es"} • Pedido activo` : "Disponible para sentar"}</p>
          <strong>${occupied ? "Comanda en proceso" : "Abrir nueva atención"}</strong>
          <span class="table-action">${occupied ? "Ver en cocina →" : "Seleccionar mesa →"}</span>
        </span>
      </button>`;
  },


});
