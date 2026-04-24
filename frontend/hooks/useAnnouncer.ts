'use client';

/**
 * useAnnouncer - Hook for screen reader announcements
 * Manages aria-live regions for dynamic content changes
 */

import { useState, useCallback, useRef, useEffect } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface Announcement {
  message: string;
  priority: AnnouncePriority;
  id: string;
}

interface UseAnnouncerResult {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncePriority) => void;
  /** Clear current announcements */
  clearAnnouncements: () => void;
  /** Props to spread on aria-live region elements */
  liveRegionProps: {
    polite: {
      'aria-live': 'polite';
      'aria-atomic': 'true';
      className: string;
    };
    assertive: {
      'aria-live': 'assertive';
      'aria-atomic': 'true';
      className: string;
    };
  };
  /** Current announcements (for debugging) */
  announcements: Announcement[];
}

export function useAnnouncer(): UseAnnouncerResult {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAnnouncements(prev => [...prev, { message, priority, id }]);

    // Auto-clear announcement after it's been read
    // Screen readers typically need a short delay to register the change
    const timeout = setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      timeoutsRef.current.delete(id);
    }, 1000);
    timeoutsRef.current.set(id, timeout);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  const liveRegionProps = {
    polite: {
      'aria-live': 'polite' as const,
      'aria-atomic': 'true' as const,
      className: 'sr-only',
    },
    assertive: {
      'aria-live': 'assertive' as const,
      'aria-atomic': 'true' as const,
      className: 'sr-only',
    },
  };

  return {
    announce,
    clearAnnouncements,
    liveRegionProps,
    announcements,
  };
}

/**
 * Static live region props for use when you don't need the hook
 * Use these directly on aria-live elements
 */
export const ariaLiveProps = {
  polite: {
    'aria-live': 'polite' as const,
    'aria-atomic': 'true' as const,
    className: 'sr-only',
  },
  assertive: {
    'aria-live': 'assertive' as const,
    'aria-atomic': 'true' as const,
    className: 'sr-only',
  },
};

export default useAnnouncer;
