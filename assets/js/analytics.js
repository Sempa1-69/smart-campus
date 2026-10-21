// Analytics: аномалии (пороги + z-score), рекомендации, графики, симуляция датчиков.
const ctx = initLayout("analytics.html");

if (ctx) {
  const { rooms, devices, history } = ctx;
  const $ = (id) => document.getElementById(id);
  const RISK_RU = { critical: "Высокий риск", warning: "Средний риск" };
  const charts = {};
  let timer = null;

  rooms.forEach((r) => $("selRoom").add(new Option(r.id, r.id)));

  function persist() {
    saveData(KEYS.rooms, rooms);
    saveData(KEYS.devices, devices);
    saveData(KEYS.history, history);
  }

  function renderKpis(anomalies) {
    const crit = anomalies.filter((a) => a.level === "critical").length;
    const zOnly = anomalies.filter((a) => a.method.includes("z-score")).length;
    $("kpis").innerHTML = [
      ["Аномалий найдено", anomalies.length, "по всем помещениям"],
      ["Высокий риск", crit, "критичные пороги"],
      ["Выявлено z-score", zOnly, `порог |z| > ${Z_LIMIT}`],
      ["Помещений в норме", rooms.filter((r) => r.status === "normal").length, `из ${rooms.length}`],
    ].map(([t, v, s]) => `<div class="kpi"><small>${t}</small><b>${v}</b><span class="sub">${s}</span></div>`).join("");
  }

  function renderAnomalies(anomalies) {
    const risk = $("fRisk").value;
    const list = anomalies.filter((a) => !risk || a.level === risk);
    $("anomalies").innerHTML = list.length
      ? list.map((a) => `<div class="anomaly ${a.level}">
          <div class="top"><b>${escapeHtml(a.roomId)} · ${PARAM_RU[a.param]}: ${a.value} ${PARAM_UNIT[a.param]}</b>
            <span><span class="badge b-${a.level}">${RISK_RU[a.level]}</span> <span class="badge b-low">${a.method}</span></span></div>
          <div class="why">Причина: ${escapeHtml(a.reason)}</div>
          <div class="rec">💡 ${escapeHtml(a.recommendation)}</div></div>`).join("")
      : '<div class="empty">Аномалий не обнаружено ✅</div>';
  }

  function renderRecs() {
    $("recs").innerHTML = rooms.map((r) => `<tr><td><b>${escapeHtml(r.id)}</b></td><td>${statusBadge(r.status)}</td>
      <td style="white-space:normal">${escapeHtml(getRecommendation(r))}</td></tr>`).join("");
  }

  function renderCharts() {
    Object.values(charts).forEach((c) => c.destroy());
    Chart.defaults.color = cssVar("--muted");
    Chart.defaults.borderColor = cssVar("--line");
    Chart.defaults.maintainAspectRatio = false;

    const colors = { normal: cssVar("--green"), warning: cssVar("--yellow"), critical: cssVar("--red") };
    charts.co2 = new Chart($("co2Chart"), {
      type: "bar",
      data: { labels: rooms.map((r) => r.id), datasets: [{ label: "CO₂, ppm", data: rooms.map((r) => r.co2), backgroundColor: rooms.map((r) => colors[levelCo2(r.co2)]), borderRadius: 5 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });

    const id = $("selRoom").value, p = $("selParam").value;
    const series = [...history[id][p], rooms.find((r) => r.id === id)[p]];
    charts.hist = new Chart($("histChart"), {
      type: "line",
      data: {
        labels: series.map((_, i) => (i === series.length - 1 ? "сейчас" : `-${series.length - 1 - i}`)),
        datasets: [{ label: `${PARAM_RU[p]}, ${PARAM_UNIT[p]}`, data: series, borderColor: cssVar("--accent"), tension: 0.3, pointRadius: 3,
          pointBackgroundColor: series.map((_, i) => (i === series.length - 1 ? cssVar("--red") : cssVar("--accent"))) }],
      },
      options: { plugins: { legend: { display: false } } },
    });
  }

  function renderAll() {
    const anomalies = detectAnomalies(rooms, history);
    renderKpis(anomalies);
    renderAnomalies(anomalies);
    renderRecs();
    renderCharts();
  }

  function tick() {
    simulateTick(rooms, devices, history);
    persist();
    renderAll();
  }

  $("simBtn").onclick = () => { tick(); toast("Показания обновлены"); };
  $("autoBtn").onclick = () => {
    if (timer) { clearInterval(timer); timer = null; $("autoBtn").textContent = "Авто: выкл"; }
    else { timer = setInterval(tick, 3000); $("autoBtn").textContent = "Авто: вкл"; }
  };
  ["selRoom", "selParam"].forEach((id) => $(id).addEventListener("input", renderCharts));
  $("fRisk").addEventListener("input", () => renderAnomalies(detectAnomalies(rooms, history)));
  document.addEventListener("themechange", renderCharts);

  renderAll();
}
