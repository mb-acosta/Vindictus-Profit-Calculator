// Shared helpers, formatters, theme toggle and nav — loaded on every page before the page script.

const store = {
  read(key, fallback) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

const gold = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function parseNum(text) {
  const clean = String(text).trim().toLowerCase().replace(/[, ]/g, "");
  const match = clean.match(/^([\d.]+)([kmb]?)$/);
  if (!match) return null;
  const scale = { "": 1, k: 1e3, m: 1e6, b: 1e9 }[match[2]];
  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? Math.round(n * scale) : null;
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function cell(node, className) { const td = document.createElement("td"); if (className) td.className = className; td.append(node); return td; }
function textCell(text, className) { const td = document.createElement("td"); if (className) td.className = className; td.textContent = text; return td; }
function subLine(text) { const div = document.createElement("div"); div.className = "usd-sub"; div.textContent = text; return div; }
function span(className, text) { const el = document.createElement("span"); el.className = className; el.textContent = text; return el; }
function editCell(value, onChange) { const td = document.createElement("td"); const input = document.createElement("input"); input.value = value; input.style.width = "14ch"; input.addEventListener("blur", () => onChange(input.value)); td.append(input); return td; }

function numInput(value, onChange) {
  const input = document.createElement("input");
  input.className = "num-in"; input.inputMode = "decimal"; input.autocomplete = "off";
  input.value = gold.format(value);
  input.addEventListener("focus", () => { input.value = value ? String(value) : ""; input.select(); });
  input.addEventListener("blur", () => { const parsed = parseNum(input.value) ?? 0; value = parsed; input.value = gold.format(parsed); onChange(parsed); });
  return input;
}

// Theme toggle — present in the header on every page.
const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const next = current ? (current === "dark" ? "light" : "dark") : (prefersDark ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", next);
    store.write("vpc.theme", next);
  });
}
const savedTheme = store.read("vpc.theme", null);
if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

// Highlight the current nav link.
for (const link of document.querySelectorAll(".tab")) {
  if (link.dataset.page === document.body.dataset.page) link.classList.add("active");
}
