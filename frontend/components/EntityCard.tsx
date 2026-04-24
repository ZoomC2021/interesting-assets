'use client';

/**
 * EntityCard - Compact card view for mobile
 */

import React from 'react';
import Link from 'next/link';
import type { NormalizedReitData } from '@/types/frontend';
import type { EntityBenchmarkComparison } from '@/lib/benchmark-calculations';
import { RiskBadge } from './RiskBadge';
import { PercentileBar } from './BenchmarkIndicator';
import { SparklineWithTrend } from './SparklineChart';
import { formatRM, formatPercentage, formatRatio } from '@/lib/formatters';

interface EntityCardProps {
  data: NormalizedReitData;
  comparison?: EntityBenchmarkComparison;
  isSelected: boolean;
  onSelect: (id: string) => void;
  dpuHistory?: number[];
  className?: string;
}

export function EntityCard({
  data,
  comparison,
  isSelected,
  onSelect,
  dpuHistory = [],
  className = '',
}: EntityCardProps) {
  const { entity, metrics, riskAssessment } = data;
  
  // Get key metrics
  const marketCap = metrics.find(m => m.metricType === 'market_cap')?.value as number;
  const dpu = metrics.find(m => m.metricType === 'dpu')?.value as number;
  const dividendYield = metrics.find(m => m.metricType === 'dividend_yield_market')?.value as number;
  const gearing = metrics.find(m => m.metricType === 'gearing_ratio')?.value as number;
  const occupancy = metrics.find(m => m.metricType === 'occupancy_rate')?.value as number;
  const nav = metrics.find(m => m.metricType === 'nav_per_unit')?.value as number;
  
  // Get overall risk
  const overallRisk = riskAssessment.overallRiskRating;
  const riskSeverity = overallRisk === 'high' ? 'critical' 
    : overallRisk === 'moderate_high' ? 'high'
    : overallRisk === 'moderate' ? 'medium'
    : 'low';
  
  return (
    <div 
      className={`bg-white rounded-xl border transition-all ${
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
          : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onSelect(entity.id)}
            className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          
          {/* Entity info */}
          <div className="flex-1 min-w-0">
            <Link href={`/entity/${entity.code}`} className="block">
              <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600">
                {entity.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">{entity.code}</span>
              {entity.isShariahCompliant && (
                <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                  Shariah
                </span>
              )}
              <RiskBadge severity={riskSeverity} size="sm" />
            </div>
          </div>
          
          {/* Sparkline */}
          {dpuHistory.length > 0 && (
            <div className="hidden sm:block">
              <SparklineWithTrend data={dpuHistory} width={60} height={24} showTrend={false} />
            </div>
          )}
        </div>
        
        {/* Benchmark indicator */}
        {comparison && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sector ranking:</span>
              <PercentileBar 
                percentile={comparison.percentile} 
                isHigherBetter={true}
                size="sm"
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Key metrics grid */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-200">
        <MetricCell label="DPU" value={dpu ? `${dpu.toFixed(2)} sen` : '—'} />
        <MetricCell label="Yield" value={dividendYield ? formatPercentage(dividendYield) : '—'} />
        <MetricCell label="NAV" value={nav ? formatRM(nav) : '—'} highlight />
      </div>
      
      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-200">
        <MetricCell label="Gearing" value={gearing ? formatPercentage(gearing / 100) : '—'} />
        <MetricCell label="Occupancy" value={occupancy ? formatPercentage(occupancy / 100) : '—'} />
        <MetricCell label="Market Cap" value={marketCap ? formatRM(marketCap / 1e6, 1) : '—'} />
      </div>
      
      {/* Actions */}
      <div className="p-3 border-t border-gray-200 flex items-center gap-2">
        <Link
          href={`/entity/${entity.code}`}
          className="flex-1 text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          View Details
        </Link>
        <Link
          href={`/compare?entities=${entity.code}`}
          className="flex-1 text-center py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}

// Helper component for metric cells
interface MetricCellProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function MetricCell({ label, value, highlight = false }: MetricCellProps) {
  return (
    <div className="bg-white p-3 text-center">
      <div className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// Skeleton loader for cards
export function EntityCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 animate-pulse">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="flex gap-2 mt-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-14" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-3">
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-10 mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Bottom sheet for mobile filters
interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    sector: string;
    shariah: 'all' | 'yes' | 'no';
  };
  availableSectors: string[];
  onFilterChange: (filters: { sector: string; shariah: 'all' | 'yes' | 'no' }) => void;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  availableSectors,
  onFilterChange,
}: FilterBottomSheetProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto">
        <div className="p-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          
          {/* Sector filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => onFilterChange({ ...filters, sector: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Sectors</option>
              {availableSectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
          
          {/* Shariah filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              {(['all', 'yes', 'no'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => onFilterChange({ ...filters, shariah: option })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                    filters.shariah === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {option === 'all' ? 'All' : option === 'yes' ? 'Shariah' : 'Non-Shariah'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Apply button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
