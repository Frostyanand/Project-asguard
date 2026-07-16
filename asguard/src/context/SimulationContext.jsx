'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserProfile } from '../firebase/firestoreService';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const { currentUser } = useAuth();
  
  const [allLogs, setAllLogs] = useState([]);
  const [currentLogs, setCurrentLogs] = useState([]);
  
  const [virtualTime, setVirtualTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3600); // Default: 1 hour per second
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastTickRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!currentUser?.uid) return;
      setIsLoading(true);
      try {
        const userProfile = await fetchUserProfile(currentUser.uid);
        const houseId = userProfile?.house_id || userProfile?.houseId || 'HOUSE001';
        
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
          setError(err.message);
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  // Simulation Engine Loop
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
      if (!lastTickRef.current) {
        lastTickRef.current = timeNow;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = timeNow - lastTickRef.current;
      lastTickRef.current = timeNow;

      setVirtualTime(prev => {
        const nextTime = prev + (deltaMs * playbackSpeed);
        const maxTime = allLogs[allLogs.length - 1].timestamp;
        
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return nextTime;
      });

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

  // Throttled currentLogs updater
  // Re-filtering 21k array every 16ms can cause stuttering. We'll track the index.
  const lastIndexRef = useRef(0);

  useEffect(() => {
    if (!virtualTime || allLogs.length === 0) return;
    
    // Instead of filtering the whole array, we advance our index.
    let idx = lastIndexRef.current;
    
    // If virtualTime rewound (e.g. user scrubbed backwards), reset idx
    if (idx > 0 && allLogs[idx].timestamp > virtualTime) {
      idx = 0;
    }

    while (idx < allLogs.length && allLogs[idx].timestamp <= virtualTime) {
      idx++;
    }

    lastIndexRef.current = idx;
    setCurrentLogs(allLogs.slice(0, idx));
  }, [virtualTime, allLogs]);

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
      error
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
