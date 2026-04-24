/**
 * Core Schema Types for REIT Data Contract
 * 
 * Defines canonical normalized TypeScript interfaces for 6 core entities:
 * - Entity (REIT)
 * - Metric
 * - TimeSeries
 * - RiskAssessment
 * - Reference
 * - Observation
 */

import { z } from 'zod';

// ============================================================================
// Base Types
// ============================================================================

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DisplayIdRegex = {
  ATRIUM: /^T:\d+$/,
  AXIS: /^A:\d+$/
};

// ============================================================================
// Zod Schemas (Runtime Validation)
// ============================================================================

export const ReferenceSchema = z.object({
  id: z.string().uuid(),
  displayId: z.string().regex(/^[TA]:\d+$/),
  fact: z.string().min(1),
  source: z.string().min(1),
  citation: z.string().min(1),
  url: z.string().url().optional(),
  dateAccessed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  timeSensitive: z.boolean().default(false),
  entityId: z.string().uuid()
});

export const EntitySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  exchange: z.string().min(1),
  sector: z.string().min(1),
  currency: z.string().default('MYR'),
  isShariahCompliant: z.boolean(),
  listingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  manager: z.object({
    name: z.string().min(1),
    ownershipStructure: z.string().optional(),
    controllingShareholder: z.string().optional()
  }),
  trustee: z.string().min(1),
  fiscalYearEnd: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31)
  }),
  references: z.array(z.string().uuid())
});

export const MetricValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.null()
]);

export const MetricSchema = z.object({
  id: z.string().uuid(),
  metricType: z.enum([
    // Portfolio metrics
    'portfolio_size',
    'total_assets',
    'investment_properties',
    'property_count',
    'net_lettable_area',
    'geographic_concentration',
    
    // Financial metrics
    'gross_revenue',
    'net_property_income',
    'realised_income',
    'net_profit',
    'nav_per_unit',
    'market_cap',
    'share_price',
    
    // Per-share metrics
    'dpu',
    'dpu_growth_yoy',
    'dividend_yield_market',
    'dividend_yield_nav',
    'payout_ratio',
    
    // Leverage metrics
    'gearing_ratio',
    'interest_coverage',
    'total_borrowings',
    'fixed_rate_debt_pct',
    'floating_rate_debt_pct',
    'wacd',
    
    // Operational metrics
    'occupancy_rate',
    'wale_years',
    'tenant_count',
    'top_tenant_concentration',
    'rental_reversion',
    'lease_renewal_rate',
    'npi_margin',
    
    // Risk metrics
    'tenant_risk_rating',
    'interest_rate_sensitivity',
    'refinancing_risk',
    
    // Market metrics
    'price_to_book',
    'premium_discount_to_nav'
  ]),
  value: MetricValueSchema,
  unit: z.string().optional(),
  period: z.object({
    type: z.enum(['point_in_time', 'fiscal_year', 'quarter', 'trailing_twelve_months']),
    fiscalYear: z.number().int().optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),
  isEstimated: z.boolean().default(false),
  isTimeSensitive: z.boolean().default(false),
  sourceDisplayIds: z.array(z.string().regex(/^[TA]:\d+$/))
});

export const TimeSeriesPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: MetricValueSchema,
  isInterpolated: z.boolean().default(false),
  sourceDisplayId: z.string().regex(/^[TA]:\d+$/).optional()
});

export const TimeSeriesSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  metricType: MetricSchema.shape.metricType,
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  unit: z.string(),
  dataPoints: z.array(TimeSeriesPointSchema).min(1),
  sourceDisplayIds: z.array(z.string().regex(/^[TA]:\d+$/)),
  metadata: z.object({
    startDate: z.string(),
    endDate: z.string(),
    pointCount: z.number()
  }).optional()
});

export const RiskFactorSchema = z.object({
  category: z.enum([
    'concentration',
    'gearing',
    'interest_rate',
    'tenant_rollover',
    'liquidity',
    'transparency',
    'geographic',
    'counterparty',
    'governance',
    'market',
    'operational'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1).optional(),
  description: z.string().min(1),
  currentScore: z.number().optional(),
  benchmarkScore: z.number().optional(),
  peerComparison: z.enum(['better', 'similar', 'worse']).optional(),
  quantitativeBacking: z.array(z.object({
    metricType: z.string(),
    value: z.union([z.number(), z.string()]),
    context: z.string()
  })).optional(),
  mitigatingFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['significant', 'moderate', 'minor'])
  })),
  aggravatingFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['significant', 'moderate', 'minor'])
  })),
  trend: z.enum(['improving', 'stable', 'deteriorating', 'unknown']).optional(),
  monitoringTriggers: z.array(z.string()).optional(),
  relatedMetricTypes: z.array(MetricSchema.shape.metricType).optional(),
  sourceDisplayIds: z.array(z.string().regex(/^[TA]:\d+$/))
});

export const RiskAssessmentSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallRiskRating: z.enum(['low', 'moderate', 'moderate_high', 'high']),
  overallScore: z.number().optional(),
  riskFactors: z.array(RiskFactorSchema).min(1),
  peerComparison: z.object({
    vsPeerId: z.string().uuid(),
    relativeRisk: z.enum(['lower', 'similar', 'higher']),
    keyDifferences: z.array(z.string())
  }).optional()
});

export const ObservationSchema = z.object({
  id: z.string().uuid(),
  observationType: z.enum([
    'executive_summary',
    'portfolio_analysis',
    'financial_performance',
    'debt_sustainability',
    'dividend_sustainability',
    'risk_assessment',
    'peer_comparison',
    'market_context'
  ]),
  content: z.string().min(1),
  summary: z.string().min(1).optional(),
  priority: z.enum(['info', 'positive', 'warning', 'critical']).default('info'),
  keyFacts: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional()
  })).optional(),
  indicator: z.object({
    icon: z.string(),
    color: z.string(),
    badge: z.string().optional()
  }).optional(),
  relatedMetrics: z.array(z.object({
    metricType: z.string(),
    value: z.union([z.string(), z.number()]).optional(),
    context: z.string().optional()
  })).optional(),
  relatedRisks: z.array(z.object({
    category: z.string(),
    severity: z.string().optional()
  })).optional(),
  primaryCitation: z.string().optional(),
  relatedMetricTypes: z.array(MetricSchema.shape.metricType).optional(),
  sourceDisplayIds: z.array(z.string().regex(/^[TA]:\d+$/)).min(1)
});

// ============================================================================
// TypeScript Types (Static Types)
// ============================================================================

export type Reference = z.infer<typeof ReferenceSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;
export type TimeSeries = z.infer<typeof TimeSeriesSchema>;
export type RiskFactor = z.infer<typeof RiskFactorSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type MetricType = z.infer<typeof MetricSchema.shape.metricType>;

// ============================================================================
// Normalized Output Type
// ============================================================================

export interface NormalizedReitData {
  schemaVersion: string;
  generatedAt: string;
  entity: Entity;
  references: Reference[];
  metrics: Metric[];
  timeSeries: TimeSeries[];
  riskAssessment: RiskAssessment;
  observations: Observation[];
}

export const NormalizedReitDataSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/),
  entity: EntitySchema,
  references: z.array(ReferenceSchema),
  metrics: z.array(MetricSchema),
  timeSeries: z.array(TimeSeriesSchema),
  riskAssessment: RiskAssessmentSchema,
  observations: z.array(ObservationSchema)
});
