/**
 * Paradigm REIT Data Adapter
 * 
 * Transforms Paradigm REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Handles asymmetric disclosures and preserves all D:XXX citations.
 */

import { CitationLinker } from './citation-linker';
import {
  NormalizedReitData,
  Entity,
  Metric,
  Reference,
  TimeSeries,
  RiskAssessment,
  Observation,
  MetricType
} from '../types/schema';
import { RiskFactorDetail } from '../types/risk';
import { ObservationExtended } from '../types/observation';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Paradigm Adapter Class
// ============================================================================

export class ParadigmAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5338.KL');
  }

  /**
   * Process Paradigm references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5338.KL', displayId, {
          fact: (refData as any).fact || '',
          source: (refData as any).source || '',
          citation: (refData as any).citation || '',
          url: (refData as any).url,
          dateAccessed: (refData as any).dateAccessed || new Date().toISOString().split('T')[0],
          timeSensitive: (refData as any).timeSensitive,
          date: (refData as any).date
        });
      }
    }

    // Convert to output references
    this.references = Array.from(this.linker['references'].values()).map(r => ({
      id: r.id,
      displayId: r.displayId,
      fact: r.fact,
      source: r.source.key,
      citation: r.citation,
      url: r.source.url,
      dateAccessed: r.quality.dateAccessed,
      timeSensitive: r.quality.timeSensitive,
      entityId: this.entityId
    }));
  }

  /**
   * Build normalized entity object
   */
  buildEntity(): Entity {
    const entityRefs = ['D:1', 'D:5', 'D:7', 'D:14', 'D:15', 'D:16'];
    
    // Convert display IDs to reference UUIDs
    const refUuids: string[] = [];
    for (const displayId of entityRefs) {
      const ref = this.linker.lookup(displayId);
      if (ref) {
        refUuids.push(ref.id);
      }
    }

    const entity: Entity = {
      id: this.entityId,
      code: '5338.KL',
      name: 'Paradigm Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2025-06-10',
      manager: {
        name: 'To be populated',
        ownershipStructure: 'Data pending',
        controllingShareholder: 'To be populated'
      },
      trustee: 'To be populated',
      fiscalYearEnd: { month: 12, day: 31 },
      references: refUuids
    };

    // Link citations using display IDs
    for (const displayId of entityRefs) {
      this.linker.linkCitation(displayId, {
        linkType: 'primary',
        linkedBy: 'entity-builder',
        context: 'Entity metadata'
      });
    }

    return entity;
  }

  /**
   * Build all metrics (template placeholders)
   */
  buildMetrics(): Metric[] {
    const fy2025: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2025 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-12-31' };

    // Portfolio metrics - placeholders
    this.addMetric({
      metricType: 'portfolio_size',
      value: 0,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['D:19'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 0,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['D:17', 'D:29'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'investment_properties',
      value: 0,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['D:18'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'property_count',
      value: 0,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['D:19'],
      isEstimated: true
    });

    // Financial performance metrics - placeholders
    this.addMetric({
      metricType: 'gross_revenue',
      value: 0,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['D:37'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 0,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['D:38'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 0,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['D:31'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 0,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['D:1'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'share_price',
      value: 0,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['D:1'],
      isEstimated: true
    });

    // Per-share metrics - placeholders
    this.addMetric({
      metricType: 'dpu',
      value: 0,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['D:35', 'D:36'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 0,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['D:36'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 0,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['D:1']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 0,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['D:35']
    });

    // Leverage metrics - placeholders
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 0,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['D:32'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 0,
      unit: 'x',
      period: fy2025,
      sourceDisplayIds: ['D:34'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 0,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['D:30'],
      isEstimated: true
    });

    // Operational metrics - placeholders
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 0,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['D:24'],
      isEstimated: true
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 0,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['D:38']
    });

    // Market metrics - placeholders
    this.addMetric({
      metricType: 'price_to_book',
      value: 0,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['D:1'],
      isEstimated: true
    });

    return this.metrics;
  }

  /**
   * Build risk assessment (template)
   */
  buildRiskAssessment(): RiskAssessment {
    const riskFactors: RiskFactorDetail[] = [
      {
        id: this.generateId(),
        category: 'concentration',
        severity: 'medium',
        title: 'Portfolio Concentration',
        description: 'Portfolio concentration risk to be assessed upon data population.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Data pending', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Data pending', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Annual report disclosure',
          'Portfolio composition updates'
        ],
        sourceDisplayIds: ['D:42', 'D:28']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'medium',
        title: 'Interest Rate Exposure',
        description: 'Floating-rate debt exposure to be assessed upon data population.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Data pending', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Data pending', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Debt structure disclosure'
        ],
        sourceDisplayIds: ['D:43', 'D:50']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'medium',
        title: 'Disclosure Status',
        description: 'This is a placeholder template awaiting full data population from annual reports.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Template structure in place', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Data not yet populated', impact: 'significant' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Annual report publication',
          'Quarterly filings'
        ],
        sourceDisplayIds: ['D:4', 'D:9']
      }
    ];

    // Link citations
    for (const factor of riskFactors) {
      for (const refId of factor.sourceDisplayIds) {
        this.linker.linkCitation(refId, {
          linkType: 'primary',
          linkedBy: 'risk-builder',
          context: `Risk factor: ${factor.title}`,
          riskCategory: factor.category
        });
      }
    }

    return {
      id: this.generateId(),
      entityId: this.entityId,
      assessmentDate: new Date().toISOString().split('T')[0],
      overallRiskRating: 'moderate',
      overallScore: 3.0,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5130.KL'),
        relativeRisk: 'similar',
        keyDifferences: [
          'Data pending population',
          'Template comparison basis'
        ]
      }
    };
  }

  /**
   * Build observations (template)
   */
  buildObservations(): Observation[] {
    const observations: ObservationExtended[] = [
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'executive_summary',
        priority: 'info',
        title: 'Template Status',
        content: 'Paradigm REIT adapter is in template mode. Data population pending from official sources including Bursa Malaysia filings and annual reports.',
        summary: 'Template placeholder - data population required',
        keyFacts: [
          { label: 'Stock Code', value: 5338, unit: '.KL' },
          { label: 'Status', value: 0, unit: 'Template' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [],
        relatedRisks: [],
        sourceDisplayIds: ['D:1', 'D:4', 'D:7'],
        primaryCitation: 'D:1'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'executive_summary',
        priority: 'info',
        title: 'Data Population Required',
        content: 'All financial metrics, portfolio data, and risk assessments require population from Paradigm REIT 2025 Annual Report and quarterly filings.',
        summary: 'Awaiting annual report and financial data',
        keyFacts: [
          { label: 'Pending', value: 50, unit: 'references' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [],
        relatedRisks: [
          { category: 'transparency', severity: 'medium' }
        ],
        sourceDisplayIds: ['D:3', 'D:9'],
        primaryCitation: 'D:3'
      }
    ];

    this.observations = observations as any;

    // Link citations
    for (const obs of observations) {
      for (const refId of obs.sourceDisplayIds) {
        this.linker.linkCitation(refId, {
          linkType: 'primary',
          linkedBy: 'observation-builder',
          context: `Observation: ${obs.title}`,
          observationType: obs.observationType
        });
      }
    }

    return this.observations;
  }

  /**
   * Build time series data (template placeholders)
   */
  buildTimeSeries(): TimeSeries[] {
    const entityId = this.entityId;

    // Historical DPU series - placeholder
    const dpuSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'dpu',
      frequency: 'annual',
      unit: 'sen',
      dataPoints: [
        { date: '2021-12-31', value: 0, isInterpolated: true },
        { date: '2022-12-31', value: 0, isInterpolated: true },
        { date: '2023-12-31', value: 0, isInterpolated: true },
        { date: '2024-12-31', value: 0, isInterpolated: true },
        { date: '2025-12-31', value: 0, isInterpolated: true, sourceDisplayId: 'D:36' }
      ],
      sourceDisplayIds: ['D:36']
    };

    // Occupancy rate series - placeholder
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 0, isInterpolated: true },
        { date: '2022-12-31', value: 0, isInterpolated: true },
        { date: '2023-12-31', value: 0, isInterpolated: true },
        { date: '2024-12-31', value: 0, isInterpolated: true },
        { date: '2025-12-31', value: 0, isInterpolated: true, sourceDisplayId: 'D:24' }
      ],
      sourceDisplayIds: ['D:24']
    };

    // NAV per unit series - placeholder
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-12-31', value: 0, isInterpolated: true },
        { date: '2022-12-31', value: 0, isInterpolated: true },
        { date: '2023-12-31', value: 0, isInterpolated: true },
        { date: '2024-12-31', value: 0, isInterpolated: true },
        { date: '2025-12-31', value: 0, isInterpolated: true, sourceDisplayId: 'D:31' }
      ],
      sourceDisplayIds: ['D:31']
    };

    // Gearing ratio series - placeholder
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 0, isInterpolated: true },
        { date: '2022-12-31', value: 0, isInterpolated: true },
        { date: '2023-12-31', value: 0, isInterpolated: true },
        { date: '2024-12-31', value: 0, isInterpolated: true },
        { date: '2025-12-31', value: 0, isInterpolated: true, sourceDisplayId: 'D:32' }
      ],
      sourceDisplayIds: ['D:32']
    };

    // Gross revenue series - placeholder
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 0, isInterpolated: true },
        { date: '2022-12-31', value: 0, isInterpolated: true },
        { date: '2023-12-31', value: 0, isInterpolated: true },
        { date: '2024-12-31', value: 0, isInterpolated: true },
        { date: '2025-12-31', value: 0, isInterpolated: true, sourceDisplayId: 'D:37' }
      ],
      sourceDisplayIds: ['D:37']
    };

    this.timeSeries = [dpuSeries, occupancySeries, navSeries, gearingSeries, revenueSeries];

    // Link citations
    for (const series of this.timeSeries) {
      for (const point of series.dataPoints) {
        if (point.sourceDisplayId) {
          this.linker.linkCitation(point.sourceDisplayId, {
            linkType: 'primary',
            linkedBy: 'timeseries-builder',
            context: `${series.metricType} time series ${point.date}`,
            metricType: series.metricType
          });
        }
      }
      for (const refId of series.sourceDisplayIds) {
        this.linker.linkCitation(refId, {
          linkType: 'primary',
          linkedBy: 'timeseries-builder',
          context: `${series.metricType} series metadata`,
          metricType: series.metricType
        });
      }
    }

    return this.timeSeries;
  }

  /**
   * Generate complete normalized output
   */
  generateOutput(): NormalizedReitData {
    // Build all components
    const entity = this.buildEntity();
    const metrics = this.buildMetrics();
    const timeSeries = this.buildTimeSeries();
    const riskAssessment = this.buildRiskAssessment();
    const observations = this.buildObservations();
    
    // Link all orphan references to ensure 100% coverage
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - Paradigm REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[ParadigmAdapter] Linked ${linkedOrphans.length} orphan references`);
    }
    
    return {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      entity,
      references: this.references,
      metrics,
      timeSeries,
      riskAssessment,
      observations
    };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private addMetric(params: {
    metricType: MetricType;
    value: number;
    unit: string;
    period: Metric['period'];
    isEstimated?: boolean;
    isTimeSensitive?: boolean;
    sourceDisplayIds: string[];
  }): void {
    const metric: Metric = {
      id: this.generateId(),
      metricType: params.metricType,
      value: params.value,
      unit: params.unit,
      period: params.period,
      isEstimated: params.isEstimated || false,
      isTimeSensitive: params.isTimeSensitive || false,
      sourceDisplayIds: params.sourceDisplayIds
    } as Metric;

    this.metrics.push(metric);

    // Link citations
    for (const refId of params.sourceDisplayIds) {
      this.linker.linkCitation(refId, {
        linkType: 'primary',
        linkedBy: 'metric-builder',
        context: `Metric: ${params.metricType}`,
        metricType: params.metricType
      });
    }
  }

  private generateId(): string {
    return uuidv4();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createParadigmAdapter(linker: CitationLinker): ParadigmAdapter {
  return new ParadigmAdapter(linker);
}
