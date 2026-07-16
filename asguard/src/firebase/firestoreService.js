import { db, isFirebaseConfigured } from "./client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  limit,
  orderBy,
  where,
  getCountFromServer,
} from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────
const ENERGY_LOGS = "energy_logs";
const USERS = "users";
const CARBON_FACTOR_KG_PER_KWH = 0.82; // India CEA grid emission factor

// Cache for Dataset Reference Date
let cachedReferenceDate = null;

// Query Cache to prevent massive Firebase reads on navigation/re-mounts
const queryCache = {
  todayLogs: { data: null, timestamp: 0 },
  weeklyLogs: { data: null, timestamp: 0 },
  monthlyLogs: { data: null, timestamp: 0 },
  latestDeviceStates: { data: null, timestamp: 0 },
};
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes caching

// ─── Icon Type Mapping Helpers ────────────────────────────────────────────────

export function getRoomIcon(roomType) {
  const map = {
    living_room: "Sofa",
    bedroom: "Bed",
    kitchen: "Utensils",
    bathroom: "Bath",
    toilet: "Bath",
    dining: "Utensils",
    office: "Sofa",
    balcony: "Sofa",
  };
  return map[roomType] || "Home";
}

export function getApplianceIcon(applianceType) {
  const map = {
    ac: "Wind",
    tv: "Tv",
    light: "Lightbulb",
    lighting: "Lightbulb",
    fan: "Fan",
    ceiling_fan: "Fan",
    exhaust_fan: "Fan",
    curtain: "Blinds",
    blind: "Blinds",
    refrigerator: "Refrigerator",
    fridge: "Refrigerator",
    geyser: "Flame",
    water_heater: "Flame",
    washing_machine: "Shirt",
    iron: "Flame",
    microwave: "Flame",
    router: "Wifi",
    computer: "Tv",
    laptop: "Tv",
  };
  return map[applianceType] || "Zap";
}

// ─── Dataset Reference Date Helper ────────────────────────────────────────────

/**
 * Retrieves the Dataset Reference Date dynamically from the newest log in firestore.
 * Caches the result to avoid redundant queries.
 */
export async function getDatasetReferenceDate(houseId) {
  if (cachedReferenceDate) {
    return cachedReferenceDate;
  }

  const defaultFallback = {
    referenceDate: "2026-06-30",
    referenceMonth: "06",
    referenceYear: "2026",
    monthPrefix: "2026-06",
    dayOfReferenceDate: 30,
  };

  if (!isFirebaseConfigured || !db) {
    return defaultFallback;
  }

  try {
    const q = query(
      collection(db, ENERGY_LOGS),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      cachedReferenceDate = defaultFallback;
      return cachedReferenceDate;
    }

    const latestDoc = snap.docs[0].data();
    const dateStr = latestDoc.date; // e.g. "2026-06-30"

    if (!dateStr || typeof dateStr !== "string") {
      cachedReferenceDate = defaultFallback;
      return cachedReferenceDate;
    }

    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      cachedReferenceDate = defaultFallback;
      return cachedReferenceDate;
    }

    cachedReferenceDate = {
      referenceDate: dateStr,
      referenceMonth: parts[1],
      referenceYear: parts[0],
      monthPrefix: `${parts[0]}-${parts[1]}`,
      dayOfReferenceDate: parseInt(parts[2], 10) || 30,
    };

    return cachedReferenceDate;
  } catch (err) {
    console.warn("getDatasetReferenceDate error, using fallback:", err.message);
    return defaultFallback;
  }
}

/**
 * Returns helper dates for the weekly calculations based on a starting reference date.
 */
function getWeeklyDateStrings(refDateStr) {
  const dates = [];
  const refDate = new Date(refDateStr + "T00:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(refDate);
    d.setUTCDate(refDate.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Fetch user profile document
 */
export async function fetchUserProfile(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, USERS, uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("fetchUserProfile error:", err.message);
    return null;
  }
}

/**
 * Get total count of energy_logs for a house (no doc download)
 */
export async function fetchLogCount(houseId) {
  if (!isFirebaseConfigured || !db || !houseId) return 0;
  try {
    const q = query(
      collection(db, ENERGY_LOGS),
      where("house_id", "==", houseId)
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch (err) {
    console.warn("fetchLogCount error:", err.message);
    return 0;
  }
}

/**
 * Fetch today's logs for a house based on the dataset reference date
 */
export async function fetchTodayLogs(houseId) {
  if (!isFirebaseConfigured || !db || !houseId) return [];
  const now = Date.now();
  if (queryCache.todayLogs.data && (now - queryCache.todayLogs.timestamp < CACHE_DURATION_MS)) {
    return queryCache.todayLogs.data;
  }
  try {
    const ref = await getDatasetReferenceDate(houseId);
    const q = query(
      collection(db, ENERGY_LOGS),
      where("house_id", "==", houseId),
      where("date", "==", ref.referenceDate)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    queryCache.todayLogs = { data, timestamp: now };
    return data;
  } catch (err) {
    console.warn("fetchTodayLogs error:", err.message);
    return [];
  }
}

/**
 * Fetch last 7 days of logs for a house based on the dataset reference date.
 */
export async function fetchWeeklyLogs(houseId) {
  if (!isFirebaseConfigured || !db || !houseId) return [];
  const now = Date.now();
  if (queryCache.weeklyLogs.data && (now - queryCache.weeklyLogs.timestamp < CACHE_DURATION_MS)) {
    return queryCache.weeklyLogs.data;
  }
  try {
    const ref = await getDatasetReferenceDate(houseId);
    const last7 = new Set(getWeeklyDateStrings(ref.referenceDate));
    const q = query(
      collection(db, ENERGY_LOGS),
      orderBy("timestamp", "desc"),
      limit(5000)
    );
    const snap = await getDocs(q);
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((log) => log.house_id === houseId && last7.has(log.date));
    queryCache.weeklyLogs = { data, timestamp: now };
    return data;
  } catch (err) {
    console.warn("fetchWeeklyLogs error:", err.message);
    return [];
  }
}

/**
 * Fetch current month's logs for a house based on the dataset reference date.
 */
export async function fetchMonthlyLogs(houseId) {
  if (!isFirebaseConfigured || !db || !houseId) return [];
  const now = Date.now();
  if (queryCache.monthlyLogs.data && (now - queryCache.monthlyLogs.timestamp < CACHE_DURATION_MS)) {
    return queryCache.monthlyLogs.data;
  }
  try {
    const ref = await getDatasetReferenceDate(houseId);
    const q = query(
      collection(db, ENERGY_LOGS),
      orderBy("timestamp", "desc"),
      limit(8000)
    );
    const snap = await getDocs(q);
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(
        (log) =>
          log.house_id === houseId &&
          typeof log.date === "string" &&
          log.date.startsWith(ref.monthPrefix)
      );
    queryCache.monthlyLogs = { data, timestamp: now };
    return data;
  } catch (err) {
    console.warn("fetchMonthlyLogs error:", err.message);
    return [];
  }
}

/**
 * Fetch latest log per device (for Digital Twin / Profile).
 */
export async function fetchLatestDeviceStates(houseId) {
  if (!isFirebaseConfigured || !db || !houseId) return [];
  const now = Date.now();
  if (queryCache.latestDeviceStates.data && (now - queryCache.latestDeviceStates.timestamp < CACHE_DURATION_MS)) {
    return queryCache.latestDeviceStates.data;
  }
  try {
    const q = query(
      collection(db, ENERGY_LOGS),
      orderBy("timestamp", "desc"),
      limit(2000)
    );
    const snap = await getDocs(q);
    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((log) => log.house_id === houseId);

    const seen = new Set();
    const latest = [];
    for (const log of all) {
      if (log.appliance_id && !seen.has(log.appliance_id)) {
        seen.add(log.appliance_id);
        latest.push(log);
      }
    }
    queryCache.latestDeviceStates = { data: latest, timestamp: now };
    return latest;
  } catch (err) {
    console.warn("fetchLatestDeviceStates error:", err.message);
    return [];
  }
}

// ─── Shared Computation Helpers ───────────────────────────────────────────────

export function getUniqueRooms(logs) {
  const roomMap = new Map();
  for (const log of logs) {
    if (log.room_name && !roomMap.has(log.room_name)) {
      roomMap.set(log.room_name, log.room_type || "unknown");
    }
  }
  return Array.from(roomMap.entries())
    .map(([roomName, roomType]) => ({ roomName, roomType }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName));
}

export function getUniqueDevices(logs) {
  const deviceMap = new Map();
  for (const log of logs) {
    if (log.appliance_id && !deviceMap.has(log.appliance_id)) {
      deviceMap.set(log.appliance_id, {
        applianceId: log.appliance_id,
        applianceName: log.appliance_name || log.appliance_id,
        applianceType: log.appliance_type || "unknown",
        roomName: log.room_name || "Unknown",
      });
    }
  }
  return Array.from(deviceMap.values());
}

function sumKwh(logs) {
  return logs.reduce((s, l) => s + (Number(l.energy_kwh) || 0), 0);
}

function sumCost(logs) {
  return logs.reduce((s, l) => s + (Number(l.electricity_cost) || 0), 0);
}

function calcEfficiency(logs) {
  if (logs.length === 0) return 0;
  const normal = logs.filter(
    (l) => l.ai_flag === "Normal" && !l.threshold_exceeded
  ).length;
  return Math.round((normal / logs.length) * 100);
}

// ─── Page-Specific Metric Functions ───────────────────────────────────────────

/**
 * Dashboard metrics
 */
export function getDashboardMetrics(todayLogs, weeklyLogs, totalLogCount) {
  const todayUsageKwh = Number(sumKwh(todayLogs).toFixed(1));
  const todayCost = Number(sumCost(todayLogs).toFixed(2));
  const connectedDevices = getUniqueDevices(weeklyLogs).length;
  const efficiencyScore = calcEfficiency(weeklyLogs);

  const byDate = {};
  for (const log of weeklyLogs) {
    if (!log.date) continue;
    if (!byDate[log.date]) byDate[log.date] = { kwh: 0, day: log.day_of_week || "" };
    byDate[log.date].kwh += Number(log.energy_kwh) || 0;
  }
  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      dayOfWeek: v.day,
      totalKwh: Number(v.kwh.toFixed(2)),
    }));

  return {
    totalLogs: totalLogCount,
    connectedDevices,
    todayUsageKwh,
    todayCost,
    efficiencyScore,
    chartData,
  };
}

/**
 * Analytics metrics
 */
export function getAnalyticsMetrics(weeklyLogs, monthlyLogs, refDateInfo) {
  // Use referenceDate instead of current computer date
  const today = refDateInfo.referenceDate;
  const todayLogs = weeklyLogs.filter((l) => l.date === today);

  const todayUsageKwh = Number(sumKwh(todayLogs).toFixed(1));
  const todayCost = Number(sumCost(todayLogs).toFixed(2));

  const monthlyTotalCost = sumCost(monthlyLogs);
  const daysElapsed = refDateInfo.dayOfReferenceDate || 30;
  const estimatedMonthlyCost = Number(
    ((monthlyTotalCost / daysElapsed) * 30).toFixed(0)
  );

  const efficiencyScore = calcEfficiency(monthlyLogs);

  // Weekly chart data
  const byDate = {};
  for (const log of weeklyLogs) {
    if (!log.date) continue;
    if (!byDate[log.date]) byDate[log.date] = { kwh: 0, day: log.day_of_week || "" };
    byDate[log.date].kwh += Number(log.energy_kwh) || 0;
  }
  const weeklyChartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      dayOfWeek: v.day,
      totalKwh: Number(v.kwh.toFixed(2)),
    }));

  // Device breakdown
  const deviceAgg = {};
  for (const log of monthlyLogs) {
    const aid = log.appliance_id;
    if (!aid) continue;
    if (!deviceAgg[aid]) {
      deviceAgg[aid] = {
        name: log.appliance_name || aid,
        type: log.appliance_type || "unknown",
        todayKwh: 0,
        monthlyKwh: 0,
        totalLogs: 0,
        normalLogs: 0,
      };
    }
    deviceAgg[aid].monthlyKwh += Number(log.energy_kwh) || 0;
    deviceAgg[aid].totalLogs++;
    if (log.ai_flag === "Normal" && !log.threshold_exceeded) {
      deviceAgg[aid].normalLogs++;
    }
    if (log.date === today) {
      deviceAgg[aid].todayKwh += Number(log.energy_kwh) || 0;
    }
  }

  const deviceBreakdown = Object.values(deviceAgg).map((d) => ({
    name: d.name,
    type: d.type,
    todayKwh: Number(d.todayKwh.toFixed(2)),
    monthlyKwh: Number(d.monthlyKwh.toFixed(2)),
    efficiency:
      d.totalLogs > 0 ? Math.round((d.normalLogs / d.totalLogs) * 100) : 0,
  }));

  // Donut chart
  const typeAgg = {};
  const totalKwh = sumKwh(todayLogs.length > 0 ? todayLogs : monthlyLogs);
  const sourceLogsForDonut = todayLogs.length > 0 ? todayLogs : monthlyLogs;
  for (const log of sourceLogsForDonut) {
    const t = log.appliance_type || "other";
    if (!typeAgg[t]) typeAgg[t] = 0;
    typeAgg[t] += Number(log.energy_kwh) || 0;
  }
  const donutData = Object.entries(typeAgg)
    .map(([type, kwh]) => ({
      type,
      label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      percent: totalKwh > 0 ? Math.round((kwh / totalKwh) * 100) : 0,
      kwh: Number(kwh.toFixed(2)),
    }))
    .sort((a, b) => b.percent - a.percent);

  // Peak hour chart
  const hourBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  const sourceLogs = todayLogs.length > 0 ? todayLogs : weeklyLogs;
  for (const log of sourceLogs) {
    const h = Number(log.hour);
    if (h >= 6 && h < 12) hourBuckets.Morning += Number(log.energy_kwh) || 0;
    else if (h >= 12 && h < 18) hourBuckets.Afternoon += Number(log.energy_kwh) || 0;
    else if (h >= 18 && h < 22) hourBuckets.Evening += Number(log.energy_kwh) || 0;
    else hourBuckets.Night += Number(log.energy_kwh) || 0;
  }
  const peakHourData = Object.entries(hourBuckets).map(([period, kwh]) => ({
    period,
    kwh: Number(kwh.toFixed(2)),
  }));

  // Smart Insights
  const sortedDevices = [...deviceBreakdown].sort(
    (a, b) => b.monthlyKwh - a.monthlyKwh
  );
  const highestConsumer = sortedDevices[0] || null;
  const highestConsumerPercent =
    highestConsumer && totalKwh > 0
      ? Math.round((highestConsumer.monthlyKwh / sumKwh(monthlyLogs)) * 100)
      : 0;

  const roomAgg = {};
  for (const log of monthlyLogs) {
    const r = log.room_name;
    if (!r) continue;
    if (!roomAgg[r]) roomAgg[r] = 0;
    roomAgg[r] += Number(log.energy_kwh) || 0;
  }
  const sortedRooms = Object.entries(roomAgg).sort((a, b) => a[1] - b[1]);
  const mostEfficientRoom = sortedRooms[0] ? sortedRooms[0][0] : "N/A";

  const peakPeriod = peakHourData.reduce(
    (max, p) => (p.kwh > max.kwh ? p : max),
    peakHourData[0] || { period: "N/A", kwh: 0 }
  );
  const peakTimeMap = {
    Morning: "6 AM – 12 PM",
    Afternoon: "12 PM – 6 PM",
    Evening: "6 PM – 10 PM",
    Night: "10 PM – 6 AM",
  };

  const anomalousCost = monthlyLogs
    .filter((l) => l.ai_flag !== "Normal" || l.threshold_exceeded)
    .reduce((s, l) => s + (Number(l.electricity_cost) || 0), 0);
  const potentialMonthlySaving = Number(
    ((anomalousCost / daysElapsed) * 30).toFixed(0)
  );

  return {
    todayUsageKwh,
    todayCost,
    estimatedMonthlyCost,
    efficiencyScore,
    weeklyChartData,
    deviceBreakdown,
    donutData,
    peakHourData,
    highestConsumer: highestConsumer
      ? { name: highestConsumer.name, percent: highestConsumerPercent }
      : null,
    mostEfficientRoom,
    peakUsageTime: peakTimeMap[peakPeriod?.period] || "N/A",
    potentialMonthlySaving,
  };
}

/**
 * Simulation metrics
 */
export function getSimulationMetrics(monthlyLogs, refDateInfo) {
  const totalKwh = sumKwh(monthlyLogs);
  const totalCost = sumCost(monthlyLogs);
  // Use exact fractional days if available (from simulation playback), else fallback to integer day
  const daysElapsed = refDateInfo.exactDaysElapsed || refDateInfo.dayOfReferenceDate || 30;

  const projectedMonthlyCost = Number(
    ((totalCost / daysElapsed) * 30).toFixed(0)
  );
  const projectedMonthlyKwh = Number(
    ((totalKwh / daysElapsed) * 30).toFixed(0)
  );
  const carbonFootprint = Number(
    (projectedMonthlyKwh * CARBON_FACTOR_KG_PER_KWH).toFixed(0)
  );

  const anomalousLogs = monthlyLogs.filter(
    (l) => l.ai_flag !== "Normal" || l.threshold_exceeded
  );
  const anomalousKwh = sumKwh(anomalousLogs);
  const anomalousCost = sumCost(anomalousLogs);

  const estimatedSaving = Number(
    ((anomalousCost / daysElapsed) * 30).toFixed(0)
  );
  const energyReductionPercent =
    totalKwh > 0 ? Number(((anomalousKwh / totalKwh) * 100).toFixed(1)) : 0;
  const carbonReductionPercent = energyReductionPercent;

  const confidence =
    monthlyLogs.length > 500 ? "High" : monthlyLogs.length > 100 ? "Medium" : "Low";

  const byDate = {};
  for (const log of monthlyLogs) {
    if (!log.date) continue;
    if (!byDate[log.date]) byDate[log.date] = { kwh: 0, anomKwh: 0 };
    byDate[log.date].kwh += Number(log.energy_kwh) || 0;
    if (log.ai_flag !== "Normal" || log.threshold_exceeded) {
      byDate[log.date].anomKwh += Number(log.energy_kwh) || 0;
    }
  }
  const dailyChartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      totalKwh: Number(v.kwh.toFixed(2)),
      optimizedKwh: Number((v.kwh - v.anomKwh * 0.7).toFixed(2)),
    }));

  return {
    currentMonthlyCost: projectedMonthlyCost,
    currentEnergyKwh: projectedMonthlyKwh,
    carbonFootprint,
    estimatedSaving,
    energyReductionPercent,
    carbonReductionPercent,
    confidence,
    dailyChartData,
  };
}

/**
 * Generate AI recommendations from logs
 */
export function generateRecommendations(logs) {
  if (logs.length === 0) {
    return {
      mainRecommendation: null,
      estimatedMonthlySaving: 0,
      confidence: "Low",
      insights: [],
    };
  }

  const deviceKwh = {};
  const deviceCost = {};
  for (const log of logs) {
    const aid = log.appliance_name || log.appliance_id;
    if (!aid) continue;
    deviceKwh[aid] = (deviceKwh[aid] || 0) + (Number(log.energy_kwh) || 0);
    deviceCost[aid] = (deviceCost[aid] || 0) + (Number(log.electricity_cost) || 0);
  }

  const totalKwh = sumKwh(logs);
  const sortedDevices = Object.entries(deviceKwh).sort((a, b) => b[1] - a[1]);
  const topDevice = sortedDevices[0];
  const topPercent =
    topDevice && totalKwh > 0
      ? Math.round((topDevice[1] / totalKwh) * 100)
      : 0;

  const anomalousCost = logs
    .filter((l) => l.ai_flag !== "Normal" || l.threshold_exceeded)
    .reduce((s, l) => s + (Number(l.electricity_cost) || 0), 0);
  const estimatedMonthlySaving = Number((anomalousCost * 4.3).toFixed(0));

  const confidence =
    logs.length > 100 ? "High" : logs.length > 50 ? "Medium" : "Low";

  let mainRecommendation = null;
  if (topDevice) {
    const topType = logs.find(
      (l) => (l.appliance_name || l.appliance_id) === topDevice[0]
    )?.appliance_type;
    let actionText = "Consider reducing its usage during peak hours.";
    if (topType === "ac") {
      actionText =
        "Increasing the set temperature by 2°C can reduce its consumption by approximately 10%.";
    } else if (topType === "geyser" || topType === "water_heater") {
      actionText =
        "Scheduling shorter heating cycles during off-peak hours can reduce costs significantly.";
    } else if (topType === "light" || topType === "lighting") {
      actionText =
        "Switching off lights in unoccupied rooms can reduce energy waste.";
    }

    mainRecommendation = {
      applianceName: topDevice[0],
      percent: topPercent,
      actionText,
      applianceType: topType || "unknown",
    };
  }

  const insights = [];

  const acLogs = logs.filter((l) => l.appliance_type === "ac");
  const acKwh = sumKwh(acLogs);
  const acSavingPercent = totalKwh > 0 ? Math.round((acKwh / totalKwh) * 10) : 0;
  insights.push({
    title: "Climate Optimization",
    value: acSavingPercent > 0 ? `${acSavingPercent}%` : "0%",
    type: "saving",
    iconType: "Thermometer",
  });

  const standbyLogs = logs.filter(
    (l) => l.status === "OFF" && Number(l.energy_kwh) > 0
  );
  const standbyPercent =
    logs.length > 0 ? Math.round((standbyLogs.length / logs.length) * 100) : 0;
  insights.push({
    title: "Standby Power",
    value: standbyPercent > 0 ? `${standbyPercent}%` : "0%",
    type: "saving",
    iconType: "Power",
  });

  const lightLogs = logs.filter(
    (l) =>
      (l.appliance_type === "light" || l.appliance_type === "lighting") &&
      l.status === "ON" &&
      !l.occupancy
  );
  const lightSavingPercent =
    logs.length > 0 ? Math.round((lightLogs.length / logs.length) * 100) : 0;
  insights.push({
    title: "Lighting Optimization",
    value: lightSavingPercent > 0 ? `${lightSavingPercent}%` : "0%",
    type: "saving",
    iconType: "Lightbulb",
  });

  const peakLogs = logs.filter((l) => {
    const h = Number(l.hour);
    return h >= 12 && h < 18;
  });
  const peakKwh = sumKwh(peakLogs);
  const isHighPeak = peakKwh > totalKwh * 0.4;
  insights.push({
    title: "Peak Hour Alert",
    value: isHighPeak ? "High Consumption" : "Normal",
    type: isHighPeak ? "alert" : "saving",
    iconType: "AlertTriangle",
  });

  return {
    mainRecommendation,
    estimatedMonthlySaving,
    confidence,
    insights,
  };
}

/**
 * Generate automation rule suggestions from logs
 */
export function generateAutomationRules(logs) {
  if (logs.length === 0) return [];

  const rules = [];

  const typeAgg = {};
  for (const log of logs) {
    const t = log.appliance_type;
    if (!t) continue;
    if (!typeAgg[t]) {
      typeAgg[t] = {
        type: t,
        name: log.appliance_name || t,
        totalKwh: 0,
        anomalyCount: 0,
        peakCount: 0,
        unoccupiedOnCount: 0,
        totalLogs: 0,
        totalCost: 0,
      };
    }
    typeAgg[t].totalKwh += Number(log.energy_kwh) || 0;
    typeAgg[t].totalCost += Number(log.electricity_cost) || 0;
    typeAgg[t].totalLogs++;
    if (log.ai_flag !== "Normal" || log.threshold_exceeded) typeAgg[t].anomalyCount++;
    if (Number(log.hour) >= 12 && Number(log.hour) < 18) typeAgg[t].peakCount++;
    if (log.status === "ON" && !log.occupancy) typeAgg[t].unoccupiedOnCount++;
  }

  const totalKwh = sumKwh(logs);

  for (const [type, data] of Object.entries(typeAgg)) {
    const savingPercent =
      totalKwh > 0 ? Math.round((data.anomalyCount / data.totalLogs) * 10) : 0;
    const savingRupees = Number((data.totalCost * (savingPercent / 100)).toFixed(0));

    if (type === "ac" && data.anomalyCount > 0) {
      rules.push({
        id: `rule_ac_${Date.now()}`,
        title: "Smart AC",
        iconType: "Thermometer",
        ifText: `${data.name} energy exceeds daily threshold`,
        thenText: "Increase thermostat temperature by 2°C",
        saving: `₹${savingRupees || Math.round(data.totalCost * 0.1)}`,
        savingPercent: `${savingPercent || 10}%`,
        defaultEnabled: true,
      });
    }

    if (
      (type === "light" || type === "lighting") &&
      data.unoccupiedOnCount > 0
    ) {
      rules.push({
        id: `rule_light_${Date.now()}`,
        title: "Smart Lighting",
        iconType: "Lightbulb",
        ifText: "Room is unoccupied for 10 minutes",
        thenText: "Turn OFF Lights automatically",
        saving: `₹${savingRupees || Math.round(data.totalCost * 0.06)}`,
        savingPercent: `${savingPercent || 6}%`,
        defaultEnabled: true,
      });
    }

    if (
      (type === "geyser" || type === "water_heater") &&
      data.peakCount > 0
    ) {
      rules.push({
        id: `rule_geyser_${Date.now()}`,
        title: "Water Heater",
        iconType: "Flame",
        ifText: "Peak Hours detected (12 PM – 6 PM)",
        thenText: "Delay heating to off-peak hours",
        saving: `₹${savingRupees || Math.round(data.totalCost * 0.08)}`,
        savingPercent: `${savingPercent || 8}%`,
        defaultEnabled: true,
      });
    }

    if (type === "tv" && data.unoccupiedOnCount > 0) {
      rules.push({
        id: `rule_tv_${Date.now()}`,
        title: "Smart TV",
        iconType: "Tv",
        ifText: "No activity detected for 30 minutes",
        thenText: "Enter Sleep Mode",
        saving: `₹${savingRupees || Math.round(data.totalCost * 0.05)}`,
        savingPercent: `${savingPercent || 5}%`,
        defaultEnabled: true,
      });
    }

    if (type === "washing_machine" && data.peakCount > 0) {
      rules.push({
        id: `rule_washer_${Date.now()}`,
        title: "Washing Machine",
        iconType: "Shirt",
        ifText: "Peak Hours detected",
        thenText: "Schedule after 6 PM",
        saving: `₹${savingRupees || Math.round(data.totalCost * 0.07)}`,
        savingPercent: `${savingPercent || 7}%`,
        defaultEnabled: false,
      });
    }

    if (type === "fan" || type === "ceiling_fan" || type === "exhaust_fan") {
      if (data.unoccupiedOnCount > 0) {
        rules.push({
          id: `rule_fan_${Date.now()}`,
          title: "Smart Fan",
          iconType: "Fan",
          ifText: "Room is unoccupied",
          thenText: "Turn OFF Fan automatically",
          saving: `₹${savingRupees || Math.round(data.totalCost * 0.04)}`,
          savingPercent: `${savingPercent || 4}%`,
          defaultEnabled: true,
        });
      }
    }
  }

  return rules;
}
