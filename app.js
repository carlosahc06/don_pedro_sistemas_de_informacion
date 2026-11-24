var CLAVE_MESAS = "dp-sesion04-mesas-v1";
var CLAVE_PEDIDOS = "dp-sesion04-pedidos-v1";
var CLAVE_ORDENES = "dp-sesion04-ordenes-v1";

function crear_el(tag, clase, texto) {
  var el = document.createElement(tag);
  if (clase) {
    el.className = clase;
  }
  if (texto !== undefined) {
    el.textContent = texto;
  }
  return el;
}

function formato_precio(p) {
  return "S/ " + p.toFixed(2);
}

function guardar(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
    return true;
  } catch (e) {
    return false;
  }
}

function cargar(clave) {
  try {
    var txt = localStorage.getItem(clave);
    if (txt === null) {
      return null;
    }
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

var vista = document.body.id;

if (vista === "vista_mesas") {
  var mesas_default = [
    { num: 1, estado: "Libre", pers: 0 },
    { num: 2, estado: "Ocupada", pers: 2 },
    { num: 3, estado: "Libre", pers: 0 },
    { num: 4, estado: "Ocupada", pers: 4 },
    { num: 5, estado: "Libre", pers: 0 },
    { num: 6, estado: "Ocupada", pers: 3 },
    { num: 7, estado: "Libre", pers: 0 },
    { num: 8, estado: "Ocupada", pers: 2 },
    { num: 9, estado: "Libre", pers: 0 },
    { num: 10, estado: "Ocupada", pers: 5 },
    { num: 11, estado: "Libre", pers: 0 },
    { num: 12, estado: "Ocupada", pers: 2 }
  ];
  var datos_mesas = cargar(CLAVE_MESAS);
  var mesas = datos_mesas !== null ? datos_mesas : mesas_default;
  var lista_mesas = document.getElementById("lista-mesas");
  var panel_mesa = document.getElementById("panel-mesa");
  var form_mesa = document.getElementById("formulario-mesa");
  var inp_pers = document.getElementById("comensales");
  var err_pers = document.getElementById("error-comensales");
  var msg_mesas = document.getElementById("mensaje-mesas");
  var btn_cerrar = document.getElementById("cerrar-mesa");
  var msg_guard_mesas = document.getElementById("estado-guardado");
  var mesa_sel = null;

  function avisar_mesas(texto) {
    if (msg_guard_mesas) {
      msg_guard_mesas.textContent = texto;
    }
  }

  if (datos_mesas !== null) {
    avisar_mesas("Datos de mesas recuperados del navegador.");
  }

  function abrir_panel(m) {
    msg_mesas.textContent = "";
    if (m.estado === "Ocupada") {
      panel_mesa.hidden = true;
      msg_mesas.textContent = "Mesa " + m.num + " ocupada · " + m.pers + " comensales.";
      return;
    }
    mesa_sel = m;
    document.getElementById("titulo-mesa").textContent = "Abrir mesa " + m.num;
    form_mesa.reset();
    err_pers.textContent = "";
    panel_mesa.hidden = false;
    inp_pers.focus();
  }

  function ver_mesas() {
    lista_mesas.innerHTML = "";
    for (var i = 0; i < mesas.length; i++) {
      var m = mesas[i];
      var tarjeta = crear_el("button", "mesa");
      tarjeta.type = "button";
      if (m.estado === "Ocupada") {
        tarjeta.className = "mesa ocupada";
      }
      var head = crear_el("span", "mesa-encabezado", "Mesa " + m.num);
      var cont = crear_el("span", "mesa-contenido");
      var badge = crear_el("span", "insignia", m.estado);
      var det = "Disponible para sentar";
      if (m.estado === "Ocupada") {
        det = m.pers + " comensales · En atención";
      }
      cont.appendChild(badge);
      cont.appendChild(crear_el("small", "", det));
      tarjeta.appendChild(head);
      tarjeta.appendChild(cont);
      (function(mesa) {
        tarjeta.onclick = function() {
          abrir_panel(mesa);
        };
      })(m);
      lista_mesas.appendChild(tarjeta);
    }
  }

  form_mesa.onsubmit = function(e) {
    e.preventDefault();
    var txt = inp_pers.value.trim();
    var n = Number(txt);
    if (txt === "" || !Number.isInteger(n) || n < 1 || n > 20) {
      err_pers.textContent = "Ingresa una cantidad entre 1 y 20.";
      inp_pers.focus();
      return;
    }
    mesa_sel.estado = "Ocupada";
    mesa_sel.pers = n;
    msg_mesas.textContent = "Mesa " + mesa_sel.num + " abierta para " + n + " comensales.";
    panel_mesa.hidden = true;
    if (guardar(CLAVE_MESAS, mesas)) {
      avisar_mesas("Cambios guardados en este navegador.");
    } else {
      avisar_mesas("Cambio solo en memoria. Podría perderse al recargar.");
    }
    ver_mesas();
  };

  btn_cerrar.onclick = function() {
    panel_mesa.hidden = true;
  };

  ver_mesas();
}

// ===================== VISTA DEL MOZO =====================
if (vista === "vista_mozo") {
  var prods = [
    { id: 1, nom: "Lomo Saltado", desc: "Tiras de lomo, cebolla, tomate, arroz y papas.", precio: 42, cat: "Platos de fondo", stock: 18 },
    { id: 2, nom: "Ají de Gallina", desc: "Pechuga deshilachada en salsa de ají amarillo.", precio: 38, cat: "Platos de fondo", stock: 12 },
    { id: 3, nom: "Ceviche Clásico", desc: "Pescado fresco, limón, cebolla y ají.", precio: 45, cat: "Platos de fondo", stock: 9 },
    { id: 4, nom: "Seco de Cordero", desc: "Cordero, cilantro, frejoles y arroz.", precio: 48, cat: "Platos de fondo", stock: 7 },
    { id: 5, nom: "Arroz con Pollo", desc: "Arroz al cilantro, pollo y salsa criolla.", precio: 34, cat: "Platos de fondo", stock: 15 },
    { id: 6, nom: "Tallarines Verdes", desc: "Pasta al pesto peruano con bistec.", precio: 36, cat: "Platos de fondo", stock: 8 },
    { id: 7, nom: "Tequeños", desc: "Seis tequeños con salsa de palta.", precio: 22, cat: "Entradas", stock: 20 },
    { id: 8, nom: "Causa Limeña", desc: "Papa amarilla, pollo, palta y ají amarillo.", precio: 24, cat: "Entradas", stock: 0 },
    { id: 9, nom: "Chicha Morada", desc: "Vaso de chicha morada de la casa.", precio: 8, cat: "Bebidas", stock: 30 },
    { id: 10, nom: "Limonada", desc: "Limonada fresca con hierbabuena.", precio: 9, cat: "Bebidas", stock: 24 },
    { id: 11, nom: "Suspiro Limeño", desc: "Manjar blanco, merengue y canela.", precio: 16, cat: "Postres", stock: 6 },
    { id: 12, nom: "Picarones", desc: "Aros de zapallo y camote con miel.", precio: 18, cat: "Postres", stock: 10 }
  ];
  var datos_pedidos = cargar(CLAVE_PEDIDOS);
  var pedidos = [];
  var id_sig = 2001;
  if (datos_pedidos !== null && datos_pedidos.lista) {
    pedidos = datos_pedidos.lista;
    id_sig = datos_pedidos.sig;
  }
  var lista_prods = document.getElementById("lista-productos");
  var inp_buscar = document.getElementById("buscar-producto");
  var caja_carrito = document.getElementById("carrito");
  var lista_pedidos_div = document.getElementById("pedidos-registrados");
  var err_pedido = document.getElementById("error-pedido");
  var aviso_ok = document.getElementById("mensaje-exito");
  var form_pedido = document.getElementById("formulario-pedido");
  var msg_guard_pedidos = document.getElementById("estado-guardado");
  var cat_actual = "Platos de fondo";
  var carrito = [];

  function avisar_pedidos(texto) {
    if (msg_guard_pedidos) {
      msg_guard_pedidos.textContent = texto;
    }
  }

  if (datos_pedidos !== null) {
    avisar_pedidos("Pedidos recuperados del navegador.");
  }

  function guardar_pedidos() {
    var obj = { lista: pedidos, sig: id_sig };
    if (guardar(CLAVE_PEDIDOS, obj)) {
      avisar_pedidos("Cambios guardados en este navegador.");
    } else {
      avisar_pedidos("Cambio solo en memoria. Podría perderse al recargar.");
    }
  }

  function quitar_uno(id_prod) {
    var nuevo = [];
    for (var i = 0; i < carrito.length; i++) {
      var item = carrito[i];
      if (item.id === id_prod) {
        item.cant = item.cant - 1;
      }
      if (item.cant > 0) {
        nuevo.push(item);
      }
    }
    carrito = nuevo;
    ver_carrito();
  }

  function ver_carrito() {
    caja_carrito.innerHTML = "";
    var total = 0;
    var cant = 0;
    if (carrito.length === 0) {
      caja_carrito.appendChild(crear_el("p", "carrito-vacio", "Agrega platos desde el menú."));
    }
    for (var i = 0; i < carrito.length; i++) {
      var item = carrito[i];
      total = total + item.precio * item.cant;
      cant = cant + item.cant;
      var fila = crear_el("div", "linea-carrito");
      var det = crear_el("div");
      det.appendChild(crear_el("strong", "", item.nom));
      det.appendChild(crear_el("small", "", item.cant + " × " + formato_precio(item.precio)));
      var btn_quitar = crear_el("button", "quitar-producto", "Quitar uno");
      btn_quitar.type = "button";
      (function(id) {
        btn_quitar.onclick = function() {
          quitar_uno(id);
        };
      })(item.id);
      fila.appendChild(det);
      fila.appendChild(btn_quitar);
      caja_carrito.appendChild(fila);
    }
    document.getElementById("total-pedido").textContent = formato_precio(total);
    document.getElementById("cantidad-productos").textContent = cant + " platos";
  }

  function agregar_prod(p) {
    var enc = null;
    for (var i = 0; i < carrito.length; i++) {
      if (carrito[i].id === p.id) {
        enc = carrito[i];
      }
    }
    var cant_act = 0;
    if (enc !== null) {
      cant_act = enc.cant;
    }
    if (cant_act >= p.stock) {
      err_pedido.textContent = "Solo quedan " + p.stock + " unidades de " + p.nom + ".";
      return;
    }
    if (enc !== null) {
      enc.cant = enc.cant + 1;
    } else {
      carrito.push({ id: p.id, nom: p.nom, precio: p.precio, cant: 1 });
    }
    err_pedido.textContent = "";
    aviso_ok.hidden = true;
    ver_carrito();
  }

  function ver_prods() {
    var txt = inp_buscar.value.trim().toLowerCase();
    var vis = [];
    for (var i = 0; i < prods.length; i++) {
      var p = prods[i];
      var texto_prod = (p.nom + " " + p.desc).toLowerCase();
      if (p.cat === cat_actual && texto_prod.indexOf(txt) !== -1) {
        vis.push(p);
      }
    }
    lista_prods.innerHTML = "";
    document.getElementById("sin-productos").hidden = vis.length > 0;
    for (var i = 0; i < vis.length; i++) {
      var p = vis[i];
      var card = crear_el("article", "producto");
      var foto = crear_el("div", "producto-foto", "Foto");
      var info = crear_el("div", "producto-info");
      var nom = crear_el("h3", "", p.nom);
      var desc = crear_el("p", "", p.desc);
      var pie = crear_el("div", "producto-pie");
      var precio = crear_el("span", "producto-precio", formato_precio(p.precio));
      var btn_add = crear_el("button", "boton-agregar", "+");
      btn_add.type = "button";
      if (p.stock === 0) {
        btn_add.disabled = true;
      }
      (function(prod) {
        btn_add.onclick = function() {
          agregar_prod(prod);
        };
      })(p);
      pie.appendChild(precio);
      pie.appendChild(btn_add);
      var txt_stock = p.stock + " disponibles";
      if (p.stock === 0) {
        txt_stock = "Agotado";
      }
      var stock = crear_el("small", "producto-stock", txt_stock);
      info.appendChild(nom);
      info.appendChild(desc);
      info.appendChild(stock);
      info.appendChild(pie);
      card.appendChild(foto);
      card.appendChild(info);
      lista_prods.appendChild(card);
    }
  }

  function ver_pedidos() {
    lista_pedidos_div.innerHTML = "";
    if (pedidos.length === 0) {
      lista_pedidos_div.appendChild(crear_el("p", "mensaje-vacio", "Aún no hay pedidos registrados."));
      return;
    }
    for (var i = 0; i < pedidos.length; i++) {
      var ped = pedidos[i];
      var fila = crear_el("div", "registro-pedido");
      var resumen = "";
      for (var j = 0; j < ped.prods.length; j++) {
        if (j > 0) {
          resumen = resumen + ", ";
        }
        resumen = resumen + ped.prods[j].cant + " × " + ped.prods[j].nom;
      }
      fila.appendChild(crear_el("strong", "", "Pedido #" + ped.id + " · Mesa " + ped.mesa));
      fila.appendChild(crear_el("span", "", ped.pers + " comensales · " + ped.estado));
      fila.appendChild(crear_el("span", "", resumen));
      var btn_estado = crear_el("button", "boton-pequeno", ped.estado === "Registrado" ? "Marcar enviado" : "Reabrir");
      btn_estado.type = "button";
      (function(pedido) {
        btn_estado.onclick = function() {
          if (pedido.estado === "Registrado") {
            pedido.estado = "Enviado";
          } else {
            pedido.estado = "Registrado";
          }
          guardar_pedidos();
          ver_pedidos();
        };
      })(ped);
      var btn_eliminar = crear_el("button", "boton-pequeno", "Eliminar");
      btn_eliminar.type = "button";
      (function(pedido) {
        btn_eliminar.onclick = function() {
          if (!confirm("¿Eliminar pedido #" + pedido.id + "?")) {
            return;
          }
          var nuevo = [];
          for (var k = 0; k < pedidos.length; k++) {
            if (pedidos[k].id !== pedido.id) {
              nuevo.push(pedidos[k]);
            }
          }
          pedidos = nuevo;
          guardar_pedidos();
          ver_pedidos();
        };
      })(ped);
      var acciones = crear_el("div", "acciones-pedido");
      acciones.appendChild(btn_estado);
      acciones.appendChild(btn_eliminar);
      fila.appendChild(acciones);
      lista_pedidos_div.appendChild(fila);
    }
  }

  var botones_cat = document.querySelectorAll("[data-cat]");
  for (var i = 0; i < botones_cat.length; i++) {
    botones_cat[i].onclick = function() {
      cat_actual = this.getAttribute("data-cat");
      for (var j = 0; j < botones_cat.length; j++) {
        botones_cat[j].className = "pestana";
      }
      this.className = "pestana activa";
      ver_prods();
    };
  }

  inp_buscar.oninput = function() {
    ver_prods();
  };

  form_pedido.onsubmit = function(e) {
    e.preventDefault();
    var mesa = document.getElementById("mesa-pedido").value;
    var txt = document.getElementById("personas-pedido").value.trim();
    var pers = Number(txt);
    if (mesa === "") {
      err_pedido.textContent = "Selecciona una mesa.";
    } else if (txt === "" || !Number.isInteger(pers) || pers < 1 || pers > 20) {
      err_pedido.textContent = "Ingresa entre 1 y 20 comensales.";
    } else if (carrito.length === 0) {
      err_pedido.textContent = "Agrega al menos un plato al pedido.";
    } else {
      var ped = { id: id_sig, mesa: Number(mesa), pers: pers, prods: carrito, estado: "Registrado" };
      id_sig = id_sig + 1;
      pedidos.push(ped);
      for (var i = 0; i < carrito.length; i++) {
        for (var j = 0; j < prods.length; j++) {
          if (prods[j].id === carrito[i].id) {
            prods[j].stock = prods[j].stock - carrito[i].cant;
          }
        }
      }
      carrito = [];
      err_pedido.textContent = "";
      form_pedido.reset();
      aviso_ok.hidden = false;
      document.getElementById("detalle-exito").textContent = "Mesa " + ped.mesa + " · Pedido #" + ped.id + ".";
      guardar_pedidos();
      ver_prods();
      ver_carrito();
      ver_pedidos();
    }
  };

  ver_prods();
  ver_carrito();
  ver_pedidos();
}

if (vista === "vista_cocina") {
  var ordenes_default = [
    {
      id: 1041, mesa: 2, estado: "Preparando", urgente: true, min: 2, tiempo: 12,
      platos: [
        { nom: "Ají de Gallina", cant: 1, listo: false },
        { nom: "Arroz con Pollo", cant: 1, listo: false }
      ]
    },
    {
      id: 1043, mesa: 4, estado: "Nuevo", urgente: false, min: 5, tiempo: 12,
      platos: [
        { nom: "Tequeños", cant: 2, listo: false },
        { nom: "Tallarines Verdes", cant: 1, listo: false }
      ]
    }
  ];
  var datos_ordenes = cargar(CLAVE_ORDENES);
  var ordenes = datos_ordenes !== null ? datos_ordenes : ordenes_default;
  var lista_ordenes = document.getElementById("ordenes-cocina");
  var sel_filtro = document.getElementById("filtro-orden");
  var cola_cocina = document.getElementById("cola-cocina");
  var btn_completar = document.getElementById("completar-orden");
  var msg_guard_cocina = document.getElementById("estado-guardado");
  var id_sel = null;

  function avisar_cocina(texto) {
    if (msg_guard_cocina) {
      msg_guard_cocina.textContent = texto;
    }
  }

  if (datos_ordenes !== null) {
    avisar_cocina("Órdenes recuperadas del navegador.");
  }

  function guardar_ordenes() {
    if (guardar(CLAVE_ORDENES, ordenes)) {
      avisar_cocina("Cambios guardados en este navegador.");
    } else {
      avisar_cocina("Cambio solo en memoria. Podría perderse al recargar.");
    }
  }

  function marcar_plato(orden, plato) {
    plato.listo = !plato.listo;
    id_sel = orden.id;
    var todos = true;
    for (var i = 0; i < orden.platos.length; i++) {
      if (!orden.platos[i].listo) {
        todos = false;
      }
    }
    if (todos) {
      orden.estado = "Listo";
    } else {
      orden.estado = "Preparando";
    }
    guardar_ordenes();
    ver_ordenes();
  }

  function ver_ordenes() {
    lista_ordenes.innerHTML = "";
    cola_cocina.innerHTML = "";
    var filtro = sel_filtro.value;
    var vis = [];
    var listas = 0;
    var t_total = 0;
    for (var i = 0; i < ordenes.length; i++) {
      var o = ordenes[i];
      t_total = t_total + o.tiempo;
      if (o.estado === "Listo") {
        listas = listas + 1;
      } else {
        var fila_cola = crear_el("div", "elemento-cola");
        fila_cola.appendChild(crear_el("span", "", "Orden #" + o.id + " · Mesa " + o.mesa));
        fila_cola.appendChild(crear_el("span", "", "En " + o.min + " min"));
        cola_cocina.appendChild(fila_cola);
      }
      if (filtro === "Todas" || o.estado === filtro) {
        vis.push(o);
      }
    }
    document.getElementById("ordenes-listas").textContent = listas;
    var prom = 0;
    if (ordenes.length > 0) {
      prom = Math.round(t_total / ordenes.length);
    }
    document.getElementById("tiempo-estimado").textContent = prom + "m";
    if (vis.length === 0) {
      lista_ordenes.appendChild(crear_el("p", "mensaje-vacio", "No hay órdenes en esta vista."));
    }
    if (cola_cocina.children.length === 0) {
      cola_cocina.appendChild(crear_el("p", "mensaje-vacio", "No hay órdenes en cola."));
    }
    for (var i = 0; i < vis.length; i++) {
      var o = vis[i];
      var card = crear_el("article", "orden");
      if (id_sel === o.id) {
        card.className = "orden seleccionada";
      }
      var head = crear_el("button", "orden-cabecera");
      head.type = "button";
      var ident = crear_el("span", "orden-identidad");
      if (o.urgente) {
        ident.appendChild(crear_el("span", "insignia insignia-urgente", "URGENTE"));
      }
      var tit = crear_el("span");
      tit.appendChild(crear_el("strong", "", "Orden #" + o.id + " · Mesa " + o.mesa));
      tit.appendChild(crear_el("small", "", "En " + o.min + " min"));
      ident.appendChild(tit);
      head.appendChild(ident);
      head.appendChild(crear_el("span", "insignia insignia-estado", o.estado));
      (function(orden) {
        head.onclick = function() {
          id_sel = orden.id;
          ver_ordenes();
        };
      })(o);
      card.appendChild(head);
      for (var j = 0; j < o.platos.length; j++) {
        var p = o.platos[j];
        var fila = crear_el("div", "plato-fila");
        var det = crear_el("span", "plato-dato");
        var clase_nom = "";
        if (p.listo) {
          clase_nom = "plato-listo";
        }
        var nom = crear_el("span", clase_nom, p.nom);
        det.appendChild(crear_el("span", "plato-cantidad", p.cant));
        det.appendChild(nom);
        var txt_btn = "Marcar listo";
        if (p.listo) {
          txt_btn = "Reabrir";
        }
        var btn_listo = crear_el("button", "boton-pequeno", txt_btn);
        btn_listo.type = "button";
        (function(orden, plato) {
          btn_listo.onclick = function() {
            marcar_plato(orden, plato);
          };
        })(o, p);
        fila.appendChild(det);
        fila.appendChild(btn_listo);
        card.appendChild(fila);
      }
      lista_ordenes.appendChild(card);
    }
    var sel = null;
    for (var i = 0; i < ordenes.length; i++) {
      if (ordenes[i].id === id_sel) {
        sel = ordenes[i];
      }
    }
    if (sel !== null) {
      document.getElementById("orden-seleccionada").textContent = "Orden #" + sel.id + " seleccionada.";
    } else {
      document.getElementById("orden-seleccionada").textContent = "Selecciona una orden para completarla.";
    }
    if (sel !== null && sel.estado === "Listo") {
      btn_completar.disabled = false;
    } else {
      btn_completar.disabled = true;
    }
  }

  sel_filtro.onchange = function() {
    ver_ordenes();
  };

  btn_completar.onclick = function() {
    document.getElementById("mensaje-cocina").textContent = "Orden #" + id_sel + " completada.";
    var resto = [];
    for (var i = 0; i < ordenes.length; i++) {
      if (ordenes[i].id !== id_sel) {
        resto.push(ordenes[i]);
      }
    }
    ordenes = resto;
    id_sel = null;
    guardar_ordenes();
    ver_ordenes();
  };

  ver_ordenes();
}
