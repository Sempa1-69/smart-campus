// Общий каркас страниц: Sidebar + Topbar + уведомления + тема. Подключается на всех внутренних страницах.

const NAV = [
  ["dashboard.html", "📊", "Dashboard"],
  ["rooms.html", "🏫", "Rooms"],
  ["devices.html", "📡", "Devices"],
  ["incidents.html", "🛠", "Incidents"],
  ["analytics.html", "🧠", "Analytics"],
  ["settings.html", "⚙️", "Settings"],
];

// Загружает данные, пересчитывает статусы и возвращает «состояние» страницы
function getState() {
  initData();
  const rooms = refreshStatuses(loadData(KEYS.rooms));
  saveData(KEYS.rooms, rooms);
  return {
    rooms,
    devices: loadData(KEYS.devices),
    incidents: loadData(KEYS.incidents),
    history: loadData(KEYS.history, {}),
  };
}

function initLayout(active) {
  applyTheme();
  if (!requireLogin()) return null;

  const user = getUser();
  const state = getState();
  const notes = buildNotifications(state.rooms, state.devices);

  document.getElementById("sidebar").innerHTML = `
    <div class="brand"><span class="logo">🎓</span> Smart Campus AI</div>
    ${NAV.map(([href, icon, label]) => `<a class="nav ${href === active ? "active" : ""}" href="${href}"><span>${icon}</span>${label}</a>`).join("")}
    <div class="spacer"></div>
    <button class="btn secondary" id="logoutBtn" type="button">Выйти</button>`;

  document.getElementById("topbar").innerHTML = `
    <button class="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Меню">☰</button>
    <input class="search-global" id="globalSearch" type="search" placeholder="Поиск по аудиториям и устройствам (Enter)">
    <div class="right">
      <button class="icon-btn" id="themeBtn" type="button" title="Сменить тему" aria-label="Сменить тему">🌓</button>
      <div class="notif-wrap">
        <button class="icon-btn" id="notifBtn" type="button" aria-label="Уведомления">🔔${notes.length ? `<span class="count">${notes.length}</span>` : ""}</button>
        <div class="notif-panel" id="notifPanel">
          <h3 style="margin:4px 6px 10px">Уведомления (${notes.length})</h3>
          ${notes.length
            ? notes.map((n) => `<div class="notif-item ${n.level}"><b>${escapeHtml(n.title)}</b>${escapeHtml(n.text)}</div>`).join("")
            : '<div class="empty">Нет предупреждений</div>'}
        </div>
      </div>
      <div class="profile"><div class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div><div class="pname"><b>${escapeHtml(user.name)}</b><br><small class="muted">${escapeHtml(user.role)}</small></div></div>
    </div>`;

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(KEYS.user);
    location.href = "index.html";
  };
  document.getElementById("themeBtn").onclick = () => {
    toggleTheme();
    document.dispatchEvent(new Event("themechange"));
  };
  document.getElementById("menuBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("notifBtn").onclick = (e) => {
    e.stopPropagation();
    document.getElementById("notifPanel").classList.toggle("open");
  };
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".notif-wrap")) document.getElementById("notifPanel").classList.remove("open");
    if (!e.target.closest("#sidebar") && !e.target.closest("#menuBtn")) document.getElementById("sidebar").classList.remove("open");
  });
  document.getElementById("globalSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) location.href = `rooms.html?q=${encodeURIComponent(e.target.value.trim())}`;
  });

  return { user, ...state };
}

// Цвета графиков берутся из CSS-переменных, чтобы работала светлая тема
function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function statusBadge(level) {
  return `<span class="badge b-${level}">${LEVEL_RU[level] || level}</span>`;
}
