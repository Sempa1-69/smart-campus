// Rooms: таблица помещений, поиск, фильтры по корпусу и статусу.
const ctx = initLayout("rooms.html");

if (ctx) {
  const { rooms } = ctx;
  const els = {
    search: document.getElementById("search"),
    building: document.getElementById("fBuilding"),
    status: document.getElementById("fStatus"),
    rows: document.getElementById("rows"),
    count: document.getElementById("count"),
  };

  [...new Set(rooms.map((r) => r.building))].forEach((b) => els.building.add(new Option(b, b)));

  // Глобальный поиск из topbar передаёт запрос в ?q=
  const q = new URLSearchParams(location.search).get("q");
  if (q) els.search.value = q;

  function render() {
    const text = els.search.value.trim().toLowerCase();
    const list = rooms.filter((r) =>
      (!text || [r.id, r.type, r.building].join(" ").toLowerCase().includes(text)) &&
      (!els.building.value || r.building === els.building.value) &&
      (!els.status.value || r.status === els.status.value));

    els.rows.innerHTML = list.length
      ? list.map((r) => `<tr>
          <td><b>${escapeHtml(r.id)}</b></td><td>${escapeHtml(r.building)}</td><td>${r.floor}</td><td>${escapeHtml(r.type)}</td>
          <td>${r.temperature}</td><td>${r.co2}</td><td>${r.energy}</td><td>${r.occupancy}</td><td>${statusBadge(r.status)}</td></tr>`).join("")
      : '<tr><td colspan="9" class="empty">Ничего не найдено</td></tr>';
    els.count.textContent = `Показано ${list.length} из ${rooms.length}`;
  }

  [els.search, els.building, els.status].forEach((el) => el.addEventListener("input", render));
  render();
}
