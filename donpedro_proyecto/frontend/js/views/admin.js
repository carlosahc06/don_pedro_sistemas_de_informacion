import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  renderAdmin() {
    const query = UI.adminQuery.toLowerCase().trim();
    const products = this.state.products.filter((product) => !query || `${product.name} ${product.category}`.toLowerCase().includes(query));
    const inventoryValue = this.state.products.reduce((sum, product) => sum + product.price * product.stock, 0);
    return `
      <section class="page">
        <div class="page-header">
          <div class="page-heading">
            <span class="eyebrow">Administración</span>
            <h1>Catálogo e inventario</h1>
            <p>Actualiza existencias, precios y disponibilidad. Los cambios se reflejan de inmediato en el comandero.</p>
          </div>
          <div class="header-actions"><button class="button button-primary" data-action="new-product">＋ Nuevo plato</button></div>
        </div>
        <div class="metric-grid">
          ${metricCard("Platos activos", this.state.products.filter((product) => product.active).length, "En el menú", "#e9f8f3")}
          ${metricCard("Stock total", this.state.products.reduce((sum, product) => sum + product.stock, 0), "Unidades disponibles", "#edf4ff")}
          ${metricCard("Stock bajo", this.state.stats.low_stock, "5 unidades o menos", "#fff0f0")}
          ${metricCard("Valor del inventario", formatMoney(inventoryValue), "A precio de venta", "#fff5dc")}
        </div>
        <div class="card admin-table-card">
          <div class="admin-toolbar">
            <h2>Productos (${products.length})</h2>
            <label class="search-field"><span class="hidden">Buscar productos</span><input id="admin-search" type="search" placeholder="Buscar en el catálogo" value="${escapeHtml(UI.adminQuery)}" /></label>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Plato</th><th>Precio</th><th>Stock</th><th>Disponible</th><th>Acciones</th></tr></thead>
              <tbody id="admin-products">${this.adminRows(products)}</tbody>
            </table>
          </div>
        </div>
      </section>`;
  },

  adminRows(products) {
    return products.map((product) => `
      <tr>
        <td><div class="product-name-cell"><span class="mini-emoji">${product.emoji}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span></div></td>
        <td><strong>${formatMoney(product.price)}</strong></td>
        <td><div class="stock-control"><button data-action="stock-change" data-id="${product.id}" data-delta="-1" ${product.stock <= 0 ? "disabled" : ""}>−</button><strong class="${product.stock <= 5 ? "low" : ""}">${product.stock}</strong><button data-action="stock-change" data-id="${product.id}" data-delta="1">+</button></div></td>
        <td><label class="switch" title="Cambiar disponibilidad"><input type="checkbox" data-action="toggle-product" data-id="${product.id}" ${product.active ? "checked" : ""} /><span></span></label></td>
        <td><button class="button button-secondary button-small" data-action="edit-product" data-id="${product.id}">Editar</button></td>
      </tr>`).join("") || `<tr><td colspan="5"><div class="empty-state"><span>⌕</span><h3>Sin resultados</h3><p>Cambia el término de búsqueda.</p></div></td></tr>`;
  },


});
