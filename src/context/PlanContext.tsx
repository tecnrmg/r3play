import React, { createContext, useContext, useState, useEffect } from 'react';
import { TabType } from '../components/Navbar';

export type PlanMode = 'free' | 'lite' | 'pro';

interface PlanContextType {
  planMode: PlanMode;
  setPlanMode: (mode: PlanMode) => void;
  hasStreamAddon: boolean;
  setHasStreamAddon: (active: boolean) => void;
  togglePlanMode: () => void;
  toggleStreamAddon: () => void;
  isTabAllowed: (tab: TabType) => boolean;
  isFree: boolean;
  isLite: boolean;
  isPro: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Plan Mode state (defaults to 'pro' if not set)
  const [planMode, setPlanModeState] = useState<PlanMode>(() => {
    const saved = localStorage.getItem('r3play_plan_mode');
    return (saved === 'free' || saved === 'lite' || saved === 'pro') ? saved : 'pro';
  });

  // Stream Overlay Addon state (defaults to false for paywall demo, or restored)
  const [hasStreamAddon, setHasStreamAddonState] = useState<boolean>(() => {
    const saved = localStorage.getItem('r3play_stream_addon');
    return saved === 'true';
  });

  // Save changes to localStorage
  const setPlanMode = (mode: PlanMode) => {
    setPlanModeState(mode);
    localStorage.setItem('r3play_plan_mode', mode);
  };

  const setHasStreamAddon = (active: boolean) => {
    setHasStreamAddonState(active);
    localStorage.setItem('r3play_stream_addon', String(active));
  };

  const togglePlanMode = () => {
    if (planMode === 'free') setPlanMode('lite');
    else if (planMode === 'lite') setPlanMode('pro');
    else setPlanMode('free');
  };

  const toggleStreamAddon = () => {
    setHasStreamAddon(!hasStreamAddon);
  };

  const isFree = planMode === 'free';
  const isLite = planMode === 'lite';
  const isPro = planMode === 'pro';

  // Permission validator according to specifications
  const isTabAllowed = (tab: TabType): boolean => {
    // Google Sheets direct modal configuration is strictly hidden from client view
    if (tab === 'googlescript') return false;

    // Free Mode: Scoreboard (TV view only), Participation list, and Settings
    if (isFree) {
      const allowedFreeTabs: TabType[] = ['scoreboard', 'participation', 'settings'];
      return allowedFreeTabs.includes(tab);
    }

    // Lite Mode: Operator scoreboard, Participation list, TV presentation, Stream Overlay, and Settings
    if (isLite) {
      const allowedLiteTabs: TabType[] = ['scoreboard', 'participation', 'tv', 'stream', 'settings'];
      return allowedLiteTabs.includes(tab);
    }

    // Pro Mode: All tabs allowed (except hidden 'googlescript')
    return true;
  };

  return (
    <PlanContext.Provider
      value={{
        planMode,
        setPlanMode,
        hasStreamAddon,
        setHasStreamAddon,
        togglePlanMode,
        toggleStreamAddon,
        isTabAllowed,
        isFree,
        isLite,
        isPro,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlanContext = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
};
