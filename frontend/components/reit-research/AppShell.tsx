'use client';

import React, { useEffect } from 'react';
import { DesignStateProvider, useDesignState } from './DesignStateProvider';
import { GlobalNav } from './GlobalNav';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isCompact, setIsCompact, isDark, setIsDark } = useDesignState();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink selection:bg-accent selection:text-white">
      <GlobalNav
        isCompact={isCompact}
        setIsCompact={setIsCompact}
        isDark={isDark}
        setIsDark={setIsDark}
      />
      <main id="main-content">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DesignStateProvider>
      <div className="overflow-x-clip">
        <AppShellInner>{children}</AppShellInner>
      </div>
    </DesignStateProvider>
  );
}
