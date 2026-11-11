import { clone } from "../utils/format.js";
import { localSeed } from "./seed.js";
import { StoreError } from "./errors.js";

export const LocalStore = {
  key: "don-pedro-pos-v2",
  data: null,

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.key));
      this.data = saved?.version === 2 ? saved : localSeed();
    } catch {
      this.data = localSeed();
    }
    this.save();
  },

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  },

  state() {
    const data = clone(this.data);
    const activeOrders = data.orders
      .filter((order) => ["new", "preparing", "ready"].includes(order.status))
      .map((order) => ({
        ...order,
        age_minutes: Math.max(
          0,
          Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60_000)
        ),
      }))
      .sort((a, b) => Number(b.priority) - Number(a.priority) || new Date(a.created_at) - new Date(b.created_at));
    return {
      products: data.products.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
      tables: data.tables.sort((a, b) => a.number - b.number),
      orders: activeOrders,
      stats: {
        active_orders: activeOrders.length,
        ready_orders: activeOrders.filter((order) => order.status === "ready").length,
        completed_today: data.completedToday,
        low_stock: data.products.filter((product) => product.active && product.stock <= 5).length,
      },
    };
  },

  createOrder(payload) {
    const table = this.data.tables.find((entry) => entry.id === Number(payload.table_id));
    const diners = Number(payload.diners);
    if (!table) throw new StoreError("Selecciona una mesa válida.");
    if (table.status !== "free") throw new StoreError("La mesa ya tiene un pedido activo.", "table_occupied");
    if (!Number.isInteger(diners) || diners < 1 || diners > 20) {
      throw new StoreError("La cantidad de comensales debe estar entre 1 y 20.");
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new StoreError("Agrega al menos un plato antes de enviar el pedido.", "empty_order");
    }
    const quantities = new Map();
    payload.items.forEach((item) => {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new StoreError("Las cantidades deben ser números enteros positivos.", "invalid_quantity");
      }
      quantities.set(Number(item.product_id), (quantities.get(Number(item.product_id)) || 0) + quantity);
    });
    const products = [...quantities].map(([productId, quantity]) => {
      const product = this.data.products.find((entry) => entry.id === productId);
      if (!product || !product.active) throw new StoreError("Uno de los platos no está disponible.");
      if (product.stock < quantity) {
        throw new StoreError(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`,
          "insufficient_stock"
        );
      }
      return [product, quantity];
    });
    const id = this.data.nextOrderId++;
    const order = {
      id,
      number: 1040 + id,
      table_id: table.id,
      table_number: table.number,
      diners,
      status: "new",
      priority: false,
      notes: String(payload.notes || "").slice(0, 500),
      total: products.reduce((sum, [product, quantity]) => sum + product.price * quantity, 0),
      created_at: new Date().toISOString(),
      age_minutes: 0,
      items: products.map(([product, quantity]) => ({
        id: this.data.nextItemId++,
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity,
        note: payload.items.find((item) => Number(item.product_id) === product.id)?.note || "",
        ready: false,
      })),
    };
    products.forEach(([product, quantity]) => (product.stock -= quantity));
    table.status = "occupied";
    table.diners = diners;
    table.active_order_id = id;
    table.active_order_number = order.number;
    this.data.orders.push(order);
    this.save();
    return clone(order);
  },

  updateOrderStatus(orderId, status) {
    const order = this.data.orders.find((entry) => entry.id === Number(orderId));
    if (!order) throw new StoreError("Pedido no encontrado.", "not_found");
    const transitions = {
      new: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["completed"],
    };
    if (!transitions[order.status]?.includes(status)) {
      throw new StoreError(`No se puede cambiar de ${order.status} a ${status}.`, "invalid_transition");
    }
    order.status = status;
    if (["completed", "cancelled"].includes(status)) {
      const table = this.data.tables.find((entry) => entry.id === order.table_id);
      if (table?.active_order_id === order.id) {
        Object.assign(table, {
          status: "free",
          diners: 0,
          active_order_id: null,
          active_order_number: null,
        });
      }
      if (status === "completed") this.data.completedToday += 1;
    }
    this.save();
    return clone(order);
  },

  updateOrderItem(orderId, itemId, ready) {
    const order = this.data.orders.find((entry) => entry.id === Number(orderId));
    const item = order?.items.find((entry) => entry.id === Number(itemId));
    if (!item) throw new StoreError("Plato del pedido no encontrado.", "not_found");
    item.ready = Boolean(ready);
    if (!item.ready && order.status === "ready") order.status = "preparing";
    if (order.items.every((entry) => entry.ready) && ["new", "preparing"].includes(order.status)) {
      order.status = "ready";
    }
    this.save();
    return clone(order);
  },

  updatePriority(orderId, priority) {
    const order = this.data.orders.find((entry) => entry.id === Number(orderId));
    if (!order) throw new StoreError("Pedido no encontrado.", "not_found");
    order.priority = Boolean(priority);
    this.save();
    return clone(order);
  },

  updateProduct(productId, changes) {
    const product = this.data.products.find((entry) => entry.id === Number(productId));
    if (!product) throw new StoreError("Plato no encontrado.", "not_found");
    if (changes.stock !== undefined) {
      const stock = Number(changes.stock);
      if (!Number.isInteger(stock) || stock < 0) throw new StoreError("El stock debe ser un entero positivo.");
      changes.stock = stock;
    }
    if (changes.price !== undefined) {
      const price = Number(changes.price);
      if (!Number.isFinite(price) || price < 0) throw new StoreError("El precio no puede ser negativo.");
      changes.price = price;
    }
    Object.assign(product, changes);
    this.save();
    return clone(product);
  },

  createProduct(payload) {
    const name = String(payload.name || "").trim();
    if (!name || !String(payload.category || "").trim()) {
      throw new StoreError("El nombre y la categoría son obligatorios.");
    }
    if (this.data.products.some((product) => product.name.toLowerCase() === name.toLowerCase())) {
      throw new StoreError("Ya existe un plato con ese nombre.", "duplicate_product");
    }
    const product = {
      id: this.data.nextProductId++,
      name,
      category: String(payload.category).trim(),
      description: String(payload.description || "").trim(),
      price: Number(payload.price),
      stock: Number(payload.stock),
      emoji: String(payload.emoji || "🍽️").trim() || "🍽️",
      active: true,
    };
    if (!Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0) {
      throw new StoreError("El precio y el stock deben ser valores positivos.");
    }
    this.data.products.push(product);
    this.save();
    return clone(product);
  },
};

