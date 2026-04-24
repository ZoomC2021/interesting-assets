/**
 * Benchmark calculations for sector aggregation
 * Implements median, quartiles, and percentile calculations
 */

import type { NormalizedReitData, MetricType, Metric } from '@/types/frontend';

// ============================================================================
// Types
// ============================================================================

export interface BenchmarkStats {
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  p10: number;  // 10th percentile
  p90: number;  // 90th percentile
  count: number;
  mean: number;
}

export interface EntityBenchmarkComparison {
  entityId: string;
  entityCode: string;
  entityName: string;
  metricType: MetricType;
  value: number;
  percentile: number;  // 0-100
  rank: number;  // 1 = highest
  vsMedian: number;  // percentage difference from median
  vsSector: 'above' | 'at' | 'below';
  zScore: number;  // standard deviations from mean
}

export interface SectorBenchmark {
  metricType: MetricType;
  stats: BenchmarkStats;
  comparisons: EntityBenchmarkComparison[];
  lastUpdated: string;
}

// ============================================================================
// Statistical Calculations
// ============================================================================

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sortedValues.length) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function calculateStats(values: number[]): BenchmarkStats | null {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  
  // Calculate standard deviation for z-score
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    median: calculatePercentile(sorted, 50),
    q1: calculatePercentile(sorted, 25),
    q3: calculatePercentile(sorted, 75),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p10: calculatePercentile(sorted, 10),
    p90: calculatePercentile(sorted, 90),
    count: sorted.length,
    mean,
  };
}

function calculatePercentileRank(sortedValues: number[], value: number): number {
  if (sortedValues.length === 0) return 50;
  
  // Find position where value would be inserted
  let countBelow = 0;
  let countEqual = 0;
  
  for (const v of sortedValues) {
    if (v < value) countBelow++;
    else if (v === value) countEqual++;
  }
  
  // Percentile rank formula: (count below + 0.5 * count equal) / total * 100
  return ((countBelow + 0.5 * countEqual) / sortedValues.length) * 100;
}

// ============================================================================
// Benchmark Building
// ============================================================================

export function buildSectorBenchmark(
  datasets: NormalizedReitData[],
  metricType: MetricType,
  isHigherBetter: boolean = true
): SectorBenchmark | null {
  // Extract values for this metric
  const values: Array<{ entity: NormalizedReitData['entity']; value: number }> = [];
  
  for (const data of datasets) {
    const metric = data.metrics.find(m => m.metricType === metricType);
    if (metric && typeof metric.value === 'number' && metric.value !== null) {
      values.push({
        entity: data.entity,
        value: metric.value,
      });
    }
  }
  
  if (values.length < 2) return null;
  
  const numericValues = values.map(v => v.value);
  const stats = calculateStats(numericValues);
  
  if (!stats) return null;
  
  const sortedForPercentile = [...numericValues].sort((a, b) => a - b);
  
  // Sort for ranking (descending if higher is better)
  const sortedForRank = isHigherBetter 
    ? [...values].sort((a, b) => b.value - a.value)
    : [...values].sort((a, b) => a.value - b.value);
  
  const comparisons: EntityBenchmarkComparison[] = sortedForRank.map((item, index) => {
    const percentile = calculatePercentileRank(sortedForPercentile, item.value);
    const vsMedian = stats.median !== 0 
      ? ((item.value - stats.median) / stats.median) * 100 
      : 0;
    
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - stats.mean, 2), 0) / numericValues.length;
    const stdDev = Math.sqrt(variance) || 1;
    const zScore = (item.value - stats.mean) / stdDev;
    
    return {
      entityId: item.entity.id,
      entityCode: item.entity.code,
      entityName: item.entity.name,
      metricType,
      value: item.value,
      percentile,
      rank: index + 1,
      vsMedian,
      vsSector: vsMedian > 2 ? 'above' : vsMedian < -2 ? 'below' : 'at',
      zScore,
    };
  });
  
  return {
    metricType,
    stats,
    comparisons,
    lastUpdated: new Date().toISOString(),
  };
}

export function buildAllBenchmarks(
  datasets: NormalizedReitData[],
  metricTypes: MetricType[]
): Record<MetricType, SectorBenchmark> {
  const benchmarks: Partial<Record<MetricType, SectorBenchmark>> = {};
  
  // Metrics where lower is better
  const lowerIsBetter: MetricType[] = [
    'gearing_ratio',
    'floating_rate_debt_pct',
    'top_tenant_concentration',
    'tenant_risk_rating',
  ];
  
  for (const metricType of metricTypes) {
    const isHigherBetter = !lowerIsBetter.includes(metricType);
    const benchmark = buildSectorBenchmark(datasets, metricType, isHigherBetter);
    if (benchmark) {
      benchmarks[metricType] = benchmark;
    }
  }
  
  return benchmarks as Record<MetricType, SectorBenchmark>;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getBenchmarkComparison(
  benchmarks: Record<MetricType, SectorBenchmark>,
  entityId: string,
  metricType: MetricType
): EntityBenchmarkComparison | undefined {
  const benchmark = benchmarks[metricType];
  if (!benchmark) return undefined;
  
  return benchmark.comparisons.find(c => c.entityId === entityId);
}

export function formatPercentile(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Above Avg';
  if (percentile >= 25) return 'Below Avg';
  return 'Bottom 25%';
}

export function getPercentileColor(percentile: number, isHigherBetter: boolean = true): string {
  // For metrics where higher is better
  if (isHigherBetter) {
    if (percentile >= 75) return '#22c55e'; // green-500
    if (percentile >= 50) return '#84cc16'; // lime-500
    if (percentile >= 25) return '#eab308'; // yellow-500
    return '#f97316'; // orange-500
  }
  
  // For metrics where lower is better (invert)
  if (percentile <= 25) return '#22c55e'; // green-500
  if (percentile <= 50) return '#84cc16'; // lime-500
  if (percentile <= 75) return '#eab308'; // yellow-500
  return '#f97316'; // orange-500
}

export function getRankBadge(rank: number, total: number): { text: string; color: string } {
  const percentile = ((total - rank) / total) * 100;
  
  if (rank === 1) return { text: '#1', color: '#fbbf24' }; // gold
  if (rank === 2) return { text: '#2', color: '#94a3b8' }; // silver
  if (rank === 3) return { text: '#3', color: '#b45309' }; // bronze
  if (percentile >= 75) return { text: `Top ${Math.round(percentile)}%`, color: '#22c55e' };
  if (percentile >= 50) return { text: `Top ${Math.round(percentile)}%`, color: '#84cc16' };
  return { text: `#${rank}`, color: '#64748b' };
}
