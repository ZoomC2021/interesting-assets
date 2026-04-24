/**
 * Observation (Fact Instances) Type Definitions
 * 
 * Structured observations extracted from analysis documents,
 * with priority levels and linkages to metrics and citations.
 */

import { z } from 'zod';

// ============================================================================
// Observation Types and Priority
// ============================================================================

export const ObservationTypeSchema = z.enum([
  'executive_summary',
  'portfolio_analysis',
  'financial_performance',
  'debt_sustainability',
  'dividend_sustainability',
  'risk_assessment',
  'peer_comparison',
  'market_context',
  'management_assessment',
  'industry_benchmark'
]);

export const ObservationPrioritySchema = z.enum([
  'info',      // Neutral information
  'positive',  // Favorable finding
  'warning',   // Area of concern
  'critical'   // Significant issue
]);

// ============================================================================
// Observation Extended
// ============================================================================

export const ObservationExtendedSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  
  // Classification
  observationType: ObservationTypeSchema,
  priority: ObservationPrioritySchema,
  
  // Content
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().min(1).max(500),
  
  // Supporting data
  keyFacts: z.array(z.object({
    label: z.string().min(1),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional()
  })).default([]),
  
  // Visual indicator
  indicator: z.object({
    icon: z.enum(['check', 'warning', 'alert', 'info', 'trend_up', 'trend_down', 'neutral']),
    color: z.enum(['green', 'yellow', 'orange', 'red', 'blue', 'gray']),
    badge: z.string().optional()
  }),
  
  // Linkages
  relatedMetrics: z.array(z.object({
    metricType: z.string(),
    value: z.union([z.string(), z.number()]).optional(),
    context: z.string().optional()
  })).default([]),
  
  relatedRisks: z.array(z.object({
    category: z.string(),
    severity: z.string().optional()
  })).default([]),
  
  // Citations
  sourceDisplayIds: z.array(z.string().regex(/^[TA]:\d+$/)).min(1),
  primaryCitation: z.string().regex(/^[TA]:\d+$/),
  
  // Context
  context: z.object({
    fiscalYear: z.number().int().optional(),
    quarter: z.number().int().min(1).max(4).optional(),
    comparisonPeriod: z.string().optional(),
    peerEntityId: z.string().uuid().optional()
  }).optional(),
  
  // Assessment
  assessment: z.object({
    verdict: z.enum(['sustainable', 'monitor', 'concerning', 'unsustainable']).optional(),
    trend: z.enum(['improving', 'stable', 'deteriorating', 'volatile']).optional(),
    outlook: z.enum(['positive', 'neutral', 'negative']).optional()
  }).optional()
});

// ============================================================================
// Observation Group
// ============================================================================

export const ObservationGroupSchema = z.object({
  groupType: ObservationTypeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  
  summaryStats: z.object({
    totalObservations: z.number().int().nonnegative(),
    positiveCount: z.number().int().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    criticalCount: z.number().int().nonnegative(),
    infoCount: z.number().int().nonnegative()
  }),
  
  keyTakeaway: z.string().min(1),
  
  observations: z.array(ObservationExtendedSchema)
});

// ============================================================================
// Observation Registry
// ============================================================================

export interface ObservationRegistry {
  entityId: string;
  generatedAt: string;
  schemaVersion: string;
  
  groups: z.infer<typeof ObservationGroupSchema>[];
  
  // Flat index
  allObservations: z.infer<typeof ObservationExtendedSchema>[];
  
  // Indexes
  byType: Record<z.infer<typeof ObservationTypeSchema>, string[]>;
  byPriority: Record<z.infer<typeof ObservationPrioritySchema>, string[]>;
  byMetricType: Record<string, string[]>;
  byRiskCategory: Record<string, string[]>;
}

// ============================================================================
// Observation Helpers
// ============================================================================

export const OBSERVATION_TYPE_METADATA: Record<
  z.infer<typeof ObservationTypeSchema>,
  { label: string; description: string; order: number }
> = {
  executive_summary: {
    label: 'Executive Summary',
    description: 'High-level overview and key highlights',
    order: 1
  },
  portfolio_analysis: {
    label: 'Portfolio Analysis',
    description: 'Property portfolio quality and composition',
    order: 2
  },
  financial_performance: {
    label: 'Financial Performance',
    description: 'Revenue, NPI, and profitability analysis',
    order: 3
  },
  debt_sustainability: {
    label: 'Debt Sustainability',
    description: 'Leverage, coverage, and refinancing risk',
    order: 4
  },
  dividend_sustainability: {
    label: 'Dividend Sustainability',
    description: 'DPU stability and growth prospects',
    order: 5
  },
  risk_assessment: {
    label: 'Risk Assessment',
    description: 'Key risks and mitigation factors',
    order: 6
  },
  peer_comparison: {
    label: 'Peer Comparison',
    description: 'Comparison with comparable REITs',
    order: 7
  },
  market_context: {
    label: 'Market Context',
    description: 'Industry trends and market positioning',
    order: 8
  },
  management_assessment: {
    label: 'Management Assessment',
    description: 'REIT manager evaluation',
    order: 9
  },
  industry_benchmark: {
    label: 'Industry Benchmark',
    description: 'Comparison with industry standards',
    order: 10
  }
};

export const PRIORITY_METADATA: Record<
  z.infer<typeof ObservationPrioritySchema>,
  { label: string; color: string; icon: string }
> = {
  info: { label: 'Information', color: 'blue', icon: 'info' },
  positive: { label: 'Positive', color: 'green', icon: 'check' },
  warning: { label: 'Warning', color: 'yellow', icon: 'warning' },
  critical: { label: 'Critical', color: 'red', icon: 'alert' }
};

export function getObservationTypeLabel(type: z.infer<typeof ObservationTypeSchema>): string {
  return OBSERVATION_TYPE_METADATA[type].label;
}

export function getPriorityMetadata(priority: z.infer<typeof ObservationPrioritySchema>) {
  return PRIORITY_METADATA[priority];
}

// ============================================================================
// Type Exports
// ============================================================================

export type ObservationType = z.infer<typeof ObservationTypeSchema>;
export type ObservationPriority = z.infer<typeof ObservationPrioritySchema>;
export type ObservationExtended = z.infer<typeof ObservationExtendedSchema>;
export type ObservationGroup = z.infer<typeof ObservationGroupSchema>;
