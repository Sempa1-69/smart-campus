// Слой хранения: localStorage с безопасным чтением и значениями по умолчанию.
const KEYS = {
  rooms: "sc_rooms",
  devices: "sc_devices",
  incidents: "sc_incidents",
  history: "sc_history",
  settings: "sc_settings",
  user: "sc_user",
  theme: "theme",
};

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage недоступен:", e);
  }
}

function loadData(key, fallback = []) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {
    return fallback;
  }
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Первый запуск: заполняем хранилище тестовыми данными из data.js
function initData() {
  if (!localStorage.getItem(KEYS.rooms)) saveData(KEYS.rooms, structuredClone(DEFAULT_ROOMS));
  if (!localStorage.getItem(KEYS.devices)) saveData(KEYS.devices, structuredClone(DEFAULT_DEVICES));
  if (!localStorage.getItem(KEYS.incidents)) saveData(KEYS.incidents, structuredClone(DEFAULT_INCIDENTS));
  if (!localStorage.getItem(KEYS.history)) saveData(KEYS.history, buildHistory(loadData(KEYS.rooms)));
  if (!localStorage.getItem(KEYS.settings)) saveData(KEYS.settings, { campusName: "Smart Campus University", energyBaseline: 4.0 });
}

// Сброс учебных данных (кроме пользователя и темы)
function resetData() {
  [KEYS.rooms, KEYS.devices, KEYS.incidents, KEYS.history, KEYS.settings].forEach((k) => localStorage.removeItem(k));
  initData();
}

function getUser() {
  return loadData(KEYS.user, null);
}

// Учебная «защита»: если не вошли — отправляем на страницу входа
function requireLogin() {
  if (!getUser()) {
    location.href = "index.html";
    return false;
  }
  return true;
}

function applyTheme() {
  let t = "dark";
  try { t = localStorage.getItem(KEYS.theme) || "dark"; } catch (e) {}
  document.body.classList.toggle("light", t === "light");
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  try { localStorage.setItem(KEYS.theme, isLight ? "light" : "dark"); } catch (e) {}
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
