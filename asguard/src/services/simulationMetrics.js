/**
 * Helper utilities to extract weekly, monthly, and daily logs 
 * from the massive `currentLogs` array provided by the SimulationContext.
 */

export function deriveSimulationLogs(currentLogs, virtualTime) {
  if (!currentLogs || currentLogs.length === 0 || !virtualTime) {
    return { todayLogs: [], weeklyLogs: [], monthlyLogs: [], refDateInfo: null, totalLogCount: 0 };
  }

  const vDate = new Date(virtualTime);
  const vDateStr = vDate.toISOString().slice(0, 10);
  const vYear = vDateStr.split('-')[0];
  const vMonth = vDateStr.split('-')[1];
  const vDay = parseInt(vDateStr.split('-')[2], 10);
  const vMonthPrefix = `${vYear}-${vMonth}`;

  const startOfMonth = new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1)).getTime();
  // Ensure minimum 1 hour elapsed (1/24 of a day) so the first hour's logs don't extrapolate infinitely
  const exactDaysElapsed = Math.max(1/24, (virtualTime - startOfMonth) / 86400000);

  const refDateInfo = {
    referenceDate: vDateStr,
    referenceMonth: vMonth,
    referenceYear: vYear,
    monthPrefix: vMonthPrefix,
    dayOfReferenceDate: vDay || 30,
    exactDaysElapsed,
  };

  // Helper to get last N days strings
  const getPastNDates = (n) => {
    const s = new Set();
    for (let i = 0; i < n; i++) {
      const d = new Date(vDate);
      d.setUTCDate(vDate.getUTCDate() - i);
      s.add(d.toISOString().slice(0, 10));
    }
    return s;
  };

  const last7Days = getPastNDates(7);

  const todayLogs = [];
  const weeklyLogs = [];
  const monthlyLogs = [];

  // Since currentLogs is already sorted chronologically (oldest to newest),
  // we can iterate backwards for efficiency, but filtering is fast enough.
  for (const log of currentLogs) {
    // Map Prisma schema format (camelCase) back to Firebase format (snake_case)
    // if needed by the legacy metrics engine, or assume they are mapped.
    // Wait, the API returns Prisma format (e.g. houseId, applianceId, energyKwh).
    // The legacy firestoreService expects house_id, appliance_id, energy_kwh.
    // Let's adapt it here!
    
    const adaptedLog = {
      ...log,
      house_id: log.houseId,
      room_id: log.roomId,
      appliance_id: log.applianceId,
      room_name: log.room?.name || log.roomId,
      appliance_name: log.appliance?.name || log.applianceId, 
      appliance_type: log.appliance?.type || 'unknown',
      energy_kwh: log.energyKwh,
      electricity_cost: log.electricityCost,
      ai_flag: log.aiFlag,
      threshold_exceeded: log.thresholdExceeded,
      day_of_week: log.dayOfWeek,
      power_consumption_wh: log.powerConsumptionWh,
    };

    if (adaptedLog.date === vDateStr) {
      todayLogs.push(adaptedLog);
    }
    if (last7Days.has(adaptedLog.date)) {
      weeklyLogs.push(adaptedLog);
    }
    if (adaptedLog.date && adaptedLog.date.startsWith(vMonthPrefix)) {
      monthlyLogs.push(adaptedLog);
    }
  }

  return {
    todayLogs,
    weeklyLogs,
    monthlyLogs,
    refDateInfo,
    totalLogCount: currentLogs.length,
  };
}

/**
 * Derives the most recent state for each appliance up to the current virtual time.
 */
export function getLatestSimulatedStates(currentLogs) {
  const latestMap = new Map();
  for (const log of currentLogs) {
    const adaptedLog = {
      ...log,
      appliance_id: log.applianceId,
      room_name: log.room?.name || log.roomId,
      appliance_name: log.appliance?.name || log.applianceId, 
      appliance_type: log.appliance?.type || 'unknown',
      status: log.status,
      energy_kwh: log.energyKwh,
    };
    latestMap.set(log.applianceId, adaptedLog);
  }
  return Array.from(latestMap.values());
}
