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

// Seed isDark from prefers-color-scheme when no stored value exists
function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Pick<DesignStateValue, 'isCompact' | 'isDark'>>;
      if (typeof parsed.isDark === 'boolean') {
        return parsed.isDark;
      }
    }
  } catch {
    // Ignore corrupted storage
  }
  // Fall back to OS preference
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function DesignStateProvider({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Guard JSON.parse and localStorage access
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Pick<DesignStateValue, 'isCompact' | 'isDark'>>;
        if (typeof parsed.isCompact === 'boolean') {
          setIsCompact(parsed.isCompact);
        }
        // Use stored dark value or fall back to OS preference
        if (typeof parsed.isDark === 'boolean') {
          setIsDark(parsed.isDark);
        } else {
          setIsDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
        }
      } else {
        // No stored value, use OS preference
        setIsDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
      }
    } catch {
      // Malformed localStorage - ignore and use defaults
      setIsDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    // Wrap setItem in try/catch for quota-exceeded or disabled storage
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isCompact,
          isDark,
        }),
      );
    } catch {
      // Ignore localStorage write errors (e.g., Safari private mode, quota exceeded)
    }
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
