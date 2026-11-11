import { App } from "./app-core.js";
import "./views/tables.js";
import "./views/menu.js";
import "./views/confirmation.js";
import "./views/kitchen.js";
import "./views/admin.js";
import "./components/modals.js";
import "./events.js";

App.init().catch((error) => {
  document.querySelector("#app").innerHTML = `<section class="loading-screen"><div><p>No se pudo iniciar el sistema.</p><button class="button" onclick="location.reload()">Reintentar</button></div></section>`;
  console.error(error);
});
