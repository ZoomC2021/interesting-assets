'use client';

/**
 * Hook for loading entity data
 */

import { useState, useEffect, useCallback } from 'react';
import type { NormalizedReitData } from '@/types/frontend';
import { loadMultipleEntities } from '@/lib/comparison-model';

export interface UseEntityDataResult {
  data: NormalizedReitData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEntityData(entityCodes: string[]): UseEntityDataResult {
  const [data, setData] = useState<NormalizedReitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await loadMultipleEntities(entityCodes);
      setData(results);
      
      if (results.length === 0 && entityCodes.length > 0) {
        setError('No data found for the specified entities');
      } else if (results.length < entityCodes.length) {
        setError(`Only loaded ${results.length} of ${entityCodes.length} entities`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entity data');
    } finally {
      setIsLoading(false);
    }
  }, [entityCodes]);

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

// Available entity codes for selector
export const AVAILABLE_ENTITIES = [
  { code: '5130.KL', name: 'Atrium REIT' },
  { code: '5106.KL', name: 'Axis REIT' },
  { code: '5176.KL', name: 'Sunway REIT' },
  { code: '5204.KL', name: 'Pavilion REIT' },
  { code: '5227.KL', name: 'IGB REIT' },
  { code: '5235.KL', name: 'KLCC REIT' },
  { code: '5180.KL', name: 'CMMT' },
  { code: '5114.KL', name: 'Al-Salam REIT' },
  { code: '5121.KL', name: 'Hektar REIT' },
  { code: '5200.KL', name: 'UOA REIT' },
] as const;

export type AvailableEntityCode = typeof AVAILABLE_ENTITIES[number]['code'];
