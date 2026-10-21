// Devices: список IoT-устройств, поиск, фильтры, переключение online/offline.
const ctx = initLayout("devices.html");

if (ctx) {
  const { devices, user } = ctx;
  const els = {
    search: document.getElementById("search"),
    status: document.getElementById("fStatus"),
    type: document.getElementById("fType"),
    rows: document.getElementById("rows"),
    count: document.getElementById("count"),
  };

  [...new Set(devices.map((d) => d.type))].forEach((t) => els.type.add(new Option(t, t)));
  const canEdit = user.role !== "Operator"; // имитация ролей: оператор только смотрит

  function render() {
    const text = els.search.value.trim().toLowerCase();
    const list = devices.filter((d) =>
      (!text || [d.id, d.room, d.type].join(" ").toLowerCase().includes(text)) &&
      (!els.status.value || d.status === els.status.value) &&
      (!els.type.value || d.type === els.type.value));

    els.rows.innerHTML = list.length
      ? list.map((d) => `<tr>
          <td><b>${escapeHtml(d.id)}</b></td><td>${escapeHtml(d.room)}</td><td>${escapeHtml(d.type)}</td>
          <td><span class="badge b-${d.status}">${d.status}</span></td>
          <td>${d.value === "—" ? "—" : `${d.value} ${escapeHtml(d.unit)}`}</td><td>${escapeHtml(d.updatedAt)}</td>
          <td>${canEdit ? `<button class="btn secondary sm" data-id="${escapeHtml(d.id)}">${d.status === "online" ? "Отключить" : "Включить"}</button>` : ""}</td></tr>`).join("")
      : '<tr><td colspan="7" class="empty">Ничего не найдено</td></tr>';
    els.count.textContent = `Показано ${list.length} из ${devices.length} · online: ${devices.filter((d) => d.status === "online").length}`;
  }

  els.rows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const d = devices.find((x) => x.id === btn.dataset.id);
    d.status = d.status === "online" ? "offline" : "online";
    d.updatedAt = nowStamp();
    saveData(KEYS.devices, devices);
    render();
    toast(`${d.id}: ${d.status}`);
  });

  [els.search, els.status, els.type].forEach((el) => el.addEventListener("input", render));
  render();
}
