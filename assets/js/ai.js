// «AI Analytics»: пороги + z-score + rule-based рекомендации.
// Это не генеративный AI: всё считается статистикой и правилами прямо в браузере.

const LEVEL_RANK = { normal: 0, warning: 1, critical: 2 };
const LEVEL_RU = { normal: "Норма", warning: "Предупреждение", critical: "Критично" };
const PARAM_RU = { temperature: "Температура", co2: "CO₂", energy: "Энергопотребление" };
const PARAM_UNIT = { temperature: "°C", co2: "ppm", energy: "кВт·ч" };

// Минимальное стандартное отклонение: защищает от ложных тревог на «плоской» истории
const MIN_SD = { temperature: 0.3, co2: 30, energy: 0.2 };
const Z_LIMIT = 2;

// ---------- Статистика ----------
function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values) {
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function zScore(values, current, minSd = 0) {
  const sd = Math.max(stdDev(values), minSd);
  if (sd === 0) return 0;
  return Math.abs((current - mean(values)) / sd);
}

// ---------- Пороги ----------
function worst(a, b) {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

function levelTemperature(t) {
  if (t >= 32) return "critical";
  if (t > 27 || t < 18) return "warning";
  return "normal";
}

function levelCo2(c) {
  if (c >= 1500) return "critical";
  if (c >= 1000) return "warning";
  return "normal";
}

function levelEnergy(e, baseline) {
  if (!baseline) return "normal";
  if (e >= baseline * 1.6) return "critical";
  if (e >= baseline * 1.3) return "warning";
  return "normal";
}

function paramLevel(room, param) {
  if (param === "temperature") return levelTemperature(room.temperature);
  if (param === "co2") return levelCo2(room.co2);
  return levelEnergy(room.energy, room.baseline);
}

// Общий статус помещения = худший из трёх параметров
function evaluateRoom(room) {
  return ["temperature", "co2", "energy"].reduce((acc, p) => worst(acc, paramLevel(room, p)), "normal");
}

function refreshStatuses(rooms) {
  rooms.forEach((r) => (r.status = evaluateRoom(r)));
  return rooms;
}

// ---------- Рекомендации ----------
function getRecommendation(room) {
  const isServer = room.type === "Серверная";

  if (room.co2 >= 1500) return "Критический CO₂: включить вентиляцию, проветрить и проверить заполненность аудитории.";
  if (room.temperature >= 32) return isServer
    ? "Перегрев серверной: проверить кондиционер, включить резервное охлаждение, уведомить администратора."
    : "Перегрев: проверить кондиционер или систему вентиляции.";
  if (!isServer && room.occupancy === 0 && room.energy > 4) return "В помещении нет людей, но энергопотребление высокое: отключить свет и технику.";
  if (room.co2 >= 1000) return "CO₂ выше нормы: усилить вентиляцию, при возможности сократить время занятия.";
  if (room.temperature > 27) return "Температура выше нормы: проверить климат-контроль и закрыть окна от солнца.";
  if (room.temperature < 18) return "Слишком холодно: проверить отопление.";
  if (levelEnergy(room.energy, room.baseline) !== "normal") return "Перерасход энергии относительно базовой линии: проверить оборудование и режим освещения.";
  return "Параметры в норме.";
}

function recommendationFor(room, param, level) {
  if (param === "co2") return level === "critical" ? "Включить вентиляцию, проветрить, проверить заполненность аудитории." : "Усилить вентиляцию, следить за динамикой CO₂.";
  if (param === "temperature") {
    if (room.type === "Серверная") return "Проверить кондиционер серверной, включить резервное охлаждение.";
    return level === "critical" ? "Срочно проверить кондиционер и вентиляцию." : "Проверить климат-контроль и источник тепла.";
  }
  if (room.occupancy === 0 && room.type !== "Серверная") return "Людей нет, а потребление высокое: отключить свет и технику, создать заявку.";
  return "Проверить оборудование и режим работы, сравнить со средним по корпусу.";
}

// ---------- Поиск аномалий ----------
// Для каждого параметра каждого помещения: порог + z-score по истории. Итог — одна запись на пару «помещение/параметр».
function detectAnomalies(rooms, history) {
  const result = [];

  rooms.forEach((room) => {
    ["temperature", "co2", "energy"].forEach((param) => {
      const thrLevel = paramLevel(room, param);
      const hist = history?.[room.id]?.[param] || [];
      const z = hist.length >= 5 ? zScore(hist, room[param], MIN_SD[param]) : 0;
      const zFlag = z > Z_LIMIT;

      if (thrLevel === "normal" && !zFlag) return;

      const level = thrLevel !== "normal" ? thrLevel : "warning";
      const reasons = [];
      if (thrLevel !== "normal") reasons.push(`значение ${room[param]} ${PARAM_UNIT[param]} вышло за порог (${LEVEL_RU[thrLevel].toLowerCase()})`);
      if (zFlag) reasons.push(`статистическая аномалия: z = ${z.toFixed(1)} (среднее по истории ${mean(hist).toFixed(1)} ${PARAM_UNIT[param]})`);

      result.push({
        roomId: room.id,
        building: room.building,
        param,
        value: room[param],
        level,
        z: +z.toFixed(2),
        method: thrLevel !== "normal" && zFlag ? "порог + z-score" : thrLevel !== "normal" ? "порог" : "z-score",
        reason: reasons.join("; "),
        recommendation: recommendationFor(room, param, level),
      });
    });

    // Правило «пустая комната, но много энергии» — отдельная аномалия поведения
    if (room.occupancy === 0 && room.type !== "Серверная" && room.energy > 4 && !result.some((a) => a.roomId === room.id && a.param === "energy")) {
      result.push({
        roomId: room.id, building: room.building, param: "energy", value: room.energy, level: "warning", z: 0, method: "правило",
        reason: "в помещении нет людей, но потребление выше 4 кВт·ч",
        recommendation: "Отключить свет и технику.",
      });
    }
  });

  return result.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || b.z - a.z);
}

// ---------- Уведомления ----------
function buildNotifications(rooms, devices) {
  const list = [];
  rooms.forEach((r) => {
    if (levelCo2(r.co2) !== "normal") list.push({ level: levelCo2(r.co2), title: `Высокий CO₂ в ${r.id}`, text: `${r.co2} ppm` });
    if (levelTemperature(r.temperature) !== "normal") list.push({ level: levelTemperature(r.temperature), title: `Температура в ${r.id}`, text: `${r.temperature} °C` });
    if (levelEnergy(r.energy, r.baseline) !== "normal") list.push({ level: levelEnergy(r.energy, r.baseline), title: `Перерасход энергии в ${r.id}`, text: `${r.energy} кВт·ч при норме ${r.baseline}` });
  });
  devices.filter((d) => d.status === "offline").forEach((d) => list.push({ level: "warning", title: `Устройство offline: ${d.id}`, text: `Помещение ${d.room}, последнее обновление ${d.updatedAt}` }));
  return list.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
}

// ---------- Симуляция датчиков ----------
function randomBetween(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(1);
}

// Один «тик»: текущее значение уходит в историю, новое — небольшой шаг; иногда выброс.
function simulateTick(rooms, devices, history) {
  rooms.forEach((room) => {
    const h = history[room.id];
    ["temperature", "co2", "energy"].forEach((p) => {
      h[p].push(room[p]);
      if (h[p].length > HISTORY_POINTS) h[p].shift();
    });

    // Обычный шаг сопоставим с «шумом» истории (NOISE); значения тянутся к «типичному» уровню помещения,
    // а редкий независимый выброс (~4% на параметр) создаёт настоящую аномалию.
    const def = DEFAULT_ROOMS.find((d) => d.id === room.id) || room;
    const step = (p, spikeRange) => {
      const target = TYPICAL[room.id]?.[p] ?? def[p];
      const spike = Math.random() < 0.04 ? randomBetween(spikeRange[0], spikeRange[1]) : 0;
      return room[p] + (target - room[p]) * 0.25 + randomBetween(-NOISE[p], NOISE[p]) + spike;
    };
    room.temperature = +Math.min(35, Math.max(17, step("temperature", [3, 6]))).toFixed(1);
    room.co2 = Math.round(Math.min(1900, Math.max(420, step("co2", [500, 900]))));
    room.energy = +Math.min(9, Math.max(1, step("energy", [1.5, 3]))).toFixed(1);
    if (room.occupancy > 0) room.occupancy = Math.max(0, room.occupancy + Math.round(randomBetween(-3, 3)));
  });

  const stamp = nowStamp();
  devices.forEach((d) => {
    if (d.status !== "online") return;
    const room = rooms.find((r) => r.id === d.room);
    const param = { "Temperature Sensor": "temperature", "CO2 Sensor": "co2", "Energy Meter": "energy" }[d.type];
    if (room && param) d.value = room[param];
    d.updatedAt = stamp;
  });

  refreshStatuses(rooms);
}
