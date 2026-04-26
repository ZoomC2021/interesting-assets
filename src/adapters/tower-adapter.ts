/**
 * Tower REIT Data Adapter
 * 
 * Transforms Tower REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Handles asymmetric disclosures and preserves all To:XXX citations.
 * 
 * Canonical Code: 5111.KL
 * Sector: Commercial
 * Prefix: To
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
// Tower Adapter Class
// ============================================================================

export class TowerAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5111.KL');
  }

  /**
   * Process Tower references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5111.KL', displayId, {
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
    const entityRefs = ['To:1', 'To:5', 'To:20', 'To:21', 'To:22', 'To:23', 'To:26', 'To:32', 'To:33'];
    
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
      code: '5111.KL',
      name: 'Tower Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Commercial',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2006-04-12',
      manager: {
        name: 'GLM REIT Management Sdn Bhd',
        ownershipStructure: 'Wholly-owned subsidiary of GuocoLand (Malaysia) Berhad',
        controllingShareholder: 'Hong Leong Group (ultimate parent)'
      },
      trustee: 'MTrustee Berhad',
      fiscalYearEnd: { month: 6, day: 30 },
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
   * Build all metrics
   */
  buildMetrics(): Metric[] {
    const fy2024: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2024 };
    const fy2023: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2023 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2024-06-30' };
    const currentPoint: Metric['period'] = { type: 'point_in_time', date: '2026-04-26' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 3,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['To:8', 'To:28']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 3,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['To:8', 'To:28']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 966613,
      unit: 'sq. ft.',
      period: q4Point,
      sourceDisplayIds: ['To:29']
    });

    this.addMetric({
      metricType: 'investment_properties',
      value: 806,
      unit: 'RM million',
      period: currentPoint,
      isTimeSensitive: true,
      sourceDisplayIds: ['To:9', 'To:27', 'To:75']
    });

    // Financial performance metrics - FY2024
    this.addMetric({
      metricType: 'gross_revenue',
      value: 37.04,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['To:17', 'To:92']
    });

    this.addMetric({
      metricType: 'gross_revenue',
      value: 33.87,
      unit: 'RM million',
      period: fy2023,
      sourceDisplayIds: ['To:93']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 20.08,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['To:18', 'To:94']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 16.62,
      unit: 'RM million',
      period: fy2023,
      sourceDisplayIds: ['To:95']
    });

    this.addMetric({
      metricType: 'realised_income',
      value: 3.20,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['To:96']
    });

    this.addMetric({
      metricType: 'net_profit',
      value: 5.73,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['To:98', 'To:100']
    });

    // NAV metrics
    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.16,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['To:16', 'To:106', 'To:108']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 570.08,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['To:105']
    });

    // Market metrics (time-sensitive)
    this.addMetric({
      metricType: 'share_price',
      value: 0.30,
      unit: 'RM',
      period: currentPoint,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['To:91', 'To:109', 'To:115']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 147,
      unit: 'RM million',
      period: currentPoint,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['To:116']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 1.0,
      unit: 'sen',
      period: fy2024,
      isEstimated: true,
      sourceDisplayIds: ['To:14', 'To:15']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 3.33,
      unit: '%',
      period: currentPoint,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['To:117']
    });

    this.addMetric({
      metricType: 'price_to_book',
      value: 0.26,
      unit: 'x',
      period: currentPoint,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['To:118']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 40.6,
      unit: '%',
      period: currentPoint,
      isEstimated: true,
      isTimeSensitive: true,
      sourceDisplayIds: ['To:11', 'To:78']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 1.7,
      unit: 'x',
      period: currentPoint,
      isEstimated: true,
      isTimeSensitive: true,
      sourceDisplayIds: ['To:13', 'To:82']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 97,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['To:10', 'To:56', 'To:70']
    });

    // Note: WALE NOT DISCLOSED - skip (asymmetric)
    // Note: tenant_count NOT DISCLOSED - skip (asymmetric)
    // Note: top_tenant_concentration NOT DISCLOSED - skip (asymmetric)

    this.addMetric({
      metricType: 'npi_margin',
      value: 54.2,
      unit: '%',
      period: fy2024,
      isEstimated: true,
      sourceDisplayIds: ['To:17', 'To:18', 'To:103']
    });

    return this.metrics;
  }

  /**
   * Build risk assessment
   */
  buildRiskAssessment(): RiskAssessment {
    const riskFactors: RiskFactorDetail[] = [
      {
        id: this.generateId(),
        category: 'concentration',
        severity: 'high',
        title: 'Portfolio Concentration',
        description: 'Only 3 properties with 100% geographic concentration in Kuala Lumpur. Limited diversification across locations.',
        currentScore: 4,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Properties in prime KL districts (Damansara Heights, KLCC)', impact: 'significant' },
          { factor: 'Premium Grade A office assets', impact: 'moderate' },
          { factor: 'Strong occupancy at ~97%', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Only 3 properties in portfolio', impact: 'significant' },
          { factor: 'All assets in single city (Kuala Lumpur)', impact: 'significant' },
          { factor: 'Tenant concentration not disclosed', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Occupancy trends at Menara HLX and Plaza Zurich',
          'New property acquisition announcements',
          'Geographic diversification strategy updates'
        ],
        sourceDisplayIds: ['To:8', 'To:30', 'To:72', 'To:112']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'high',
        title: 'Interest Rate Sensitivity',
        description: 'Limited interest coverage at ~1.7x provides minimal buffer against rate increases. Floating rate debt exposure creates vulnerability to BNM OPR changes.',
        currentScore: 4,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'interest_coverage', value: 1.7, context: 'Thin coverage margin' }
        ],
        mitigatingFactors: [
          { factor: 'Gearing at ~40.6% provides some headroom below 50% limit', impact: 'moderate' },
          { factor: 'Improved FY2024 profitability', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Coverage ratio only ~1.7x, limited cushion', impact: 'significant' },
          { factor: 'Debt maturity profile not disclosed', impact: 'moderate' },
          { factor: 'Fixed/floating rate split not disclosed', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Interest coverage quarterly updates',
          'Refinancing announcements'
        ],
        sourceDisplayIds: ['To:11', 'To:13', 'To:82', 'To:110']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'medium',
        title: 'Disclosure Gaps',
        description: 'WALE, tenant count, top tenant concentration, debt maturity profile, and fixed/floating debt split not publicly disclosed.',
        currentScore: 3,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'High occupancy reduces immediate rollover concern', impact: 'moderate' },
          { factor: 'Annual report provides basic financial data', impact: 'minor' }
        ],
        aggravatingFactors: [
          { factor: 'No WALE disclosure vs industry standard', impact: 'moderate' },
          { factor: 'Debt maturity profile not disclosed', impact: 'moderate' },
          { factor: 'Tenant quality metrics not available', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Annual report disclosure improvements',
          'Investor presentation details',
          'Debt maturity profile publication'
        ],
        sourceDisplayIds: ['To:74', 'To:81', 'To:113', 'To:114']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'low',
        title: 'Lease Rollover Risk',
        description: '~97% occupancy with stable tenant base. Menara Guoco achieved highest occupancy in five years.',
        currentScore: 2,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: '~97% current occupancy', impact: 'significant' },
          { factor: 'Menara Guoco at ~97%, highest in five years', impact: 'significant' },
          { factor: 'Menara HLX refurbishment benefits realized', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'WALE and lease expiry schedule not disclosed', impact: 'minor' },
          { factor: 'KL office market oversupply headwinds', impact: 'moderate' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Lease expiry schedule disclosure',
          'Occupancy quarterly trends',
          'Rental reversion rates'
        ],
        sourceDisplayIds: ['To:10', 'To:55', 'To:56', 'To:57']
      },
      {
        id: this.generateId(),
        category: 'geographic',
        severity: 'medium',
        title: 'KL Office Market Headwinds',
        description: 'Kuala Lumpur office market faces oversupply challenges and evolving workplace trends post-pandemic.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Premium Grade A assets in prime locations', impact: 'significant' },
          { factor: 'Asset enhancement initiatives completed', impact: 'moderate' },
          { factor: 'MRT proximity for Plaza Zurich', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'KL office market oversupply', impact: 'significant' },
          { factor: 'Hybrid work reducing office demand', impact: 'moderate' },
          { factor: 'Three-property concentration in single market', impact: 'significant' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'KL office market vacancy rates',
          'Rental rate trends in prime districts',
          'Workplace policy evolution'
        ],
        sourceDisplayIds: ['To:111', 'To:112']
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
      overallRiskRating: 'moderate_high',
      overallScore: 3.2,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5130.KL'),
        relativeRisk: 'higher',
        keyDifferences: [
          'Smaller portfolio (3 vs 9 properties)',
          'Lower interest coverage (~1.7x vs 2.09x)',
          'No WALE disclosure vs full disclosure',
          'KL concentration vs diversified locations'
        ]
      }
    };
  }

  /**
   * Build observations
   */
  buildObservations(): Observation[] {
    const observations: ObservationExtended[] = [
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'executive_summary',
        priority: 'positive',
        title: 'FY2024 Turnaround Achieved',
        content: 'Tower REIT achieved a significant turnaround in FY2024, recording total comprehensive income of RM 5.73 million compared to a loss of RM 17.60 million in FY2023. This was driven by improved occupancy across all three properties to the highest levels in five years.',
        summary: 'FY2024 profit RM 5.73m vs FY2023 loss RM 17.6m, occupancy at 5-year highs',
        keyFacts: [
          { label: 'FY2024 Income', value: 5.73, unit: 'RM million' },
          { label: 'Occupancy', value: 97, unit: '%' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'net_profit', value: 5.73 },
          { metricType: 'occupancy_rate', value: 97 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['To:19', 'To:100', 'To:10', 'To:102'],
        primaryCitation: 'To:19'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'warning',
        title: 'Interest Coverage Concern',
        content: 'Interest coverage estimated at ~1.7x provides limited buffer for interest rate increases. While gearing at ~40.6% is below the 50% regulatory limit, the thin coverage margin requires monitoring in a rising rate environment.',
        summary: '~1.7x interest coverage, limited buffer for rate increases',
        keyFacts: [
          { label: 'Interest Coverage', value: 1.7, unit: 'x' },
          { label: 'Gearing', value: 40.6, unit: '%' }
        ],
        indicator: { icon: 'warning', color: 'orange' },
        relatedMetrics: [
          { metricType: 'interest_coverage', value: 1.7 },
          { metricType: 'gearing_ratio', value: 40.6 }
        ],
        relatedRisks: [
          { category: 'interest_rate', severity: 'high' }
        ],
        sourceDisplayIds: ['To:13', 'To:11', 'To:82', 'To:110'],
        primaryCitation: 'To:13'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'info',
        title: 'Disclosure Limitations',
        content: 'Multiple disclosure gaps exist including WALE, tenant concentration, debt maturity profile, and fixed/floating rate split. This limits full assessment of underlying risk factors.',
        summary: 'WALE, tenant mix, debt profile not disclosed',
        keyFacts: [
          { label: 'WALE', value: 'n/a' },
          { label: 'Top Tenant', value: 'Not disclosed' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [],
        relatedRisks: [
          { category: 'transparency', severity: 'medium' }
        ],
        sourceDisplayIds: ['To:74', 'To:81', 'To:113', 'To:114'],
        primaryCitation: 'To:74'
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
   * Build time series data
   */
  buildTimeSeries(): TimeSeries[] {
    const entityId = this.entityId;

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2023-06-30', value: 33.87, isInterpolated: false, sourceDisplayId: 'To:93' },
        { date: '2024-06-30', value: 37.04, isInterpolated: false, sourceDisplayId: 'To:92' }
      ],
      sourceDisplayIds: ['To:92', 'To:93', 'To:17']
    };

    // NPI series
    const npiSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'net_property_income',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2023-06-30', value: 16.62, isInterpolated: false, sourceDisplayId: 'To:95' },
        { date: '2024-06-30', value: 20.08, isInterpolated: false, sourceDisplayId: 'To:94' }
      ],
      sourceDisplayIds: ['To:94', 'To:95', 'To:18']
    };

    // Occupancy rate series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2023-06-30', value: 94, isInterpolated: true },
        { date: '2024-06-30', value: 97, isInterpolated: false, sourceDisplayId: 'To:56' }
      ],
      sourceDisplayIds: ['To:56', 'To:10', 'To:70']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2024-06-30', value: 1.16, isInterpolated: false, sourceDisplayId: 'To:16' }
      ],
      sourceDisplayIds: ['To:16', 'To:106', 'To:108']
    };

    // DPU series
    const dpuSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'dpu',
      frequency: 'annual',
      unit: 'sen',
      dataPoints: [
        { date: '2024-06-30', value: 1.0, isInterpolated: false, sourceDisplayId: 'To:15' }
      ],
      sourceDisplayIds: ['To:14', 'To:15']
    };

    this.timeSeries = [revenueSeries, npiSeries, occupancySeries, navSeries, dpuSeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - Tower REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[TowerAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createTowerAdapter(linker: CitationLinker): TowerAdapter {
  return new TowerAdapter(linker);
}
