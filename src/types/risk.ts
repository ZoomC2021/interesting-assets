/**
 * Risk Assessment Type Definitions
 * 
 * Comprehensive risk assessment types covering:
 * - Tenant/concentration risk
 * - Debt/gearing risk
 * - Interest rate exposure
 * - Governance risk
 * - Market/competitive risk
 */

import { z } from 'zod';

// ============================================================================
// Risk Categories and Severity
// ============================================================================

export const RiskCategorySchema = z.enum([
  'concentration',      // Tenant/property concentration
  'gearing',           // Debt leverage
  'interest_rate',     // Rate sensitivity
  'tenant_rollover',   // Lease expiry/WALE
  'liquidity',         // Trading liquidity
  'transparency',      // Disclosure gaps
  'geographic',        // Location concentration
  'counterparty',      // Major tenant credit
  'governance',        // Management structure
  'market',            // Market valuation
  'operational'        // Operations/occupancy
]);

export const RiskSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const OverallRiskRatingSchema = z.enum(['low', 'moderate', 'moderate_high', 'high']);

// ============================================================================
// Risk Factor Detail
// ============================================================================

export const RiskFactorDetailSchema = z.object({
  id: z.string().uuid(),
  category: RiskCategorySchema,
  severity: RiskSeveritySchema,
  
  // Quantitative backing
  quantitativeBacking: z.array(z.object({
    metricType: z.string(),
    value: z.union([z.number(), z.string()]),
    context: z.string()
  })).optional(),
  
  // Qualitative assessment
  title: z.string().min(1),
  description: z.string().min(1),
  
  // Scoring
  currentScore: z.number().min(1).max(5),
  benchmarkScore: z.number().min(1).max(5).optional(),
  peerComparison: z.enum(['better', 'similar', 'worse']).optional(),
  
  // Factors
  mitigatingFactors: z.array(z.object({
    factor: z.string().min(1),
    impact: z.enum(['significant', 'moderate', 'minor'])
  })),
  
  aggravatingFactors: z.array(z.object({
    factor: z.string().min(1),
    impact: z.enum(['significant', 'moderate', 'minor'])
  })),
  
  // Monitoring
  trend: z.enum(['improving', 'stable', 'deteriorating', 'unknown']).default('stable'),
  monitoringTriggers: z.array(z.string()),
  
  // Citations
  sourceDisplayIds: z.array(z.string().regex(/^[TAC]:\d+$/)).min(1)
});

// ============================================================================
// Peer Risk Comparison
// ============================================================================

export const PeerRiskComparisonSchema = z.object({
  peerEntityId: z.string().uuid(),
  peerName: z.string().min(1),
  
  overallComparison: z.object({
    relativeRisk: z.enum(['lower', 'similar', 'higher']),
    explanation: z.string().min(1)
  }),
  
  factorComparisons: z.array(z.object({
    category: RiskCategorySchema,
    thisRiskLevel: RiskSeveritySchema,
    peerRiskLevel: RiskSeveritySchema,
    delta: z.string().min(1),
    keyInsight: z.string().min(1)
  })).min(1),
  
  keyDifferentiators: z.array(z.object({
    factor: z.string().min(1),
    advantage: z.enum(['this_entity', 'peer', 'neutral']),
    magnitude: z.enum(['significant', 'moderate', 'minor'])
  }))
});

// ============================================================================
// Risk Assessment Extended
// ============================================================================

export const RiskAssessmentExtendedSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  
  // Metadata
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  assessmentPeriod: z.object({
    fiscalYear: z.number().int(),
    basedOnReport: z.string().min(1)
  }),
  
  // Overall rating
  overallRiskRating: OverallRiskRatingSchema,
  overallScore: z.number().min(1).max(5).optional(),
  
  // Factor breakdown
  riskFactors: z.array(RiskFactorDetailSchema).min(1),
  
  // Category summary
  categoryBreakdown: z.array(z.object({
    category: RiskCategorySchema,
    severity: RiskSeveritySchema,
    factorCount: z.number().int().positive(),
    topConcern: z.string().min(1)
  })),
  
  // Peer comparison
  peerComparison: PeerRiskComparisonSchema.optional(),
  
  // Assessment summary
  executiveSummary: z.object({
    keyRisks: z.array(z.string()).min(1).max(5),
    keyStrengths: z.array(z.string()).min(1).max(5),
    investorImplications: z.string().min(1)
  }),
  
  // Citations
  sourceDisplayIds: z.array(z.string().regex(/^[TAC]:\d+$/)).min(1)
});

// ============================================================================
// Risk Rating Helpers
// ============================================================================

export interface RiskRatingScale {
  score: number;
  label: string;
  description: string;
  color: string;
}

export const RISK_RATING_SCALE: RiskRatingScale[] = [
  { score: 1, label: 'Very Low', description: 'Minimal risk exposure', color: '#22c55e' },
  { score: 2, label: 'Low', description: 'Below average risk', color: '#84cc16' },
  { score: 3, label: 'Moderate', description: 'Average risk exposure', color: '#eab308' },
  { score: 4, label: 'High', description: 'Elevated risk requiring monitoring', color: '#f97316' },
  { score: 5, label: 'Critical', description: 'Severe risk requiring immediate attention', color: '#ef4444' }
];

export function scoreToRating(score: number): z.infer<typeof OverallRiskRatingSchema> {
  if (score <= 1.5) return 'low';
  if (score <= 2.5) return 'moderate';
  if (score <= 3.5) return 'moderate_high';
  return 'high';
}

export function severityToScore(severity: z.infer<typeof RiskSeveritySchema>): number {
  switch (severity) {
    case 'low': return 1.5;
    case 'medium': return 2.5;
    case 'high': return 3.5;
    case 'critical': return 4.5;
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type RiskCategory = z.infer<typeof RiskCategorySchema>;
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;
export type OverallRiskRating = z.infer<typeof OverallRiskRatingSchema>;
export type RiskFactorDetail = z.infer<typeof RiskFactorDetailSchema>;
export type PeerRiskComparison = z.infer<typeof PeerRiskComparisonSchema>;
export type RiskAssessmentExtended = z.infer<typeof RiskAssessmentExtendedSchema>;
