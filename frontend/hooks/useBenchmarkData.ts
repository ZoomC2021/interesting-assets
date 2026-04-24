'use client';

/**
 * Hook for benchmark data calculations
 */

import { useMemo } from 'react';
import type { NormalizedReitData, MetricType } from '@/types/frontend';
import type { SectorBenchmark, EntityBenchmarkComparison } from '@/lib/benchmark-calculations';
import { buildAllBenchmarks, getBenchmarkComparison } from '@/lib/benchmark-calculations';
import { getAllMetricTypes } from '@/lib/data-utils';

export interface UseBenchmarkDataResult {
  benchmarks: Record<MetricType, SectorBenchmark>;
  getComparison: (entityId: string, metricType: MetricType) => EntityBenchmarkComparison | undefined;
  isLoading: boolean;
}

export function useBenchmarkData(datasets: NormalizedReitData[]): UseBenchmarkDataResult {
  const benchmarks = useMemo(() => {
    if (datasets.length === 0) {
      return {} as Record<MetricType, SectorBenchmark>;
    }
    
    const metricTypes = getAllMetricTypes();
    return buildAllBenchmarks(datasets, metricTypes);
  }, [datasets]);
  
  const getComparison = (entityId: string, metricType: MetricType): EntityBenchmarkComparison | undefined => {
    return getBenchmarkComparison(benchmarks, entityId, metricType);
  };
  
  return {
    benchmarks,
    getComparison,
    isLoading: false,
  };
}
