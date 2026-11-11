import { LocalStore } from "./local-store.js";
import { StoreError } from "./errors.js";

export const Data = {
  mode: "loading",

  async init() {
    try {
      const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) throw new Error("API no disponible");
      const state = await response.json();
      if (!Array.isArray(state.tables) || !Array.isArray(state.products)) throw new Error("Respuesta inválida");
      this.mode = "server";
      return state;
    } catch {
      LocalStore.load();
      this.mode = "local";
      return LocalStore.state();
    }
  },

  async request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) },
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) throw new StoreError(payload?.error || "No se pudo completar la operación.", payload?.code);
    return payload;
  },

  async getState() {
    return this.mode === "local" ? LocalStore.state() : this.request("/api/state");
  },

  async createOrder(payload) {
    if (this.mode === "local") return LocalStore.createOrder(payload);
    return this.request("/api/orders", { method: "POST", body: JSON.stringify(payload) });
  },

  async updateOrderStatus(orderId, status) {
    if (this.mode === "local") return LocalStore.updateOrderStatus(orderId, status);
    return this.request(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async updateOrderItem(orderId, itemId, ready) {
    if (this.mode === "local") return LocalStore.updateOrderItem(orderId, itemId, ready);
    return this.request(`/api/orders/${orderId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ ready }),
    });
  },

  async updatePriority(orderId, priority) {
    if (this.mode === "local") return LocalStore.updatePriority(orderId, priority);
    return this.request(`/api/orders/${orderId}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority }),
    });
  },

  async updateProduct(productId, changes) {
    if (this.mode === "local") return LocalStore.updateProduct(productId, changes);
    return this.request(`/api/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  },

  async createProduct(payload) {
    if (this.mode === "local") return LocalStore.createProduct(payload);
    return this.request("/api/products", { method: "POST", body: JSON.stringify(payload) });
  },
};

