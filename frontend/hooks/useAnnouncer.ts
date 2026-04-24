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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const id = `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setAnnouncements(prev => [...prev, { message, priority, id }]);

    // Auto-clear announcement after it's been read
    // Screen readers typically need a short delay to register the change
    timeoutRef.current = setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
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
