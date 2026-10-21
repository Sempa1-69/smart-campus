// Settings: тема, параметры кампуса, профиль, сброс данных.
const ctx = initLayout("settings.html");

if (ctx) {
  const settings = loadData(KEYS.settings, { campusName: "Smart Campus University" });
  document.getElementById("campusName").value = settings.campusName || "";
  document.getElementById("profileInfo").innerHTML =
    `${escapeHtml(ctx.user.name)} · <b>${escapeHtml(ctx.user.role)}</b><br><span class="muted">${escapeHtml(ctx.user.email)}</span>`;

  document.getElementById("themeSwitch").onclick = () => toggleTheme();

  document.getElementById("campusForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("campusName").value.trim();
    if (!name) { toast("Название не может быть пустым"); return; }
    saveData(KEYS.settings, { ...settings, campusName: name });
    toast("Сохранено");
  });

  document.getElementById("resetBtn").onclick = () => {
    if (confirm("Сбросить все тестовые данные к исходным?")) {
      resetData();
      toast("Данные сброшены");
    }
  };
}
