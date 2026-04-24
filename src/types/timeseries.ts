/**
 * TimeSeries Type Definitions
 * 
 * Specialized types for time-series data including:
 * - Quarterly financial series
 * - Historical DPU trends
 * - Price/volume series
 * - Debt maturity profile
 */

import { z } from 'zod';
import { MetricType } from './schema';

// ============================================================================
// TimeSeries Types
// ============================================================================

export const TimeSeriesTypeSchema = z.enum([
  'quarterly_revenue',
  'quarterly_npi',
  'quarterly_net_profit',
  'historical_dpu',
  'share_price',
  'debt_maturity_profile',
  'lease_expiry_profile',
  'occupancy_history',
  'gearing_history',
  'interest_coverage_history'
]);

export const DataQualitySchema = z.object({
  isInterpolated: z.boolean().default(false),
  isEstimated: z.boolean().default(false),
  confidence: z.enum(['high', 'medium', 'low']).default('high'),
  dataGap: z.boolean().default(false),
  notes: z.string().optional()
});

// ============================================================================
// Specialized TimeSeries Schemas
// ============================================================================

export const QuarterlyFinancialPointSchema = z.object({
  fiscalYear: z.number().int(),
  quarter: z.number().int().min(1).max(4),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revenueRM: z.number().nonnegative(),
  npiRM: z.number().nonnegative(),
  netProfitRM: z.number(),
  dpuSen: z.number().nonnegative(),
  quality: DataQualitySchema
});

export const HistoricalDpuPointSchema = z.object({
  fiscalYear: z.number().int(),
  annualDpuSen: z.number().nonnegative(),
  yoyChangePct: z.number(),
  quarterlyBreakdown: z.array(z.object({
    quarter: z.number().int().min(1).max(4),
    dpuSen: z.number().nonnegative(),
    exDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })).optional(),
  quality: DataQualitySchema
});

export const DebtMaturityBucketSchema = z.object({
  period: z.enum(['on_demand', 'within_1_year', 'year_1_to_5', 'year_5_plus']),
  amountRM: z.number().nonnegative(),
  percentageOfTotal: z.number().min(0).max(100),
  breakdown: z.array(z.object({
    facilityType: z.enum(['bank_overdraft', 'term_loan', 'mtn', 'revolving_credit', 'sukuk']),
    amountRM: z.number().nonnegative()
  })).optional()
});

export const DebtMaturityProfileSchema = z.object({
  totalBorrowingsRM: z.number().positive(),
  buckets: z.array(DebtMaturityBucketSchema),
  weightedAvgMaturityYears: z.number().nonnegative().optional(),
  refinancingRiskAssessment: z.enum(['low', 'medium', 'high'])
});

export const LeaseExpiryBucketSchema = z.object({
  year: z.number().int(),
  expiringAreaSqFt: z.number().nonnegative().optional(),
  expiringIncomePct: z.number().min(0).max(100).optional(),
  tenantCount: z.number().int().nonnegative().optional()
});

export const LeaseExpiryProfileSchema = z.object({
  waleYears: z.number().nonnegative().optional(),
  buckets: z.array(LeaseExpiryBucketSchema),
  rolloverRiskAssessment: z.enum(['low', 'medium', 'high'])
});

// ============================================================================
// TimeSeries Extended
// ============================================================================

export interface TimeSeriesExtended {
  id: string;
  entityId: string;
  seriesType: z.infer<typeof TimeSeriesTypeSchema>;
  metricType?: MetricType;
  frequency: 'quarterly' | 'annual' | 'monthly' | 'daily';
  unit: string;
  
  // Type-specific data
  quarterlyFinancials?: z.infer<typeof QuarterlyFinancialPointSchema>[];
  historicalDpu?: z.infer<typeof HistoricalDpuPointSchema>[];
  debtMaturityProfile?: z.infer<typeof DebtMaturityProfileSchema>;
  leaseExpiryProfile?: z.infer<typeof LeaseExpiryProfileSchema>;
  
  // Generic series data
  dataPoints: {
    date: string;
    value: number;
    quality: z.infer<typeof DataQualitySchema>;
    sourceDisplayId?: string;
  }[];
  
  sourceDisplayIds: string[];
  metadata: {
    startDate: string;
    endDate: string;
    pointCount: number;
    gapsIdentified: number;
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type TimeSeriesType = z.infer<typeof TimeSeriesTypeSchema>;
export type DataQuality = z.infer<typeof DataQualitySchema>;
export type QuarterlyFinancialPoint = z.infer<typeof QuarterlyFinancialPointSchema>;
export type HistoricalDpuPoint = z.infer<typeof HistoricalDpuPointSchema>;
export type DebtMaturityBucket = z.infer<typeof DebtMaturityBucketSchema>;
export type DebtMaturityProfile = z.infer<typeof DebtMaturityProfileSchema>;
export type LeaseExpiryBucket = z.infer<typeof LeaseExpiryBucketSchema>;
export type LeaseExpiryProfile = z.infer<typeof LeaseExpiryProfileSchema>;
