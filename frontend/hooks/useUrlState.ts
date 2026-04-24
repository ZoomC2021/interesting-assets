'use client';

/**
 * Hook for URL state management
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface UrlState {
  selectedEntities: string[];
  metricCategory: string;
}

export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL state
  const getStateFromUrl = useCallback((): UrlState => {
    const entities = searchParams.get('entities');
    const category = searchParams.get('category');
    
    return {
      selectedEntities: entities ? entities.split(',') : ['5130.KL', '5106.KL'],
      metricCategory: category || 'all',
    };
  }, [searchParams]);

  const [state, setState] = useState<UrlState>(getStateFromUrl);

  // Sync with URL on mount and when URL changes
  useEffect(() => {
    setState(getStateFromUrl());
  }, [getStateFromUrl]);

  // Update URL state
  const updateUrlState = useCallback((updates: Partial<UrlState>) => {
    const newState = { ...state, ...updates };
    
    const params = new URLSearchParams();
    if (newState.selectedEntities.length > 0) {
      params.set('entities', newState.selectedEntities.join(','));
    }
    if (newState.metricCategory && newState.metricCategory !== 'all') {
      params.set('category', newState.metricCategory);
    }
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
    
    setState(newState);
  }, [state, pathname, router]);

  // Toggle entity selection
  const toggleEntity = useCallback((entityCode: string) => {
    const current = state.selectedEntities;
    const isSelected = current.includes(entityCode);
    
    let newSelection: string[];
    if (isSelected) {
      // Don't allow unselecting the last entity
      if (current.length <= 1) return;
      newSelection = current.filter(e => e !== entityCode);
    } else {
      // Limit to 3 entities max
      if (current.length >= 3) {
        newSelection = [...current.slice(1), entityCode];
      } else {
        newSelection = [...current, entityCode];
      }
    }
    
    updateUrlState({ selectedEntities: newSelection });
  }, [state.selectedEntities, updateUrlState]);

  // Set metric category
  const setMetricCategory = useCallback((category: string) => {
    updateUrlState({ metricCategory: category });
  }, [updateUrlState]);

  return {
    selectedEntities: state.selectedEntities,
    metricCategory: state.metricCategory,
    toggleEntity,
    setMetricCategory,
    updateUrlState,
  };
}
