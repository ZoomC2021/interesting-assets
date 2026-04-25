'use client';

/**
 * Hook for loading entity data
 */

import { useState, useEffect, useCallback } from 'react';
import type { NormalizedReitData } from '@/types/frontend';
import { loadMultipleEntities } from '@/lib/comparison-model';
import { normalizeEntityCodes } from '@/lib/available-entities';

export interface UseEntityDataResult {
  data: NormalizedReitData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEntityData(entityCodes: string[]): UseEntityDataResult {
  const normalizedCodes = normalizeEntityCodes(entityCodes);
  const [data, setData] = useState<NormalizedReitData[]>([]);
  const [isLoading, setIsLoading] = useState(normalizedCodes.length > 0);
  const [error, setError] = useState<string | null>(null);

  // Create a stable key from entityCodes to prevent infinite re-renders
  const stableKey = normalizedCodes.join('|');

  const fetchData = useCallback(async () => {
    if (normalizedCodes.length === 0) {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await loadMultipleEntities(normalizedCodes);
      setData(results);
      
      if (results.length === 0 && normalizedCodes.length > 0) {
        setError('No data found for the specified entities');
      } else if (results.length < normalizedCodes.length) {
        setError(`Only loaded ${results.length} of ${normalizedCodes.length} entities`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entity data');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export {
  AVAILABLE_ENTITIES,
  type AvailableEntityCode,
} from '@/lib/available-entities';
