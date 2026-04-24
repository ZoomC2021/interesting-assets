/**
 * citation-utils - Citation and traceability utilities
 * Helper functions for managing citations, source grouping, and coverage verification
 */

import type { Reference, Metric, NormalizedReitData, RiskFactor } from '@/types/frontend';

// ============================================================================
// Source Grouping Types
// ============================================================================

export type SourceGroupType = 'AR2025' | 'Q42025' | 'KLSE' | 'OTHER';

export interface SourceGroup {
  type: SourceGroupType;
  label: string;
  description: string;
  colorClass: string;
}

export const SOURCE_GROUPS: Record<SourceGroupType, SourceGroup> = {
  AR2025: {
    type: 'AR2025',
    label: 'Annual Report 2025',
    description: 'Full year audited financial statements',
    colorClass: 'bg-blue-100 text-blue-700',
  },
  Q42025: {
    type: 'Q42025',
    label: 'Q4 2025 Report',
    description: 'Fourth quarter unaudited results',
    colorClass: 'bg-teal-100 text-teal-700',
  },
  KLSE: {
    type: 'KLSE',
    label: 'Bursa Malaysia',
    description: 'Stock exchange announcements',
    colorClass: 'bg-purple-100 text-purple-700',
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Sources',
    description: 'Additional verified sources',
    colorClass: 'bg-neutral-100 text-neutral-700',
  },
};

// ============================================================================
// Source Classification
// ============================================================================

/**
 * Determine the source group type based on reference source and citation
 */
export function getSourceGroupType(reference: Reference): SourceGroupType {
  const source = reference.source.toLowerCase();
  const citation = reference.citation.toLowerCase();
  
  // Check for Annual Report 2025
  if (source.includes('annual report') || citation.includes('ar2025') || citation.includes('annual report 2025')) {
    return 'AR2025';
  }
  
  // Check for Q4 2025
  if (citation.includes('q4') || citation.includes('quarter 4') || citation.includes('q4-2025')) {
    return 'Q42025';
  }
  
  // Check for Bursa Malaysia / KLSE
  if (source.includes('bursa') || source.includes('klse') || source.includes('stock exchange')) {
    return 'KLSE';
  }
  
  return 'OTHER';
}

/**
 * Group references by source type
 */
export function groupReferencesBySource(references: Reference[]): Map<SourceGroupType, Reference[]> {
  const groups = new Map<SourceGroupType, Reference[]>();
  
  // Initialize groups
  (Object.keys(SOURCE_GROUPS) as SourceGroupType[]).forEach(type => {
    groups.set(type, []);
  });
  
  // Distribute references
  references.forEach(ref => {
    const type = getSourceGroupType(ref);
    const group = groups.get(type) || [];
    group.push(ref);
    groups.set(type, group);
  });
  
  return groups;
}

// ============================================================================
// Citation Counting
// ============================================================================

/**
 * Get citation count for a single metric
 */
export function getMetricCitationCount(metric: Metric): number {
  return metric.sourceDisplayIds?.length || 0;
}

/**
 * Get aggregated citation count for an entity
 */
export function getEntityCitationCount(entity: NormalizedReitData): number {
  // Count unique citations across all metrics
  const uniqueCitations = new Set<string>();
  
  entity.metrics.forEach(metric => {
    metric.sourceDisplayIds?.forEach(id => uniqueCitations.add(id));
  });
  
  entity.riskAssessment.riskFactors.forEach(factor => {
    factor.sourceDisplayIds?.forEach(id => uniqueCitations.add(id));
  });
  
  entity.observations.forEach(obs => {
    obs.sourceDisplayIds?.forEach(id => uniqueCitations.add(id));
  });
  
  return uniqueCitations.size;
}

/**
 * Get citation count for a specific risk factor
 */
export function getRiskFactorCitationCount(factor: RiskFactor): number {
  return factor.sourceDisplayIds?.length || 0;
}

/**
 * Get total citation count across all entities
 */
export function getTotalCitationCount(entities: NormalizedReitData[]): number {
  const uniqueCitations = new Set<string>();
  
  entities.forEach(entity => {
    entity.references.forEach(ref => uniqueCitations.add(ref.id));
  });
  
  return uniqueCitations.size;
}

// ============================================================================
// Citation Coverage Analysis
// ============================================================================

export interface CoverageStats {
  totalMetrics: number;
  citedMetrics: number;
  coveragePercentage: number;
  uncitedMetrics: string[];
  orphanCitations: string[];
}

/**
 * Analyze citation coverage for entities
 */
export function analyzeCitationCoverage(entities: NormalizedReitData[]): CoverageStats {
  let totalMetrics = 0;
  let citedMetrics = 0;
  const uncitedMetrics: string[] = [];
  
  // Collect all available reference IDs
  const availableReferenceIds = new Set<string>();
  entities.forEach(entity => {
    entity.references.forEach(ref => {
      availableReferenceIds.add(ref.id);
      availableReferenceIds.add(ref.displayId);
    });
  });
  
  // Check metrics
  entities.forEach(entity => {
    entity.metrics.forEach(metric => {
      totalMetrics++;
      const hasValidCitation = metric.sourceDisplayIds?.some(
        id => availableReferenceIds.has(id)
      );
      
      if (hasValidCitation) {
        citedMetrics++;
      } else {
        uncitedMetrics.push(`${entity.entity.code}:${metric.metricType}`);
      }
    });
  });
  
  // Find orphan citations (referenced but not in sources)
  const orphanCitations: string[] = [];
  entities.forEach(entity => {
    entity.metrics.forEach(metric => {
      metric.sourceDisplayIds?.forEach(id => {
        if (!availableReferenceIds.has(id)) {
          orphanCitations.push(`${entity.entity.code}:${metric.metricType}:${id}`);
        }
      });
    });
  });
  
  return {
    totalMetrics,
    citedMetrics,
    coveragePercentage: totalMetrics > 0 ? (citedMetrics / totalMetrics) * 100 : 0,
    uncitedMetrics,
    orphanCitations,
  };
}

/**
 * Check if coverage meets requirements (100% coverage expected)
 */
export function verifyCitationCoverage(entities: NormalizedReitData[]): {
  passed: boolean;
  stats: CoverageStats;
  errors: string[];
} {
  const stats = analyzeCitationCoverage(entities);
  const errors: string[] = [];
  
  if (stats.coveragePercentage < 100) {
    errors.push(
      `Citation coverage is ${stats.coveragePercentage.toFixed(1)}%, expected 100%`
    );
    if (stats.uncitedMetrics.length > 0) {
      errors.push(`Uncited metrics: ${stats.uncitedMetrics.join(', ')}`);
    }
  }
  
  if (stats.orphanCitations.length > 0) {
    errors.push(`Orphan citations found: ${stats.orphanCitations.join(', ')}`);
  }
  
  return {
    passed: errors.length === 0,
    stats,
    errors,
  };
}

// ============================================================================
// Visual Indicators
// ============================================================================

export interface DataQualityIndicators {
  isTimeSensitive: boolean;
  isEstimated: boolean;
  citationCount: number;
}

/**
 * Get visual indicator config for a metric
 */
export function getDataQualityIndicators(metric: Metric): DataQualityIndicators {
  return {
    isTimeSensitive: metric.isTimeSensitive || false,
    isEstimated: metric.isEstimated || false,
    citationCount: metric.sourceDisplayIds?.length || 0,
  };
}

/**
 * Get badge color class based on source group
 */
export function getSourceGroupColorClass(groupType: SourceGroupType): string {
  return SOURCE_GROUPS[groupType].colorClass;
}

// ============================================================================
// Copy to Clipboard
// ============================================================================

/**
 * Copy citation to clipboard
 */
export async function copyCitationToClipboard(reference: Reference): Promise<boolean> {
  try {
    const text = `${reference.displayId}: ${reference.fact} (${reference.source}) - ${reference.citation}`;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy citation:', err);
    return false;
  }
}

/**
 * Copy multiple citations to clipboard
 */
export async function copyCitationsToClipboard(references: Reference[]): Promise<boolean> {
  try {
    const text = references
      .map(ref => `${ref.displayId}: ${ref.fact} (${ref.source}) - ${ref.citation}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy citations:', err);
    return false;
  }
}

// ============================================================================
// Citation Preview
// ============================================================================

export interface CitationPreview {
  displayId: string;
  fact: string;
  source: string;
  sourceGroup: SourceGroupType;
  isTimeSensitive: boolean;
  dateAccessed: string;
}

/**
 * Get preview data for a citation
 */
export function getCitationPreview(reference: Reference): CitationPreview {
  return {
    displayId: reference.displayId,
    fact: reference.fact,
    source: reference.source,
    sourceGroup: getSourceGroupType(reference),
    isTimeSensitive: reference.timeSensitive,
    dateAccessed: reference.dateAccessed,
  };
}
