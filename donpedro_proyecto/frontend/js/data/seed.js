import { clone } from "../utils/format.js";

const PRODUCT_SEED = [
  [1, "Lomo Saltado", "Platos de fondo", "Tiras de lomo, cebolla, tomate, arroz y papas.", 42, 18, "🥩"],
  [2, "Ají de Gallina", "Platos de fondo", "Pechuga deshilachada en salsa de ají amarillo.", 38, 12, "🍛"],
  [3, "Ceviche Clásico", "Entradas", "Pescado fresco, limón, cebolla y ají limo.", 45, 9, "🐟"],
  [4, "Seco de Cordero", "Platos de fondo", "Cordero, cilantro, frejoles y arroz.", 48, 7, "🍲"],
  [5, "Arroz con Pollo", "Platos de fondo", "Arroz al cilantro, pollo y salsa criolla.", 34, 15, "🍗"],
  [6, "Tallarines Verdes", "Platos de fondo", "Pasta al pesto peruano con bistec.", 36, 8, "🍝"],
  [7, "Tequeños", "Entradas", "Seis tequeños con salsa de palta.", 22, 20, "🧀"],
  [8, "Causa Limeña", "Entradas", "Papa amarilla, pollo, palta y ají amarillo.", 24, 0, "🥔"],
  [9, "Chicha Morada", "Bebidas", "Vaso de chicha morada de la casa.", 8, 30, "🥤"],
  [10, "Limonada", "Bebidas", "Limonada fresca con hierbabuena.", 9, 24, "🍋"],
  [11, "Suspiro Limeño", "Postres", "Manjar blanco, merengue y canela.", 16, 6, "🍮"],
  [12, "Picarones", "Postres", "Aros de zapallo y camote con miel de chancaca.", 18, 10, "🍩"],
].map(([id, name, category, description, price, stock, emoji]) => ({
  id,
  name,
  category,
  description,
  price,
  stock,
  emoji,
  active: true,
}));

export function localSeed() {
  const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
  const orderDefinitions = [
    [1, 1041, 2, 2, "preparing", true, 7, [[2, 1, false], [5, 1, false]]],
    [2, 1042, 4, 4, "new", false, 4, [[7, 2, false], [6, 1, false]]],
    [3, 1043, 6, 3, "ready", false, 14, [[3, 1, true], [9, 3, true]]],
    [4, 1044, 8, 2, "preparing", false, 9, [[1, 2, false]]],
    [5, 1045, 10, 5, "new", false, 2, [[4, 2, false], [10, 5, false]]],
    [6, 1046, 12, 2, "ready", false, 18, [[12, 1, true], [9, 2, true]]],
  ];
  let itemId = 1;
  const orders = orderDefinitions.map(([id, number, tableNumber, diners, status, priority, age, lines]) => {
    const items = lines.map(([productId, quantity, ready]) => {
      const product = PRODUCT_SEED.find((entry) => entry.id === productId);
      return {
        id: itemId++,
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity,
        note: "",
        ready,
      };
    });
    return {
      id,
      number,
      table_id: tableNumber,
      table_number: tableNumber,
      diners,
      status,
      priority,
      notes: "",
      total: items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
      created_at: minutesAgo(age),
      age_minutes: age,
      items,
    };
  });
  const occupied = new Map(orders.map((order) => [order.table_id, order]));
  return {
    version: 2,
    products: clone(PRODUCT_SEED),
    tables: Array.from({ length: 12 }, (_, index) => {
      const id = index + 1;
      const order = occupied.get(id);
      return {
        id,
        number: id,
        status: order ? "occupied" : "free",
        diners: order?.diners || 0,
        active_order_id: order?.id || null,
        active_order_number: order?.number || null,
      };
    }),
    orders,
    completedToday: 0,
    nextOrderId: 7,
    nextItemId: itemId,
    nextProductId: 13,
  };
}

