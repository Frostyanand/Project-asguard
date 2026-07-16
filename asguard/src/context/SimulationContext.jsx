'use client';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserProfile } from '../firebase/firestoreService';
import { evaluatePolicies, generateProjections, DEFAULT_POLICIES } from '../services/policyEngine';

// How often (real ms) to run the expensive policy engine + slice the logs.
// 150ms = ~6 UI updates/sec → metrics update smoothly but main thread is free 90% of the time.
const POLICY_EVAL_INTERVAL_MS = 150;

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const { currentUser } = useAuth();

  const [allLogs, setAllLogs] = useState([]);
  const [currentLogs, setCurrentLogs] = useState([]);

  // Policy Engine State
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  const [agentActions, setAgentActions] = useState([]);
  const [policyEngineSummary, setPolicyEngineSummary] = useState(null);
  const [projections, setProjections] = useState(null);

  const [virtualTime, setVirtualTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3600); // Default: 1 hour per second

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastTickRef = useRef(null);
  const rafRef = useRef(null);

  // ── Data Loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!currentUser?.uid) return;
      setIsLoading(true);
      try {
        let houseId = 'HOUSE001';
        try {
          const userProfile = await fetchUserProfile(currentUser.uid);
          houseId = userProfile?.house_id || userProfile?.houseId || 'HOUSE001';
        } catch (fbErr) {
          console.warn('[SimulationContext] Firebase profile fetch failed (non-fatal):', fbErr.message);
        }

        const res = await fetch(`/api/simulation/logs?houseId=${houseId}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        if (isMounted) {
          const parsedLogs = data.logs.map(l => ({
            ...l,
            timestamp: new Date(l.timestamp).getTime()
          }));
          setAllLogs(parsedLogs);

          if (parsedLogs.length > 0) {
            setVirtualTime(parsedLogs[0].timestamp);
            setCurrentLogs([parsedLogs[0]]);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[SimulationContext] Failed to load logs:', err.message);
          setError(err.message);
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  // ── Decoupled Playback Loop ───────────────────────────────────────────────
  const virtualTimeRef = useRef(virtualTime);

  // Sync ref when user scrubs/pauses
  useEffect(() => {
    virtualTimeRef.current = virtualTime;
  }, [virtualTime]);

  useEffect(() => {
    if (!isPlaying || !virtualTime || allLogs.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTickRef.current = null;
      }
      return;
    }

    const tick = (timeNow) => {
      if (!lastTickRef.current) lastTickRef.current = timeNow;
      const deltaMs = timeNow - lastTickRef.current;
      lastTickRef.current = timeNow;

      const nextTime = virtualTimeRef.current + (deltaMs * playbackSpeed);
      const maxTime = allLogs[allLogs.length - 1].timestamp;

      if (nextTime >= maxTime) {
        setIsPlaying(false);
        virtualTimeRef.current = maxTime;
        setVirtualTime(maxTime); // Force final sync
      } else {
        virtualTimeRef.current = nextTime;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lastTickRef.current = null;
    };
  }, [isPlaying, playbackSpeed, allLogs.length]);

  // ── Decoupled currentLogs + Policy Engine updater ───────────────────────
  // KEY DESIGN: The RAF loop (above) advances virtualTimeRef internally at 60fps.
  // THIS interval syncs state and does the expensive work (slice + policy eval) at 6-7fps 
  // so the main thread is idle 90% of the time and can process sidebar clicks.
  const lastIndexRef    = useRef(0);
  const allLogsRef      = useRef(allLogs);
  const policiesRef     = useRef(policies);

  // Keep refs in sync with state (no re-render cost)
  useEffect(() => { allLogsRef.current = allLogs; },        [allLogs]);
  useEffect(() => { policiesRef.current = policies; },      [policies]);

  useEffect(() => {
    const runEval = () => {
      const vt   = virtualTimeRef.current;
      const logs = allLogsRef.current;
      const pol  = policiesRef.current;

      if (!vt || logs.length === 0) return;

      let idx = lastIndexRef.current;

      // Reset if scrubbed backwards
      if (idx > 0 && logs[idx - 1]?.timestamp > vt) idx = 0;

      // Walk forward to current virtual time
      while (idx < logs.length && logs[idx].timestamp <= vt) idx++;
      lastIndexRef.current = idx;

      const rawSlice = logs.slice(0, idx);

      // Policy engine evaluation
      try {
        const { modifiedLogs, agentActions: newActions, summary } = evaluatePolicies(rawSlice, pol);
        const newProjections = generateProjections(rawSlice, vt, pol);
        
        // Sync state to trigger UI re-renders at ~6-7 FPS (150ms interval)
        setVirtualTime(vt);
        setCurrentLogs(modifiedLogs);
        setAgentActions(newActions.slice(0, 100));
        setPolicyEngineSummary(summary);
        setProjections(newProjections);
      } catch (engineErr) {
        console.warn('[PolicyEngine] Evaluation error (non-fatal):', engineErr.message);
        setCurrentLogs(rawSlice);
      }
    };

    // Run once immediately (handles scrub/pause state)
    runEval();

    // Then throttle to POLICY_EVAL_INTERVAL_MS during playback
    const intervalId = setInterval(runEval, POLICY_EVAL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);  // Empty deps — refs handle latest values without re-creating interval

  // ── Policy updater (persists to Firebase on best-effort basis) ──────────
  const saveTimeoutRef = useRef(null);

  const updatePolicies = useCallback((newPolicies) => {
    setPolicies(newPolicies);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce Firebase write to avoid quota issues on rapid UI changes
    saveTimeoutRef.current = setTimeout(async () => {
      if (currentUser?.uid) {
        try {
          const { doc, setDoc, getFirestore } = await import('firebase/firestore');
          const { app } = await import('../firebase/client');
          if (app) {
            const db = getFirestore(app);
            await setDoc(
              doc(db, 'user_policies', currentUser.uid),
              { ...newPolicies, updatedAt: new Date().toISOString() },
              { merge: true }
            );
          }
        } catch (fbErr) {
          console.warn('[PolicyEngine] Firebase policy sync failed (non-fatal):', fbErr.message);
        }
      }
    }, 1000);
  }, [currentUser?.uid]);

  // ── Load persisted policies from Firebase on login ───────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;
    async function loadPolicies() {
      try {
        const { doc, getDoc, getFirestore } = await import('firebase/firestore');
        const { app } = await import('../firebase/client');
        if (!app) return;
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, 'user_policies', currentUser.uid));
        if (snap.exists()) {
          setPolicies(prev => ({ ...DEFAULT_POLICIES, ...snap.data() }));
        }
      } catch (fbErr) {
        console.warn('[PolicyEngine] Firebase policy load failed (non-fatal):', fbErr.message);
      }
    }
    loadPolicies();
  }, [currentUser?.uid]);

  return (
    <SimulationContext.Provider value={{
      allLogs,
      currentLogs,
      virtualTime,
      setVirtualTime,
      isPlaying,
      setIsPlaying,
      playbackSpeed,
      setPlaybackSpeed,
      isLoading,
      error,
      // Policy Engine
      policies,
      updatePolicies,
      agentActions,
      policyEngineSummary,
      projections,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
