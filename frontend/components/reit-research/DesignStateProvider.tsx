'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface DesignStateValue {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

const STORAGE_KEY = 'reit-research-ui-state';
const DesignStateContext = createContext<DesignStateValue | null>(null);

export function DesignStateProvider({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Pick<DesignStateValue, 'isCompact' | 'isDark'>>;
      if (typeof parsed.isCompact === 'boolean') {
        setIsCompact(parsed.isCompact);
      }
      if (typeof parsed.isDark === 'boolean') {
        setIsDark(parsed.isDark);
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isCompact,
        isDark,
      }),
    );
  }, [hasLoaded, isCompact, isDark]);

  const value = useMemo(
    () => ({ isCompact, setIsCompact, isDark, setIsDark }),
    [isCompact, isDark],
  );

  return <DesignStateContext.Provider value={value}>{children}</DesignStateContext.Provider>;
}

export function useDesignState() {
  const context = useContext(DesignStateContext);

  if (!context) {
    throw new Error('useDesignState must be used within DesignStateProvider');
  }

  return context;
}
