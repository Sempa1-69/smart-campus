// Dashboard: KPI, три графика Chart.js и последние уведомления.
const ctx = initLayout("dashboard.html");

if (ctx) {
  const { rooms, devices, incidents, history } = ctx;
  const charts = {};

  function renderKpis() {
    const online = devices.filter((d) => d.status === "online").length;
    const openInc = incidents.filter((i) => i.status !== "done").length;
    const energy = rooms.reduce((s, r) => s + r.energy, 0);
    const alerts = buildNotifications(rooms, devices).length;
    const problem = rooms.filter((r) => r.status !== "normal").length;

    document.getElementById("subtitle").textContent = `${loadData(KEYS.settings, {}).campusName || "Smart Campus"} · обновлено ${nowStamp()}`;
    document.getElementById("kpis").innerHTML = [
      ["Помещений", rooms.length, `${problem} требуют внимания`],
      ["Устройства online", `${online}/${devices.length}`, `${devices.length - online} offline`],
      ["Открытых инцидентов", openInc, `всего ${incidents.length}`],
      ["Энергия сейчас", `${energy.toFixed(1)} кВт·ч`, "сумма по всем помещениям"],
      ["Предупреждений", alerts, "в панели уведомлений"],
    ].map(([t, v, s]) => `<div class="kpi"><small>${t}</small><b>${v}</b><span class="sub">${s}</span></div>`).join("");
  }

  function setupChartDefaults() {
    Chart.defaults.color = cssVar("--muted");
    Chart.defaults.borderColor = cssVar("--line");
    Chart.defaults.maintainAspectRatio = false;
  }

  function renderCharts() {
    Object.values(charts).forEach((c) => c.destroy());
    setupChartDefaults();

    // 1. Энергия по корпусам
    const buildings = [...new Set(rooms.map((r) => r.building))];
    const byBuilding = buildings.map((b) => +rooms.filter((r) => r.building === b).reduce((s, r) => s + r.energy, 0).toFixed(1));
    charts.energy = new Chart(document.getElementById("energyChart"), {
      type: "bar",
      data: { labels: buildings, datasets: [{ label: "Энергия, кВт·ч", data: byBuilding, backgroundColor: cssVar("--accent"), borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    // 2. Тренд средней температуры: история + текущее значение
    const len = Object.values(history)[0]?.temperature.length || 0;
    const avgAt = (i) => +(mean(rooms.map((r) => (i < len ? history[r.id].temperature[i] : r.temperature)))).toFixed(1);
    const points = Array.from({ length: len + 1 }, (_, i) => avgAt(i));
    const labels = points.map((_, i) => (i === len ? "сейчас" : `-${len - i} ч`));
    charts.temp = new Chart(document.getElementById("tempChart"), {
      type: "line",
      data: { labels, datasets: [{ label: "Средняя температура, °C", data: points, borderColor: cssVar("--yellow"), backgroundColor: "transparent", tension: 0.3, pointRadius: 3 }] },
      options: { plugins: { legend: { display: false } } },
    });

    // 3. Online / Offline
    const online = devices.filter((d) => d.status === "online").length;
    charts.devices = new Chart(document.getElementById("deviceChart"), {
      type: "doughnut",
      data: { labels: ["Online", "Offline"], datasets: [{ data: [online, devices.length - online], backgroundColor: [cssVar("--green"), cssVar("--red")], borderWidth: 0 }] },
      options: { plugins: { legend: { position: "bottom" } }, cutout: "62%" },
    });
  }

  function renderAlerts() {
    const notes = buildNotifications(rooms, devices).slice(0, 6);
    document.getElementById("alerts").innerHTML = notes.length
      ? notes.map((n) => `<div class="notif-item ${n.level}"><b>${escapeHtml(n.title)}</b>${escapeHtml(n.text)}</div>`).join("")
      : '<div class="empty">Всё спокойно — предупреждений нет</div>';
  }

  renderKpis();
  renderAlerts();
  renderCharts();
  document.addEventListener("themechange", renderCharts);
}
