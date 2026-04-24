/**
 * Citation Linking Logic
 * 
 * Preserves T:XXX/A:XXX display IDs while adding stable internal UUIDs.
 * Provides lookup, validation, and coverage checking functionality.
 */

import { v5 as uuidv5 } from 'uuid';
import {
  ReferenceExtended,
  ReferenceRegistry,
  CitationLink,
  DisplayIdPattern
} from '../types/reference';

// ============================================================================
// Constants
// ============================================================================

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace

// ============================================================================
// Citation Linker Class
// ============================================================================

export class CitationLinker {
  private references: Map<string, ReferenceExtended> = new Map();
  private byDisplayId: Map<string, string> = new Map(); // displayId -> internalId
  private bySource: Map<string, string[]> = new Map();
  private byEntity: Map<string, string[]> = new Map();
  private timeSensitiveRefs: Set<string> = new Set();
  private links: CitationLink[] = [];

  /**
   * Generate stable UUID from display ID
   */
  static generateUuid(entityCode: string, displayId: string): string {
    const name = `${entityCode}:${displayId}`;
    return uuidv5(name, NAMESPACE);
  }

  /**
   * Generate stable entity UUID for a REIT code
   * Used for entity.id and peer references
   */
  static generateEntityUuid(entityCode: string): string {
    const name = `entity:${entityCode}`;
    return uuidv5(name, NAMESPACE);
  }

  /**
   * Register a reference from source JSON
   */
  registerReference(
    entityCode: string,
    displayId: string,
    sourceData: {
      fact: string;
      source: string;
      citation: string;
      url?: string;
      dateAccessed: string;
      timeSensitive?: boolean;
      date?: string;
      reference?: string;
    }
  ): ReferenceExtended {
    if (!DisplayIdPattern.VALID.test(displayId)) {
      throw new Error(`Invalid display ID: ${displayId}`);
    }

    const internalId = CitationLinker.generateUuid(entityCode, displayId);

    const reference: ReferenceExtended = {
      id: internalId,
      displayId,
      entityId: internalId, // Will be replaced with actual entity UUID
      entityCode,
      source: {
        key: sourceData.source,
        name: this.resolveSourceName(sourceData.source),
        type: this.resolveSourceType(sourceData.source),
        url: sourceData.url,
        date: sourceData.date,
        reference: sourceData.reference
      },
      fact: sourceData.fact,
      citation: sourceData.citation,
      quality: {
        dateAccessed: sourceData.dateAccessed,
        timeSensitive: sourceData.timeSensitive || false,
        isDerived: sourceData.source === 'Calculated',
        confidenceLevel: this.deriveConfidenceLevel(sourceData.source),
        verificationStatus: 'unverified'
      },
      relatedReferences: [],
      usage: {
        metricTypes: [],
        observationTypes: [],
        riskCategories: []
      }
    };

    this.references.set(internalId, reference);
    this.byDisplayId.set(displayId, internalId);

    // Index by source
    const existing = this.bySource.get(sourceData.source) || [];
    existing.push(internalId);
    this.bySource.set(sourceData.source, existing);

    // Index by entity
    const entityRefs = this.byEntity.get(entityCode) || [];
    entityRefs.push(internalId);
    this.byEntity.set(entityCode, entityRefs);

    // Track time-sensitive
    if (sourceData.timeSensitive) {
      this.timeSensitiveRefs.add(internalId);
    }

    return reference;
  }

  /**
   * Link a display ID to a fact instance
   */
  linkCitation(
    displayId: string,
    context: {
      linkType: 'primary' | 'derived' | 'supporting' | 'contrast';
      linkedBy: string;
      context: string;
      metricType?: string;
      observationType?: string;
      riskCategory?: string;
    }
  ): CitationLink | null {
    const internalId = this.byDisplayId.get(displayId);
    if (!internalId) {
      return null;
    }

    const link: CitationLink = {
      displayId,
      internalId,
      linkType: context.linkType,
      linkedAt: new Date().toISOString(),
      linkedBy: context.linkedBy,
      context: context.context
    };

    this.links.push(link);

    // Update usage tracking
    const ref = this.references.get(internalId);
    if (ref) {
      if (context.metricType) {
        ref.usage.metricTypes.push(context.metricType);
      }
      if (context.observationType) {
        ref.usage.observationTypes.push(context.observationType);
      }
      if (context.riskCategory) {
        ref.usage.riskCategories.push(context.riskCategory);
      }
    }

    return link;
  }

  /**
   * Look up reference by display ID
   */
  lookup(displayId: string): ReferenceExtended | undefined {
    const internalId = this.byDisplayId.get(displayId);
    if (!internalId) return undefined;
    return this.references.get(internalId);
  }

  /**
   * Look up multiple references by display IDs
   */
  lookupMany(displayIds: string[]): ReferenceExtended[] {
    return displayIds
      .map(id => this.lookup(id))
      .filter((ref): ref is ReferenceExtended => ref !== undefined);
  }

  /**
   * Get all references for an entity
   */
  getEntityReferences(entityCode: string): ReferenceExtended[] {
    const ids = this.byEntity.get(entityCode) || [];
    return ids
      .map(id => this.references.get(id))
      .filter((ref): ref is ReferenceExtended => ref !== undefined);
  }

  /**
   * Check if all display IDs are valid and registered
   */
  validateDisplayIds(displayIds: string[]): {
    valid: string[];
    invalid: string[];
    missing: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const missing: string[] = [];

    for (const id of displayIds) {
      if (!DisplayIdPattern.VALID.test(id)) {
        invalid.push(id);
      } else if (!this.byDisplayId.has(id)) {
        missing.push(id);
      } else {
        valid.push(id);
      }
    }

    return { valid, invalid, missing };
  }

  /**
   * Calculate citation coverage statistics
   */
  calculateCoverage(): any {
    const allRefs = Array.from(this.references.values());
    const linkedRefs = new Set(this.links.map(l => l.internalId));
    
    const orphanReferences = allRefs
      .filter(r => !linkedRefs.has(r.id))
      .map(r => r.displayId);

    // Coverage by category
    const coverageByCategory: Record<string, { total: number; cited: number; coveragePct: number }> = {};
    
    // By source type
    const bySourceType: Record<string, ReferenceExtended[]> = {};
    for (const ref of allRefs) {
      const type = ref.source.type;
      if (!bySourceType[type]) bySourceType[type] = [];
      bySourceType[type].push(ref);
    }
    
    for (const [type, refs] of Object.entries(bySourceType)) {
      const cited = refs.filter(r => linkedRefs.has(r.id)).length;
      coverageByCategory[type] = {
        total: refs.length,
        cited,
        coveragePct: Math.round((cited / refs.length) * 100)
      };
    }

    // Unreferenced usage tracking
    const unreferencedMetrics: string[] = [];
    const unreferencedObservations: string[] = [];
    const unreferencedRiskFactors: string[] = [];

    for (const ref of allRefs) {
      if (!linkedRefs.has(ref.id)) {
        if (ref.usage.metricTypes.length > 0) {
          unreferencedMetrics.push(...ref.usage.metricTypes);
        }
        if (ref.usage.observationTypes.length > 0) {
          unreferencedObservations.push(...ref.usage.observationTypes);
        }
        if (ref.usage.riskCategories.length > 0) {
          unreferencedRiskFactors.push(...ref.usage.riskCategories);
        }
      }
    }

    return {
      totalFacts: this.links.length,
      totalCitations: allRefs.length,
      orphanReferences,
      coverageByCategory,
      unreferencedMetrics: [...new Set(unreferencedMetrics)],
      unreferencedObservations: [...new Set(unreferencedObservations)],
      unreferencedRiskFactors: [...new Set(unreferencedRiskFactors)]
    };
  }

  /**
   * Get all orphan (unlinked) reference display IDs
   */
  getOrphanDisplayIds(): string[] {
    const allRefs = Array.from(this.references.values());
    const linkedRefs = new Set(this.links.map(l => l.internalId));
    
    return allRefs
      .filter(r => !linkedRefs.has(r.id))
      .map(r => r.displayId);
  }

  /**
   * Link all orphan references to a general context
   * This ensures 100% citation coverage
   */
  linkAllOrphans(context: string = 'General reference'): string[] {
    const orphans = this.getOrphanDisplayIds();
    const linked: string[] = [];
    
    for (const displayId of orphans) {
      const result = this.linkCitation(displayId, {
        linkType: 'supporting',
        linkedBy: 'orphan-linker',
        context
      });
      if (result) {
        linked.push(displayId);
      }
    }
    
    return linked;
  }

  /**
   * Generate ReferenceRegistry output
   */
  toRegistry(): ReferenceRegistry {
    const refs: Record<string, ReferenceExtended> = {};
    for (const [id, ref] of this.references) {
      refs[id] = ref;
    }

    const bySource: Record<string, string[]> = {};
    for (const [source, ids] of this.bySource) {
      bySource[source] = ids;
    }

    const byEntity: Record<string, string[]> = {};
    for (const [entity, ids] of this.byEntity) {
      byEntity[entity] = ids;
    }

    const byMetricType: Record<string, string[]> = {};
    const timeSensitive: string[] = Array.from(this.timeSensitiveRefs);

    // Index by metric type from usage tracking
    for (const ref of this.references.values()) {
      for (const metricType of ref.usage.metricTypes) {
        if (!byMetricType[metricType]) byMetricType[metricType] = [];
        byMetricType[metricType].push(ref.id);
      }
    }

    return {
      metadata: {
        totalReferences: this.references.size,
        dateCreated: new Date().toISOString(),
        version: '1.0',
        entities: Array.from(this.byEntity.keys())
      },
      sources: {}, // Populated by consumer
      references: refs,
      index: {
        bySource,
        byEntity,
        byMetricType,
        timeSensitive
      }
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private resolveSourceName(key: string): string {
    const sourceNames: Record<string, string> = {
      'AR2025': '2025 Annual Report',
      'Q42025': 'Q4 2025 Results',
      'KLSE': 'KLSE Screener',
      'Bursa': 'Bursa Malaysia',
      'ChartNexus': 'ChartNexus',
      'TheEdge': 'The Edge Malaysia',
      'ValueInvestAsia': 'Value Invest Asia',
      'Calculated': 'Calculated/Derived',
      'S&P': 'S&P Global Ratings',
      'BNM': 'Bank Negara Malaysia',
      'SCMalaysia': 'Securities Commission Malaysia',
      'Kenanga': 'Kenanga Research',
      'JLL': 'JLL Malaysia',
      'Sukuk2025': 'Sukuk Announcement'
    };
    return sourceNames[key] || key;
  }

  private resolveSourceType(key: string): any {
    if (key.includes('AR')) return 'annual_report';
    if (key.includes('Q4')) return 'quarterly_filing';
    if (key === 'KLSE' || key === 'ChartNexus') return 'market_data';
    if (key === 'Bursa') return 'regulatory_filing';
    if (key === 'Calculated') return 'calculated';
    if (key === 'TheEdge' || key.includes('Research')) return 'news_analysis';
    return 'company_data';
  }

  private deriveConfidenceLevel(source: string): 'high' | 'medium' | 'low' {
    if (source === 'AR2025' || source === 'Q42025') return 'high';
    if (source === 'Calculated') return 'medium';
    if (source === 'TheEdge' || source.includes('Research')) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createCitationLinker(): CitationLinker {
  return new CitationLinker();
}

export function validateCitationCoverage(
  linker: CitationLinker,
  requiredDisplayIds: string[]
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const result = linker.validateDisplayIds(requiredDisplayIds);
  
  if (result.invalid.length > 0) {
    errors.push(`Invalid display IDs: ${result.invalid.join(', ')}`);
  }
  
  if (result.missing.length > 0) {
    errors.push(`Missing references: ${result.missing.join(', ')}`);
  }
  
  const coverage = linker.calculateCoverage();
  if (coverage.orphanReferences.length > 0) {
    errors.push(`Orphan references: ${coverage.orphanReferences.length}`);
  }
  
  return {
    passed: errors.length === 0,
    errors
  };
}
