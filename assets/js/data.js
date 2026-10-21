// Тестовые данные кампуса. После первого запуска копируются в localStorage.
// baseline — «обычное» потребление помещения (кВт·ч), от него считается перерасход (+30% / +60%).

const DEFAULT_ROOMS = [
  { id: "A-101", building: "Корпус A", floor: 1, type: "Компьютерный класс", temperature: 24.3, co2: 780,  energy: 3.6, baseline: 3.5, occupancy: 18, status: "normal" },
  { id: "A-102", building: "Корпус A", floor: 1, type: "Лекционная аудитория", temperature: 23.1, co2: 650,  energy: 2.8, baseline: 2.8, occupancy: 40, status: "normal" },
  { id: "A-205", building: "Корпус A", floor: 2, type: "Лекционная аудитория", temperature: 26.8, co2: 1620, energy: 4.4, baseline: 3.2, occupancy: 62, status: "normal" },
  { id: "A-210", building: "Корпус A", floor: 2, type: "Лаборатория",          temperature: 25.0, co2: 900,  energy: 5.1, baseline: 4.5, occupancy: 12, status: "normal" },
  { id: "B-101", building: "Корпус B", floor: 1, type: "Компьютерный класс",   temperature: 26.9, co2: 1050, energy: 4.0, baseline: 3.6, occupancy: 22, status: "normal" },
  { id: "B-102", building: "Корпус B", floor: 1, type: "Лаборатория физики",   temperature: 31.4, co2: 880,  energy: 5.5, baseline: 3.5, occupancy: 8,  status: "normal" },
  { id: "B-203", building: "Корпус B", floor: 2, type: "Учебная аудитория",    temperature: 22.7, co2: 700,  energy: 2.4, baseline: 2.5, occupancy: 25, status: "normal" },
  { id: "B-301", building: "Корпус B", floor: 3, type: "Конференц-зал",        temperature: 23.5, co2: 600,  energy: 2.0, baseline: 2.0, occupancy: 0,  status: "normal" },
  { id: "C-001", building: "Корпус C", floor: 0, type: "Серверная",            temperature: 33.2, co2: 450,  energy: 7.1, baseline: 6.5, occupancy: 0,  status: "normal" },
  { id: "C-104", building: "Корпус C", floor: 1, type: "Учебная аудитория",    temperature: 24.0, co2: 820,  energy: 3.1, baseline: 3.0, occupancy: 30, status: "normal" },
  { id: "C-205", building: "Корпус C", floor: 2, type: "Компьютерный класс",   temperature: 25.4, co2: 950,  energy: 5.0, baseline: 3.5, occupancy: 0,  status: "normal" },
  { id: "D-101", building: "Корпус D", floor: 1, type: "Библиотека",           temperature: 22.9, co2: 720,  energy: 2.2, baseline: 2.3, occupancy: 35, status: "normal" },
  { id: "D-102", building: "Корпус D", floor: 1, type: "Административный офис", temperature: 23.8, co2: 640,  energy: 1.9, baseline: 2.0, occupancy: 6,  status: "normal" },
  { id: "D-201", building: "Корпус D", floor: 2, type: "Лаборатория робототехники", temperature: 24.9, co2: 990, energy: 4.6, baseline: 4.4, occupancy: 14, status: "normal" },
];

// Спецификация устройств: [id, room, type, status, unit, параметр помещения]
const DEVICE_SPECS = [
  ["TEMP-A101-01", "A-101", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-A102-01", "A-102", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-A205-01", "A-205", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-A210-01", "A-210", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-B101-01", "B-101", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-B102-01", "B-102", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-B203-01", "B-203", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-B301-01", "B-301", "Temperature Sensor", "offline", "°C",  "temperature"],
  ["TEMP-C001-01", "C-001", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-C104-01", "C-104", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-C205-01", "C-205", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-D101-01", "D-101", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["TEMP-D102-01", "D-102", "Temperature Sensor", "offline", "°C",  "temperature"],
  ["TEMP-D201-01", "D-201", "Temperature Sensor", "online",  "°C",  "temperature"],
  ["CO2-A101-01",  "A-101", "CO2 Sensor",         "online",  "ppm", "co2"],
  ["CO2-A205-01",  "A-205", "CO2 Sensor",         "online",  "ppm", "co2"],
  ["CO2-B101-01",  "B-101", "CO2 Sensor",         "online",  "ppm", "co2"],
  ["CO2-C104-01",  "C-104", "CO2 Sensor",         "offline", "ppm", "co2"],
  ["CO2-C205-01",  "C-205", "CO2 Sensor",         "online",  "ppm", "co2"],
  ["CO2-D101-01",  "D-101", "CO2 Sensor",         "online",  "ppm", "co2"],
  ["PWR-A210-01",  "A-210", "Energy Meter",       "online",  "kWh", "energy"],
  ["PWR-B102-01",  "B-102", "Energy Meter",       "online",  "kWh", "energy"],
  ["PWR-C001-01",  "C-001", "Energy Meter",       "online",  "kWh", "energy"],
  ["PWR-C205-01",  "C-205", "Energy Meter",       "online",  "kWh", "energy"],
  ["CAM-A101-01",  "A-101", "Camera",             "online",  "",    null],
  ["ACC-C001-01",  "C-001", "Access Control",     "online",  "",    null],
];

function nowStamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

// Значение датчика берётся из помещения, чтобы данные не расходились
function buildDevices(rooms) {
  return DEVICE_SPECS.map(([id, room, type, status, unit, param]) => {
    const r = rooms.find((x) => x.id === room);
    const dev = { id, room, type, status, unit, value: param && r ? r[param] : "—", updatedAt: nowStamp() };
    if (status === "offline") dev.updatedAt = "2026-10-19 08:40"; // давно не выходил на связь
    return dev;
  });
}

const DEFAULT_DEVICES = buildDevices(DEFAULT_ROOMS);

const DEFAULT_INCIDENTS = [
  { id: 1, title: "Высокий уровень CO2", room: "A-205", priority: "high", status: "open", assignee: "Инженер", comment: "Переполненная аудитория, вентиляция не справляется." },
  { id: 2, title: "Перегрев серверной", room: "C-001", priority: "high", status: "progress", assignee: "Администратор", comment: "Проверить кондиционер, резервное охлаждение." },
  { id: 3, title: "Датчик температуры не отвечает", room: "B-301", priority: "medium", status: "open", assignee: "Инженер", comment: "Нет данных более 2 суток." },
  { id: 4, title: "Свет горит в пустом классе", room: "C-205", priority: "low", status: "open", assignee: "Оператор", comment: "Занятость 0, потребление выше нормы." },
  { id: 5, title: "Замена фильтра вентиляции", room: "D-101", priority: "low", status: "done", assignee: "Инженер", comment: "Выполнено 2026-10-14." },
];

// ---------- История показаний (для z-score и графиков) ----------
// Детерминированный генератор, чтобы история была одинаковой при каждом сбросе
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// «Обычные» значения для помещений, где сейчас аномалия: история строится вокруг них
const TYPICAL = {
  "A-205": { co2: 880 },
  "B-102": { temperature: 24.2, energy: 3.4 },
  "C-205": { energy: 3.4 },
  "C-001": { temperature: 24.5 },
  "B-101": { co2: 860 },
};
const NOISE = { temperature: 0.45, co2: 45, energy: 0.22 };
const HISTORY_POINTS = 12;

function buildHistory(rooms) {
  const rnd = mulberry32(2026);
  const history = {};
  rooms.forEach((r) => {
    history[r.id] = {};
    ["temperature", "co2", "energy"].forEach((p) => {
      const base = TYPICAL[r.id]?.[p] ?? r[p];
      history[r.id][p] = Array.from({ length: HISTORY_POINTS }, () => {
        const v = base + (rnd() - 0.5) * 2 * NOISE[p];
        return p === "co2" ? Math.round(v) : +v.toFixed(1);
      });
    });
  });
  return history;
}
