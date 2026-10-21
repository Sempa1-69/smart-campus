// Incidents: полный CRUD заявок (создание, чтение, изменение, удаление) + поиск и фильтры.
const ctx = initLayout("incidents.html");

if (ctx) {
  const { incidents, rooms, user } = ctx;
  const $ = (id) => document.getElementById(id);
  const PRIO_RU = { high: "High", medium: "Medium", low: "Low" };
  const STAT_RU = { open: "Open", progress: "In progress", done: "Done" };
  const canDelete = user.role !== "Operator";
  let editingId = null;

  rooms.forEach((r) => $("fRoom").add(new Option(`${r.id} — ${r.type}`, r.id)));

  function save() { saveData(KEYS.incidents, incidents); }

  function render() {
    const text = $("search").value.trim().toLowerCase();
    const list = incidents.filter((i) =>
      (!text || [i.title, i.room, i.assignee, i.comment].join(" ").toLowerCase().includes(text)) &&
      (!$("fStatus").value || i.status === $("fStatus").value) &&
      (!$("fPriority").value || i.priority === $("fPriority").value));

    $("rows").innerHTML = list.length
      ? list.map((i) => `<tr>
          <td>${i.id}</td><td><b>${escapeHtml(i.title)}</b></td><td>${escapeHtml(i.room)}</td>
          <td><span class="badge b-${i.priority}">${PRIO_RU[i.priority]}</span></td>
          <td><span class="badge b-${i.status === "progress" ? "progress" : i.status}">${STAT_RU[i.status]}</span></td>
          <td>${escapeHtml(i.assignee)}</td><td style="white-space:normal;min-width:200px">${escapeHtml(i.comment || "")}</td>
          <td><button class="btn secondary sm" data-edit="${i.id}">Изменить</button>
              ${canDelete ? `<button class="btn danger sm" data-del="${i.id}">Удалить</button>` : ""}</td></tr>`).join("")
      : '<tr><td colspan="8" class="empty">Заявок нет</td></tr>';
    $("count").textContent = `Показано ${list.length} из ${incidents.length}`;
  }

  function openModal(inc) {
    editingId = inc ? inc.id : null;
    $("modalTitle").textContent = inc ? `Заявка #${inc.id}` : "Новая заявка";
    $("fTitle").value = inc?.title || "";
    $("fRoom").value = inc?.room || rooms[0].id;
    $("fPrio").value = inc?.priority || "medium";
    $("fStat").value = inc?.status || "open";
    $("fAssignee").value = inc?.assignee || "Инженер";
    $("fComment").value = inc?.comment || "";
    $("formErr").textContent = "";
    $("modalBg").classList.add("open");
    $("fTitle").focus();
  }

  function closeModal() { $("modalBg").classList.remove("open"); }

  $("addBtn").onclick = () => openModal(null);
  $("cancelBtn").onclick = closeModal;
  $("modalBg").addEventListener("click", (e) => { if (e.target === $("modalBg")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("fTitle").value.trim();
    if (title.length < 3) { $("formErr").textContent = "Название — минимум 3 символа."; return; }

    const data = {
      title, room: $("fRoom").value, priority: $("fPrio").value, status: $("fStat").value,
      assignee: $("fAssignee").value, comment: $("fComment").value.trim(),
    };

    if (editingId === null) {
      const nextId = incidents.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      incidents.push({ id: nextId, ...data });
      toast("Заявка создана");
    } else {
      Object.assign(incidents.find((i) => i.id === editingId), data);
      toast("Заявка обновлена");
    }
    save();
    closeModal();
    render();
  });

  $("rows").addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (edit) openModal(incidents.find((i) => i.id === +edit.dataset.edit));
    if (del) {
      const idx = incidents.findIndex((i) => i.id === +del.dataset.del);
      if (idx >= 0 && confirm(`Удалить заявку #${incidents[idx].id}?`)) {
        incidents.splice(idx, 1);
        save();
        render();
        toast("Заявка удалена");
      }
    }
  });

  ["search", "fStatus", "fPriority"].forEach((id) => $(id).addEventListener("input", render));
  render();
}
