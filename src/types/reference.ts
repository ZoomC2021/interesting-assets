/**
 * Reference/Citation Type Definitions
 * 
 * Citation linking contract preserving T:XXX/A:XXX display IDs
 * while adding stable internal UUIDs.
 */

import { z } from 'zod';

// ============================================================================
// Source Types
// ============================================================================

export const SourceTypeSchema = z.enum([
  'annual_report',
  'quarterly_filing',
  'market_data',
  'financial_data',
  'news_analysis',
  'property_news',
  'regulatory_filing',
  'research',
  'industry_research',
  'company_data',
  'credit_rating',
  'central_bank',
  'calculated',
  'document_metadata'
]);

// ============================================================================
// Display ID Patterns
// ============================================================================

export const DisplayIdPattern = {
  ATRIUM: /^T:\d{1,3}[a-z]?$/,
  AXIS: /^A:\d{1,3}[a-z]?$/,
  SUNWAY: /^S:\d{1,3}[a-z]?$/,
  PAVILION: /^P:\d{1,3}[a-z]?$/,
  IGB: /^I:\d{1,3}[a-z]?$/,
  UOA: /^U:\d{1,3}[a-z]?$/,
  CMMT: /^C:\d{1,3}[a-z]?$/,
  HEKTAR: /^H:\d{1,3}[a-z]?$/,
  ALSALAM: /^L:\d{1,3}[a-z]?$/,
  KLCC: /^K:\d{1,3}[a-z]?$/,
  KIP: /^KIP:\d{1,3}[a-z]?$/,
  SENTRAL: /^SE:\d{1,3}[a-z]?$/,
  AMFIRST: /^AF:\d{1,3}[a-z]?$/,
  TOWER: /^To:\d{1,3}[a-z]?$/,
  PARADIGM: /^D:\d{1,3}[a-z]?$/,
  YTL: /^Y:\d{1,3}[a-z]?$/,
  VALID: /^([TAPSUICHLKRDY]:\d{1,3}[a-z]?|KIP:\d{1,3}[a-z]?|SE:\d{1,3}[a-z]?|AF:\d{1,3}[a-z]?|To:\d{1,3}[a-z]?)$/
};

// ============================================================================
// Reference Extended
// ============================================================================

export const ReferenceExtendedSchema = z.object({
  // Primary identifiers
  id: z.string().uuid(),
  displayId: z.string().regex(DisplayIdPattern.VALID),
  
  // Entity linkage
  entityId: z.string().uuid(),
  entityCode: z.string().min(1),
  
  // Source information
  source: z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    type: SourceTypeSchema,
    url: z.string().url().optional(),
    date: z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/).optional(),
    reference: z.string().optional()
  }),
  
  // Content
  fact: z.string().min(1),
  citation: z.string().min(1),
  
  // Quality metadata
  quality: z.object({
    dateAccessed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
    timeSensitive: z.boolean().default(false),
    isDerived: z.boolean().default(false),
    confidenceLevel: z.enum(['high', 'medium', 'low']).default('high'),
    verificationStatus: z.enum(['verified', 'sampled', 'unverified']).default('unverified')
  }),
  
  // Cross-references
  relatedReferences: z.array(z.string().regex(DisplayIdPattern.VALID)).default([]),
  
  // Usage tracking
  usage: z.object({
    metricTypes: z.array(z.string()).default([]),
    observationTypes: z.array(z.string()).default([]),
    riskCategories: z.array(z.string()).default([])
  }).default({ metricTypes: [], observationTypes: [], riskCategories: [] })
});

// ============================================================================
// Citation Link
// ============================================================================

export const CitationLinkSchema = z.object({
  displayId: z.string().regex(DisplayIdPattern.VALID),
  internalId: z.string().uuid(),
  
  // Link metadata
  linkType: z.enum([
    'primary',        // Direct citation
    'derived',        // Calculated from this reference
    'supporting',     // Additional support
    'contrast'        // Contrasting view
  ]),
  
  // Context
  linkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  linkedBy: z.string().min(1),
  context: z.string().min(1)
});

// ============================================================================
// Reference Registry
// ============================================================================

export interface ReferenceRegistry {
  metadata: {
    totalReferences: number;
    dateCreated: string;
    version: string;
    entities: string[];
  };
  
  sources: Record<string, {
    name: string;
    type: z.infer<typeof SourceTypeSchema>;
    url?: string;
  }>;
  
  references: Record<string, z.infer<typeof ReferenceExtendedSchema>>;
  
  index: {
    bySource: Record<string, string[]>;
    byEntity: Record<string, string[]>;
    byMetricType: Record<string, string[]>;
    timeSensitive: string[];
  };
}

// ============================================================================
// Citation Coverage
// ============================================================================

export interface CitationCoverage {
  totalFacts: number;
  totalCitations: number;
  orphanReferences: string[];
  coverageByCategory: Record<string, {
    total: number;
    cited: number;
    coveragePct: number;
  }>;
  unreferencedMetrics: string[];
  unreferencedObservations: string[];
  unreferencedRiskFactors: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isValidDisplayId(displayId: string): boolean {
  return DisplayIdPattern.VALID.test(displayId);
}

export function parseDisplayId(displayId: string): { prefix: 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'KIP' | 'SE' | 'AF' | 'To'; number: number; suffix?: string } | null {
  if (!isValidDisplayId(displayId)) return null;
  const match = displayId.match(/^([TAPSUICHLKRDHY]):(\d+)([a-z]?)$/) || displayId.match(/^(KIP|SE|AF|To):(\d+)([a-z]?)$/);
  if (!match) return null;
  return {
    prefix: match[1] as 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'KIP' | 'SE' | 'AF' | 'To',
    number: parseInt(match[2], 10),
    suffix: match[3] || undefined
  };
}

export function generateDisplayId(prefix: 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'KIP' | 'SE' | 'AF' | 'To', number: number): string {
  return `${prefix}:${number}`;
}

export function entityCodeFromPrefix(prefix: 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'SE' | 'AF' | 'To'): string {
  const mapping: Record<string, string> = {
    'T': '5130.KL',
    'A': '5106.KL',
    'S': '5176.KL',
    'P': '5212.KL',
    'I': '5227.KL',
    'U': '5110.KL',
    'C': '5180.KL',
    'H': '5121.KL',
    'L': '5269.KL',
    'K': '5235SS',
    'R': '5280.KL',
    'D': '5338.KL',
    'Y': '5109.KL',
    'SE': '5123.KL',
    'AF': '5120.KL',
    'To': '5111.KL'
  };
  return mapping[prefix];
}

export function prefixFromEntityCode(code: string): 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'SE' | 'AF' | 'To' {
  const mapping: Record<string, 'T' | 'A' | 'S' | 'P' | 'I' | 'U' | 'C' | 'H' | 'L' | 'K' | 'R' | 'D' | 'Y' | 'SE' | 'AF' | 'To'> = {
    '5130.KL': 'T',
    '5106.KL': 'A',
    '5176.KL': 'S',
    '5212.KL': 'P',
    '5227.KL': 'I',
    '5110.KL': 'U',
    '5180.KL': 'C',
    '5121.KL': 'H',
    '5269.KL': 'L',
    '5235SS': 'K',
    '5280.KL': 'R',
    '5338.KL': 'D',
    '5109.KL': 'Y',
    '5123.KL': 'SE',
    '5120.KL': 'AF',
    '5111.KL': 'To'
  };
  return mapping[code];
}

// ============================================================================
// Type Exports
// ============================================================================

export type SourceType = z.infer<typeof SourceTypeSchema>;
export type ReferenceExtended = z.infer<typeof ReferenceExtendedSchema>;
export type CitationLink = z.infer<typeof CitationLinkSchema>;
