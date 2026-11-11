import { escapeHtml } from "../utils/format.js";

export function metricCard(label, value, note, color) {
  return `<div class="metric-card" style="--metric-color:${color}"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><span class="metric-note">${note}</span></div>`;
}

export function showToast(title, message, type = "success") {
  const root = document.querySelector("#toast-root");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === "error" ? "!" : "✓"}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(message)}</small></span><button aria-label="Cerrar">×</button>`;
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  root.append(toast);
  setTimeout(() => toast.remove(), 4200);
}

