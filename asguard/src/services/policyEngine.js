/**
 * ASGUARD Policy Engine
 * ─────────────────────
 * A pure, rule-based agentic engine that intercepts the simulation log stream
 * and enforces user-defined policies. No LLMs, no Gen-AI — all deterministic
 * enterprise-grade rule evaluation.
 *
 * Architecture:
 *  - `evaluatePolicies(logs, policies)` → { modifiedLogs, agentActions }
 *  - Each policy rule is a pure function: (log, ctx) → action | null
 *  - The context (ctx) accumulates state across the log slice (e.g. total kWh so far)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const CARBON_FACTOR = 0.82; // kg CO₂ per kWh (India CEA grid)
const ELECTRICITY_RATE = 7.5; // ₹ per kWh (default)

// ─── Policy Rule Definitions ──────────────────────────────────────────────────

/**
 * RULE 1: Monthly Budget Guard
 * If total monthly energy kWh exceeds the budget cap, enforce a shutdown on the
 * highest-consuming non-critical device.
 */
function ruleBudgetGuard(log, ctx, policies) {
  if (!policies.budgetEnabled || !policies.budgetKwh) return null;

  const budget = Number(policies.budgetKwh);
  if (isNaN(budget) || budget <= 0) return null;

  const isCritical = ['refrigerator', 'fridge', 'router'].includes(log.appliance?.type || '');
  if (isCritical) return null; // Never shut down critical appliances

  if (ctx.monthlyKwhSoFar >= budget && log.status === 'ON') {
    return {
      type: 'BUDGET_ENFORCEMENT',
      severity: 'critical',
      applianceId: log.applianceId,
      applianceName: log.appliance?.name || log.applianceId,
      roomName: log.room?.name || log.roomId,
      message: `Budget cap of ${budget} kWh reached. Shut down ${log.appliance?.name || log.applianceId} in ${log.room?.name || log.roomId}.`,
      action: 'FORCE_OFF',
      timestamp: log.timestamp,
      virtualDate: log.date,
    };
  }
  return null;
}

/**
 * RULE 2: Daily Appliance Limit
 * If a specific appliance has exceeded its daily kWh limit, force it off.
 */
function ruleApplianceDailyLimit(log, ctx, policies) {
  if (!policies.applianceLimits || policies.applianceLimits.length === 0) return null;

  const applianceType = log.appliance?.type || '';
  const limit = policies.applianceLimits.find(
    (l) => l.type === applianceType && l.dailyKwh > 0
  );
  if (!limit) return null;

  const todayKey = `${log.applianceId}_${log.date}`;
  const usageToday = ctx.dailyApplianceKwh[todayKey] || 0;

  if (usageToday >= limit.dailyKwh && log.status === 'ON') {
    return {
      type: 'APPLIANCE_LIMIT',
      severity: 'warning',
      applianceId: log.applianceId,
      applianceName: log.appliance?.name || log.applianceId,
      roomName: log.room?.name || log.roomId,
      message: `Daily limit of ${limit.dailyKwh} kWh reached for ${log.appliance?.name || applianceType}. Device turned off.`,
      action: 'FORCE_OFF',
      timestamp: log.timestamp,
      virtualDate: log.date,
    };
  }
  return null;
}

/**
 * RULE 3: Peak Hour Enforcement
 * During user-defined peak hours, restrict high-draw devices.
 */
function rulePeakHourRestriction(log, ctx, policies) {
  if (!policies.peakHourPolicyEnabled) return null;

  const hour = Number(log.hour);
  const isPeakHour = hour >= (policies.peakHourStart ?? 12) && hour < (policies.peakHourEnd ?? 18);
  if (!isPeakHour) return null;

  const highDrawTypes = ['ac', 'geyser', 'water_heater', 'washing_machine', 'iron'];
  if (!highDrawTypes.includes(log.appliance?.type || '')) return null;

  if (log.status === 'ON') {
    return {
      type: 'PEAK_HOUR',
      severity: 'info',
      applianceId: log.applianceId,
      applianceName: log.appliance?.name || log.applianceId,
      roomName: log.room?.name || log.roomId,
      message: `Peak hour policy active (${policies.peakHourStart}:00–${policies.peakHourEnd}:00). Deferring ${log.appliance?.name || log.appliance?.type}.`,
      action: policies.autonomyLevel === 'autonomous' ? 'FORCE_OFF' : 'WARN',
      timestamp: log.timestamp,
      virtualDate: log.date,
    };
  }
  return null;
}

/**
 * RULE 4: Unoccupied Room Detection
 * If a device is ON but occupancy sensor says no one is home, warn or shut off.
 */
function ruleUnoccupiedShutoff(log, ctx, policies) {
  if (!policies.unoccupiedPolicyEnabled) return null;
  if (log.occupancy !== false && log.occupancy !== 0) return null; // Only act on confirmed unoccupied
  if (log.status !== 'ON') return null;

  const safeTypes = ['refrigerator', 'fridge', 'router', 'security'];
  if (safeTypes.includes(log.appliance?.type || '')) return null;

  return {
    type: 'UNOCCUPIED_ROOM',
    severity: 'warning',
    applianceId: log.applianceId,
    applianceName: log.appliance?.name || log.applianceId,
    roomName: log.room?.name || log.roomId,
    message: `Room unoccupied. ${log.appliance?.name || log.applianceId} is ON in ${log.room?.name || log.roomId}.`,
    action: policies.autonomyLevel === 'autonomous' ? 'FORCE_OFF' : 'WARN',
    timestamp: log.timestamp,
    virtualDate: log.date,
  };
}

/**
 * RULE 5: Anomaly Threshold Alert
 * If the log is flagged as anomalous, escalate based on autonomy level.
 */
function ruleAnomalyAlert(log, ctx, policies) {
  if (!policies.anomalyPolicyEnabled) return null;
  if (log.aiFlag === 'Normal' && !log.thresholdExceeded) return null;

  return {
    type: 'ANOMALY',
    severity: log.thresholdExceeded ? 'critical' : 'warning',
    applianceId: log.applianceId,
    applianceName: log.appliance?.name || log.applianceId,
    roomName: log.room?.name || log.roomId,
    message: `Anomalous usage detected on ${log.appliance?.name || log.applianceId} (${log.aiFlag || 'Threshold Exceeded'}). Energy: ${(log.energyKwh || 0).toFixed(2)} kWh.`,
    action: policies.autonomyLevel === 'autonomous' && log.thresholdExceeded ? 'FORCE_OFF' : 'WARN',
    timestamp: log.timestamp,
    virtualDate: log.date,
  };
}

/**
 * RULE 6: Eco Mode — Reduce all AC temperature by enforcing usage caps
 */
function ruleEcoMode(log, ctx, policies) {
  if (policies.activeMode !== 'eco') return null;
  if ((log.appliance?.type || '') !== 'ac') return null;
  if (log.status !== 'ON') return null;

  const energyKwh = Number(log.energyKwh) || 0;
  const ECO_AC_HOURLY_CAP = 0.8; // kWh per hour per AC unit

  if (energyKwh > ECO_AC_HOURLY_CAP) {
    return {
      type: 'ECO_MODE',
      severity: 'info',
      applianceId: log.applianceId,
      applianceName: log.appliance?.name || log.applianceId,
      roomName: log.room?.name || log.roomId,
      message: `Eco Mode: AC usage ${energyKwh.toFixed(2)} kWh exceeds eco cap. Recommending +2°C thermostat increase.`,
      action: 'RECOMMEND',
      timestamp: log.timestamp,
      virtualDate: log.date,
    };
  }
  return null;
}

/**
 * RULE 7: Vacation Mode — Shut down all non-essential devices
 */
function ruleVacationMode(log, ctx, policies) {
  if (policies.activeMode !== 'vacation') return null;
  if (log.status !== 'ON') return null;

  const essentialTypes = ['refrigerator', 'fridge', 'router', 'security'];
  if (essentialTypes.includes(log.appliance?.type || '')) return null;

  return {
    type: 'VACATION_MODE',
    severity: 'info',
    applianceId: log.applianceId,
    applianceName: log.appliance?.name || log.applianceId,
    roomName: log.room?.name || log.roomId,
    message: `Vacation Mode: Shutting down ${log.appliance?.name || log.applianceId}. Only essential devices remain active.`,
    action: 'FORCE_OFF',
    timestamp: log.timestamp,
    virtualDate: log.date,
  };
}

// ─── Ordered Rule Pipeline ─────────────────────────────────────────────────────
const RULE_PIPELINE = [
  ruleBudgetGuard,
  ruleApplianceDailyLimit,
  rulePeakHourRestriction,
  ruleUnoccupiedShutoff,
  ruleAnomalyAlert,
  ruleEcoMode,
  ruleVacationMode,
];

// ─── Main Engine Export ────────────────────────────────────────────────────────

/**
 * Evaluates all policies against the current slice of simulation logs.
 *
 * @param {Array} logs - The current simulation logs (up to virtualTime)
 * @param {Object} policies - The user's active policy configuration
 * @returns {{ modifiedLogs: Array, agentActions: Array, summary: Object }}
 */
export function evaluatePolicies(logs, policies) {
  if (!logs || logs.length === 0 || !policies) {
    return { modifiedLogs: logs || [], agentActions: [], summary: buildSummary(logs || [], [], policies) };
  }

  // Accumulator context — tracks running state across the log array
  const ctx = {
    monthlyKwhSoFar: 0,
    dailyApplianceKwh: {},     // key: `${applianceId}_${date}` → kWh
    seenActionKeys: new Set(), // deduplicate actions per (type, applianceId, date)
  };

  const agentActions = [];
  const modifiedLogs = [];

  for (const rawLog of logs) {
    let log = { ...rawLog };
    const energyKwh = Number(log.energyKwh) || 0;
    const todayKey = `${log.applianceId}_${log.date}`;

    // ── Accumulate context BEFORE evaluating rules for this log ────────────
    ctx.monthlyKwhSoFar += energyKwh;
    ctx.dailyApplianceKwh[todayKey] = (ctx.dailyApplianceKwh[todayKey] || 0) + energyKwh;

    // ── Run each rule in the pipeline ─────────────────────────────────────
    let actionTaken = false;
    for (const rule of RULE_PIPELINE) {
      const action = rule(log, ctx, policies);
      if (!action) continue;

      // Deduplicate: only emit one action per (type, applianceId, date)
      const dedupKey = `${action.type}_${action.applianceId}_${action.virtualDate}`;
      if (ctx.seenActionKeys.has(dedupKey)) continue;
      ctx.seenActionKeys.add(dedupKey);

      agentActions.push(action);

      // Apply mutation if action mandates it and autonomy allows
      if (
        action.action === 'FORCE_OFF' &&
        (policies.autonomyLevel === 'autonomous' || action.type === 'BUDGET_ENFORCEMENT' || action.type === 'VACATION_MODE')
      ) {
        log = {
          ...log,
          status: 'OFF',
          energyKwh: 0,
          electricityCost: 0,
          powerConsumptionWh: 0,
          _agentModified: true,
          _agentReason: action.type,
        };
        actionTaken = true;
      }

      // Only apply the first triggered rule that causes a FORCE_OFF
      if (actionTaken) break;
    }

    modifiedLogs.push(log);
  }

  return {
    modifiedLogs,
    agentActions: agentActions.reverse(), // newest first for the feed
    summary: buildSummary(logs, modifiedLogs, policies, agentActions),
  };
}

/**
 * Builds a summary object for the control centre UI.
 */
function buildSummary(rawLogs, modifiedLogs, policies, agentActions = []) {
  const totalKwh = rawLogs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0);
  const modifiedKwh = modifiedLogs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0);
  const savedKwh = Math.max(0, totalKwh - modifiedKwh);
  const savedRupees = savedKwh * ELECTRICITY_RATE;
  const savedCarbonKg = savedKwh * CARBON_FACTOR;

  const criticalAlerts = agentActions.filter((a) => a.severity === 'critical').length;
  const warnings = agentActions.filter((a) => a.severity === 'warning').length;
  const infoAlerts = agentActions.filter((a) => a.severity === 'info').length;

  const budgetUsedPct =
    policies?.budgetKwh > 0
      ? Math.min(100, Math.round((totalKwh / policies.budgetKwh) * 100))
      : 0;

  return {
    totalKwh: Number(totalKwh.toFixed(2)),
    savedKwh: Number(savedKwh.toFixed(2)),
    savedRupees: Number(savedRupees.toFixed(0)),
    savedCarbonKg: Number(savedCarbonKg.toFixed(2)),
    criticalAlerts,
    warnings,
    infoAlerts,
    totalActions: agentActions.length,
    budgetUsedPct,
    agentStatus:
      criticalAlerts > 0
        ? 'Critical'
        : warnings > 0
        ? 'Warning'
        : agentActions.length > 0
        ? 'Active'
        : 'Nominal',
  };
}

/**
 * Generates projections based on current monthly pace.
 */
export function generateProjections(logs, virtualTime, policies) {
  if (!logs || logs.length === 0 || !virtualTime) return null;

  const vDate = new Date(virtualTime);
  const monthPrefix = vDate.toISOString().slice(0, 7);
  const dayOfMonth = vDate.getUTCDate() || 1;

  const monthlyLogs = logs.filter((l) => l.date && l.date.startsWith(monthPrefix));
  const totalKwh = monthlyLogs.reduce((s, l) => s + (Number(l.energyKwh) || 0), 0);
  const totalCost = monthlyLogs.reduce((s, l) => s + (Number(l.electricityCost) || 0), 0);

  const dailyAvgKwh = totalKwh / Math.max(1, dayOfMonth);
  const projectedMonthlyKwh = dailyAvgKwh * 30;
  const projectedMonthlyCost = (totalCost / Math.max(1, dayOfMonth)) * 30;
  const projectedCarbon = projectedMonthlyKwh * CARBON_FACTOR;

  const budgetKwh = Number(policies?.budgetKwh) || 0;
  const budgetRupees = Number(policies?.budgetRupees) || 0;

  const daysToExceedKwh =
    budgetKwh > 0 && dailyAvgKwh > 0
      ? Math.max(0, Math.ceil((budgetKwh - totalKwh) / dailyAvgKwh))
      : null;

  return {
    currentMonthKwh: Number(totalKwh.toFixed(1)),
    currentMonthCost: Number(totalCost.toFixed(0)),
    projectedMonthlyKwh: Number(projectedMonthlyKwh.toFixed(1)),
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(0)),
    projectedCarbon: Number(projectedCarbon.toFixed(1)),
    budgetKwh,
    budgetRupees,
    budgetUsedPct:
      budgetKwh > 0 ? Math.min(100, Math.round((totalKwh / budgetKwh) * 100)) : 0,
    projectedBudgetUsedPct:
      budgetKwh > 0 ? Math.min(100, Math.round((projectedMonthlyKwh / budgetKwh) * 100)) : 0,
    daysToExceedKwh,
    dayOfMonth,
    willExceedBudget: budgetKwh > 0 && projectedMonthlyKwh > budgetKwh,
    overageKwh:
      budgetKwh > 0 ? Math.max(0, Number((projectedMonthlyKwh - budgetKwh).toFixed(1))) : 0,
  };
}

/**
 * Default policy configuration.
 */
export const DEFAULT_POLICIES = {
  // Autonomy
  autonomyLevel: 'monitor', // 'monitor' | 'copilot' | 'autonomous'

  // Budget
  budgetEnabled: false,
  budgetKwh: 500,
  budgetRupees: 3750,

  // Active Mode
  activeMode: 'normal', // 'normal' | 'eco' | 'comfort' | 'vacation' | 'custom'

  // Peak Hours
  peakHourPolicyEnabled: false,
  peakHourStart: 12,
  peakHourEnd: 18,

  // Unoccupied Detection
  unoccupiedPolicyEnabled: false,

  // Anomaly Response
  anomalyPolicyEnabled: true,

  // Per-appliance limits (array of { type, dailyKwh })
  applianceLimits: [
    { type: 'ac', dailyKwh: 0, label: 'Air Conditioner' },
    { type: 'geyser', dailyKwh: 0, label: 'Water Heater / Geyser' },
    { type: 'tv', dailyKwh: 0, label: 'Television' },
    { type: 'washing_machine', dailyKwh: 0, label: 'Washing Machine' },
  ],
};
