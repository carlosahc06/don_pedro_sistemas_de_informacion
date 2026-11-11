import { Data } from "./data/api.js";
import { StoreError } from "./data/errors.js";
import { UI } from "./state.js";
import { formatMoney, escapeHtml } from "./utils/format.js";
import { metricCard, showToast } from "./components/helpers.js";

export const App = {
  root: document.querySelector("#app"),
  modalRoot: document.querySelector("#modal-root"),
  state: null,

  async init() {
    this.state = await Data.init();
    this.updateConnection();
    const hashView = location.hash.replace("#", "");
    if (["mesas", "pedido", "cocina", "admin"].includes(hashView)) UI.view = hashView;
    this.bindEvents();
    this.render();
    this.startClock();
    this.registerPwa();
    setInterval(() => this.backgroundRefresh(), 15_000);
  },

  bindEvents() {
    document.addEventListener("click", (event) => this.handleClick(event));
    document.addEventListener("input", (event) => this.handleInput(event));
    document.addEventListener("change", (event) => this.handleChange(event));
    window.addEventListener("hashchange", () => {
      const view = location.hash.replace("#", "");
      if (["mesas", "pedido", "cocina", "admin"].includes(view) && view !== UI.view) {
        UI.view = view;
        this.render();
      }
    });
    window.addEventListener("online", () => this.updateConnection());
    window.addEventListener("offline", () => this.updateConnection());
  },

  async backgroundRefresh() {
    if (document.hidden || Data.mode !== "server") return;
    try {
      this.state = await Data.getState();
      this.updateCounts();
      if (UI.view === "cocina" || UI.view === "mesas") this.render();
      this.updateConnection();
    } catch {
      this.updateConnection(true);
    }
  },

  async refresh({ render = true } = {}) {
    this.state = await Data.getState();
    if (render) this.render();
    else this.updateCounts();
  },

  navigate(view) {
    if (view === "pedido" && !UI.selectedTable && !Object.keys(UI.cart).length) {
      showToast("Selecciona una mesa", "El pedido necesita una mesa antes de enviarse.", "info");
    }
    UI.view = view;
    if (location.hash !== `#${view}`) history.pushState(null, "", `#${view}`);
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  render() {
    const renders = {
      mesas: () => this.renderTables(),
      pedido: () => this.renderMenu(),
      confirmacion: () => this.renderConfirmation(),
      cocina: () => this.renderKitchen(),
      admin: () => this.renderAdmin(),
    };
    this.root.innerHTML = renders[UI.view]?.() || this.renderTables();
    this.updateNavigation();
    this.updateCounts();
  },

  updateNavigation() {
    const activeView = UI.view === "confirmacion" ? "pedido" : UI.view;
    document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === activeView);
    });
    const contexts = {
      mesas: "Gestión del salón",
      pedido: UI.selectedTable ? `Comandero • Mesa ${UI.selectedTable.number}` : "Nuevo pedido",
      confirmacion: "Confirmar comanda",
      cocina: "Vista de cocina",
      admin: "Inventario y precios",
    };
    document.querySelector("#page-context").textContent = contexts[UI.view] || "Gestión del salón";
  },

  updateCounts() {
    const quantity = Object.values(UI.cart).reduce((sum, value) => sum + value, 0);
    const cartCount = document.querySelector("#cart-count");
    cartCount.textContent = quantity;
    cartCount.classList.toggle("hidden", quantity === 0);
    document.querySelector("#kitchen-count").textContent = this.state?.orders?.length || 0;
  },

  updateConnection(forceOffline = false) {
    const element = document.querySelector("#connection-status");
    const offline = forceOffline || !navigator.onLine;
    element.className = `connection ${offline ? "offline" : "online"}`;
    element.querySelector("span:last-child").textContent = offline
      ? "Sin conexión"
      : Data.mode === "server"
        ? "Sincronizado"
        : "Modo local";
    element.title = Data.mode === "server"
      ? "Datos sincronizados con la API Python"
      : "Demostración con datos guardados en este dispositivo";
  },

  startClock() {
    const update = () => {
      document.querySelector("#clock").textContent = new Intl.DateTimeFormat("es-PE", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
    };
    update();
    setInterval(update, 30_000);
  },

  registerPwa() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    let installPrompt;
    const installButton = document.querySelector("#install-button");
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      installButton.classList.remove("hidden");
    });
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButton.classList.add("hidden");
    });
    window.addEventListener("appinstalled", () => installButton.classList.add("hidden"));
  },

};
