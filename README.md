# Don Pedro - avance de la semana 4

Prototipo de las vistas de mesas, comandero y cocina con persistencia en localStorage.

## Cómo abrirlo

Abre `index.html` en un navegador. Desde el menú superior puedes entrar al comandero y a cocina. No se necesita instalar nada ni ejecutar un servidor.

## Archivos

- `index.html`: vista de mesas.
- `mozo.html`: menú y registro de pedidos.
- `cocina.html`: órdenes de ejemplo para cocina.
- `estilos.css`: estilos compartidos.
- `app.js`: datos de ejemplo, interacciones y persistencia de las tres vistas.

## Alcance de esta etapa

Las vistas guardan sus datos en localStorage usando claves propias (`dp-sesion04-mesas-v1`, `dp-sesion04-pedidos-v1`, `dp-sesion04-ordenes-v1`). Los cambios persisten al recargar la página dentro del mismo navegador y origen.

Funcionalidades con persistencia:
- **Mesas**: abrir una mesa la guarda como ocupada y se mantiene al recargar.
- **Comandero**: los pedidos registrados se conservan tras recargar. Cada pedido puede cambiar de estado (Registrado/Enviado) o eliminarse, y esos cambios persisten.
- **Cocina**: marcar platos como listos y completar órdenes se guarda y se mantiene al recargar.

Los datos pertenecen al navegador y al origen. No se comparten entre equipos ni navegadores. Si localStorage falla, se muestra un aviso y el cambio queda solo en memoria.
