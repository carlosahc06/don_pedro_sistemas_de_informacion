import { App } from "../app-core.js";
import { Data } from "../data/api.js";
import { StoreError } from "../data/errors.js";
import { UI } from "../state.js";
import { formatMoney, escapeHtml } from "../utils/format.js";
import { metricCard, showToast } from "../components/helpers.js";

Object.assign(App, {
  renderMenu() {
    const categories = ["Todos", ...new Set(this.state.products.filter((product) => product.active).map((product) => product.category))];
    return `
      <section class="page">
        <div class="page-header">
          <div class="page-heading">
            <span class="eyebrow">Comandero</span>
            <h1>Registrar pedido</h1>
            <p>Agrega platos a la comanda. El sistema controla el stock antes de añadirlos y vuelve a validarlo al enviar.</p>
          </div>
          <div class="header-actions">
            <button class="button button-secondary" data-action="choose-table">▦ ${UI.selectedTable ? `Mesa ${UI.selectedTable.number}` : "Elegir mesa"}</button>
          </div>
        </div>
        <div class="selection-banner ${UI.selectedTable ? "" : "warning"}">
          <div>
            <strong>${UI.selectedTable ? `Mesa ${UI.selectedTable.number} seleccionada` : "Falta seleccionar una mesa"}</strong>
            <span>${UI.selectedTable ? `${UI.selectedTable.diners} comensal${UI.selectedTable.diners === 1 ? "" : "es"}` : "La mesa es obligatoria para enviar la comanda."}</span>
          </div>
          ${UI.selectedTable ? `<button class="button button-ghost button-small" data-action="choose-table">Cambiar</button>` : `<button class="button button-small" data-action="choose-table">Seleccionar</button>`}
        </div>
        <div class="order-layout">
          <div>
            <div class="menu-toolbar">
              <div class="category-tabs">
                ${categories.map((category) => `<button class="tab ${UI.category === category ? "active" : ""}" data-action="filter-category" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}
              </div>
              <label class="search-field">
                <span class="hidden">Buscar platos</span>
                <input id="menu-search" type="search" placeholder="Buscar platos" autocomplete="off" value="${escapeHtml(UI.menuQuery)}" />
              </label>
            </div>
            <div class="product-grid" id="product-grid">${this.productCards()}</div>
          </div>
          ${this.renderCart()}
        </div>
      </section>`;
  },

  productCards() {
    const query = UI.menuQuery.toLowerCase().trim();
    const products = this.state.products.filter((product) => {
      const inCategory = UI.category === "Todos" || product.category === UI.category;
      const matches = !query || `${product.name} ${product.description}`.toLowerCase().includes(query);
      return product.active && inCategory && matches;
    });
    if (!products.length) return `<div class="empty-state" style="grid-column:1/-1"><span>⌕</span><h3>No encontramos platos</h3><p>Prueba otra categoría o término de búsqueda.</p></div>`;
    return products.map((product, index) => {
      const cartQuantity = UI.cart[product.id] || 0;
      const soldOut = product.stock <= 0;
      const maxed = cartQuantity >= product.stock;
      const hues = [
        ["#f0dfcd", "#faf5ee"],
        ["#e8e5c7", "#f8f7ee"],
        ["#d8e8eb", "#f1f7f7"],
        ["#ead8cf", "#f8f2ed"],
      ][index % 4];
      return `
        <article class="product-card ${soldOut ? "sold-out" : ""}">
          <div class="product-visual" style="--visual-from:${hues[0]};--visual-to:${hues[1]}">
            <span aria-hidden="true">${product.emoji}</span>
            <span class="product-stock ${product.stock <= 5 ? "low" : ""}">${soldOut ? "Agotado" : `${product.stock} disp.`}</span>
          </div>
          <div class="product-body">
            <span class="product-category">${escapeHtml(product.category)}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <div class="product-footer">
              <span class="price">${formatMoney(product.price)}</span>
              <button class="add-product" data-action="add-product" data-id="${product.id}" ${soldOut || maxed ? "disabled" : ""} aria-label="Añadir ${escapeHtml(product.name)}">${cartQuantity ? cartQuantity : "+"}</button>
            </div>
          </div>
        </article>`;
    }).join("");
  },

  renderCart() {
    const lines = this.cartLines();
    const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    return `
      <aside class="cart-panel" aria-label="Pedido actual">
        <div class="cart-header">
          <div><h2>Pedido actual</h2><p>${UI.selectedTable ? `Mesa ${UI.selectedTable.number} • ${UI.selectedTable.diners} comensales` : "Mesa por seleccionar"}</p></div>
          <span class="badge">${lines.reduce((sum, line) => sum + line.quantity, 0)} uds.</span>
        </div>
        <div class="cart-items">
          ${lines.length ? lines.map(({ product, quantity }) => `
            <div class="cart-item">
              <div class="cart-item-top">
                <h3>${escapeHtml(product.name)}</h3>
                <span class="line-price">${formatMoney(product.price * quantity)}</span>
              </div>
              <div class="quantity-row">
                <div class="quantity-control">
                  <button data-action="cart-change" data-id="${product.id}" data-delta="-1" aria-label="Restar uno">−</button>
                  <span>${quantity}</span>
                  <button data-action="cart-change" data-id="${product.id}" data-delta="1" aria-label="Sumar uno" ${quantity >= product.stock ? "disabled" : ""}>+</button>
                </div>
                <button class="remove-line" data-action="remove-line" data-id="${product.id}">Eliminar</button>
              </div>
            </div>`).join("") : `
            <div class="empty-cart"><span>🍽️</span><strong>El pedido está vacío</strong><p>Selecciona platos del menú para comenzar.</p></div>`}
        </div>
        <div class="cart-footer">
          <div class="total-row"><span>Total estimado</span><strong>${formatMoney(total)}</strong></div>
          <button class="button button-primary" data-action="review-order" ${!lines.length ? "disabled" : ""}>Revisar pedido →</button>
        </div>
      </aside>`;
  },

  cartLines() {
    return Object.entries(UI.cart)
      .map(([productId, quantity]) => ({
        product: this.state.products.find((product) => product.id === Number(productId)),
        quantity,
      }))
      .filter((line) => line.product && line.quantity > 0);
  },

  validateCart() {
    if (!UI.selectedTable) throw new StoreError("Selecciona una mesa antes de continuar.", "missing_table");
    const lines = this.cartLines();
    if (!lines.length) throw new StoreError("Agrega al menos un plato al pedido.", "empty_order");
    lines.forEach(({ product, quantity }) => {
      if (!Number.isInteger(quantity) || quantity < 1) throw new StoreError("Todas las cantidades deben ser positivas.");
      if (!product.active || product.stock < quantity) {
        throw new StoreError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`, "insufficient_stock");
      }
    });
    return lines;
  },


});
