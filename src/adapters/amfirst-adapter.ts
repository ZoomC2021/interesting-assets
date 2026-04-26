/**
 * AmFIRST REIT Data Adapter
 *
 * Transforms AmFIRST REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 *
 * Handles commercial property sector characteristics and
 * preserves all AF:XXX citations.
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
// AmFIRST Adapter Class
// ============================================================================

export class AmFIRSTAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5120.KL');
  }

  /**
   * Process AmFIRST references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};

    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5120.KL', displayId, {
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
    const entityRefs = ['AF:1', 'AF:5', 'AF:18', 'AF:19', 'AF:20', 'AF:28'];

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
      code: '5120.KL',
      name: 'AmFIRST Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2006-12-21',
      manager: {
        name: 'AmREIT Managers Sdn Bhd',
        ownershipStructure: 'External professional manager (AmBank Group affiliated)',
        controllingShareholder: 'AmBank Group ecosystem'
      },
      trustee: 'Maybank Trustees Berhad',
      fiscalYearEnd: { month: 3, day: 31 },
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
    const fy2026: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2026 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2026-03-31' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 8,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['AF:8', 'AF:24']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 8,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['AF:8', 'AF:24']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 3000000,
      unit: 'sq ft',
      period: q4Point,
      sourceDisplayIds: ['AF:9', 'AF:25']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 75,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['AF:67', 'AF:72']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 110.3,
      unit: 'RM million',
      period: fy2026,
      sourceDisplayIds: ['AF:15', 'AF:104', 'AF:105']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 64.1,
      unit: 'RM million',
      period: fy2026,
      sourceDisplayIds: ['AF:16', 'AF:106', 'AF:107']
    });

    this.addMetric({
      metricType: 'profit_after_tax',
      value: 30.4,
      unit: 'RM million',
      period: fy2026,
      sourceDisplayIds: ['AF:17', 'AF:108', 'AF:109']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.2178,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['AF:14', 'AF:64', 'AF:97']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 223.1,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['AF:27']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 0.325,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['AF:96']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 2.87,
      unit: 'sen',
      period: fy2026,
      sourceDisplayIds: ['AF:13', 'AF:89', 'AF:94']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 8.83,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['AF:98', 'AF:101', 'AF:126']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 46.6,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['AF:11', 'AF:74', 'AF:77']
    });

    this.addMetric({
      metricType: 'wacd',
      value: 4.06,
      unit: '%',
      period: fy2026,
      isEstimated: true,
      sourceDisplayIds: ['AF:79', 'AF:81']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 88.7,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['AF:10', 'AF:55', 'AF:56']
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 58.1,
      unit: '%',
      period: fy2026,
      isEstimated: true,
      sourceDisplayIds: ['AF:106']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 0.27,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['AF:99', 'AF:100', 'AF:127', 'AF:137']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: -73,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['AF:99', 'AF:100']
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
        title: 'Related-Party Tenant Concentration',
        description: 'AmBank Group as anchor tenant creates significant related-party exposure. Any restructuring at AmBank could impact tenancy.',
        currentScore: 4,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Long-term lease structures provide income visibility', impact: 'significant' },
          { factor: 'AmBank is systemically important bank with government support', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: 'AmBank Group occupies significant space in flagship assets', impact: 'significant' },
          { factor: 'Limited tenant diversification in flagship properties', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'AmBank Group credit rating changes',
          'AmBank restructuring announcements',
          'Related-party transaction disclosures'
        ],
        sourceDisplayIds: ['AF:57', 'AF:128', 'AF:134', 'AF:135', 'AF:136', 'AF:146']
      },
      {
        id: this.generateId(),
        category: 'market',
        severity: 'high',
        title: 'Commercial Office Sector Headwinds',
        description: 'Klang Valley office market remains challenging with elevated vacancy rates, putting pressure on rental rates and occupancy.',
        currentScore: 4,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Prime Golden Triangle locations command premium', impact: 'moderate' },
          { factor: 'Retail component provides income diversification', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Klang Valley office vacancy rates elevated', impact: 'significant' },
          { factor: 'Competitive leasing environment', impact: 'significant' },
          { factor: 'Work-from-home trends reducing office demand', impact: 'moderate' }
        ],
        trend: 'deteriorating',
        monitoringTriggers: [
          'Klang Valley office vacancy trends',
          'Rental rate movements',
          'Office demand indicators'
        ],
        sourceDisplayIds: ['AF:117', 'AF:120', 'AF:129', 'AF:147']
      },
      {
        id: this.generateId(),
        category: 'market',
        severity: 'high',
        title: 'Deep Discount Risk',
        description: 'Trading at 0.27x NTA represents either significant value opportunity or value trap depending on portfolio performance.',
        currentScore: 3.5,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'price_to_book', value: 0.27, context: 'Deep discount to NTA' }
        ],
        mitigatingFactors: [
          { factor: 'High yield provides compensation for risk', impact: 'significant' },
          { factor: 'FY2026 profit growth shows operational momentum', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Market pricing in structural concerns', impact: 'significant' },
          { factor: 'Asset values may be overstated if market declines', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Quarterly revaluation results',
          'Comparable property transactions',
          'NTA trend direction'
        ],
        sourceDisplayIds: ['AF:99', 'AF:100', 'AF:138', 'AF:149', 'AF:151']
      },
      {
        id: this.generateId(),
        category: 'gearing',
        severity: 'medium',
        title: 'Moderate Leverage with Refinishing Exposure',
        description: 'Gearing at 46.6% is manageable but at higher end. 3.3-year WAM provides reasonable refinancing runway.',
        currentScore: 3,
        peerComparison: 'similar',
        quantitativeBacking: [
          { metricType: 'gearing_ratio', value: 46.6, context: 'Moderate leverage' }
        ],
        mitigatingFactors: [
          { factor: 'Below 60% regulatory limit with 13.4pp headroom', impact: 'significant' },
          { factor: 'Strong relationship with AmBank Group for financing', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: 'WAM of 3.3 years requires ongoing refinancing', impact: 'moderate' },
          { factor: 'Exposure to interest rate changes', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Debt maturity profile changes',
          'BNM OPR decisions',
          'Refinancing spreads'
        ],
        sourceDisplayIds: ['AF:74', 'AF:78', 'AF:84', 'AF:131']
      },
      {
        id: this.generateId(),
        category: 'operational',
        severity: 'medium',
        title: 'Sub-Optimal Occupancy',
        description: '88.7% occupancy improved but remains below 90%+ target for commercial REITs, indicating portfolio optimization opportunities.',
        currentScore: 3,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'occupancy_rate', value: 88.7, context: 'Below optimal threshold' }
        ],
        mitigatingFactors: [
          { factor: 'Positive occupancy trend (up from 85%)', impact: 'moderate' },
          { factor: 'Renewal activity supporting stability', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Below 90% threshold for commercial REITs', impact: 'moderate' },
          { factor: 'Challenging leasing environment', impact: 'moderate' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Quarterly occupancy reports',
          'New lease announcements',
          'Tenant retention rates'
        ],
        sourceDisplayIds: ['AF:10', 'AF:55', 'AF:124', 'AF:148']
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
      overallScore: 3.5,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5130.KL'),
        relativeRisk: 'higher',
        keyDifferences: [
          'Commercial office exposure vs industrial focus',
          'Related-party tenant concentration vs diversified',
          '88.7% occupancy vs 100%',
          '46.6% gearing vs 43.5%'
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
        title: 'FY2026 Recovery Momentum',
        content: 'AmFIRST REIT delivered strong FY2026 results with 23.2% profit growth, 5.2% revenue increase, and improved occupancy to 88.7%. The 8.83% yield at 0.27x P/B offers deep value opportunity for high-yield investors.',
        summary: '23.2% profit growth, occupancy improving, high yield at deep discount',
        keyFacts: [
          { label: 'PAT Growth', value: 23.2, unit: '%' },
          { label: 'Occupancy', value: 88.7, unit: '%' },
          { label: 'Yield', value: 8.83, unit: '%' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu', value: 2.87 },
          { metricType: 'occupancy_rate', value: 88.7 },
          { metricType: 'price_to_book', value: 0.27 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['AF:108', 'AF:109', 'AF:55', 'AF:94'],
        primaryCitation: 'AF:109'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'warning',
        title: 'Related-Party Concentration Risk',
        content: 'AmBank Group as anchor tenant in flagship assets creates significant related-party exposure. While providing income stability, any AmBank restructuring could impact REIT performance.',
        summary: 'AmBank anchor tenant creates counterparty concentration',
        keyFacts: [
          { label: 'Related Party', value: 'AmBank Group' },
          { label: 'Risk Level', value: 'High' }
        ],
        indicator: { icon: 'alert', color: 'orange' },
        relatedMetrics: [],
        relatedRisks: [
          { category: 'concentration', severity: 'high' }
        ],
        sourceDisplayIds: ['AF:57', 'AF:128', 'AF:134', 'AF:135'],
        primaryCitation: 'AF:128'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'market_context',
        priority: 'warning',
        title: 'Deep Value or Value Trap?',
        content: 'Trading at 0.27x NTA with 8.83% yield represents either a significant value opportunity or a value trap. The market is pricing in substantial risk. Catalyst needed: sustained occupancy improvement above 90% or portfolio optimization.',
        summary: '0.27x P/B requires catalyst for re-rating',
        keyFacts: [
          { label: 'P/B Ratio', value: 0.27, unit: 'x' },
          { label: 'Discount to NTA', value: 73, unit: '%' },
          { label: 'Dividend Yield', value: 8.83, unit: '%' }
        ],
        indicator: { icon: 'warning', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'price_to_book', value: 0.27 },
          { metricType: 'dividend_yield_market', value: 8.83 }
        ],
        relatedRisks: [
          { category: 'market', severity: 'high' }
        ],
        sourceDisplayIds: ['AF:99', 'AF:100', 'AF:138', 'AF:151'],
        primaryCitation: 'AF:99'
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

    // Historical DPU series
    const dpuSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'dpu',
      frequency: 'annual',
      unit: 'sen',
      dataPoints: [
        { date: '2022-03-31', value: 1.93, isInterpolated: false, sourceDisplayId: 'AF:90' },
        { date: '2023-03-31', value: 1.56, isInterpolated: false, sourceDisplayId: 'AF:91' },
        { date: '2024-03-31', value: 1.18, isInterpolated: false, sourceDisplayId: 'AF:92' },
        { date: '2025-03-31', value: 1.40, isInterpolated: false, sourceDisplayId: 'AF:93' },
        { date: '2026-03-31', value: 2.87, isInterpolated: false, sourceDisplayId: 'AF:94' }
      ],
      sourceDisplayIds: ['AF:90', 'AF:91', 'AF:92', 'AF:93', 'AF:94']
    };

    // Occupancy rate series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2022-03-31', value: 82, isInterpolated: true },
        { date: '2023-03-31', value: 84, isInterpolated: true },
        { date: '2024-03-31', value: 85, isInterpolated: false, sourceDisplayId: 'AF:54' },
        { date: '2025-03-31', value: 85, isInterpolated: false, sourceDisplayId: 'AF:54' },
        { date: '2026-03-31', value: 88.7, isInterpolated: false, sourceDisplayId: 'AF:55' }
      ],
      sourceDisplayIds: ['AF:54', 'AF:55']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2022-03-31', value: 1.18, isInterpolated: false, sourceDisplayId: 'AF:97' },
        { date: '2023-03-31', value: 1.17, isInterpolated: false, sourceDisplayId: 'AF:97' },
        { date: '2024-03-31', value: 1.19, isInterpolated: false, sourceDisplayId: 'AF:97' },
        { date: '2025-03-31', value: 1.20, isInterpolated: false, sourceDisplayId: 'AF:97' },
        { date: '2026-03-31', value: 1.2178, isInterpolated: false, sourceDisplayId: 'AF:64' }
      ],
      sourceDisplayIds: ['AF:64', 'AF:97']
    };

    // Gearing ratio series
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2022-03-31', value: 44.5, isInterpolated: true },
        { date: '2023-03-31', value: 45.0, isInterpolated: true },
        { date: '2024-03-31', value: 46.0, isInterpolated: true },
        { date: '2025-03-31', value: 46.5, isInterpolated: true },
        { date: '2026-03-31', value: 46.6, isInterpolated: false, sourceDisplayId: 'AF:74' }
      ],
      sourceDisplayIds: ['AF:74', 'AF:77']
    };

    // Gross revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2022-03-31', value: 102.5, isInterpolated: true },
        { date: '2023-03-31', value: 103.2, isInterpolated: true },
        { date: '2024-03-31', value: 104.8, isInterpolated: false, sourceDisplayId: 'AF:15' },
        { date: '2025-03-31', value: 104.8, isInterpolated: true },
        { date: '2026-03-31', value: 110.3, isInterpolated: false, sourceDisplayId: 'AF:104' }
      ],
      sourceDisplayIds: ['AF:15', 'AF:104', 'AF:105']
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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - AmFIRST REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[AmFIRSTAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createAmFIRSTAdapter(linker: CitationLinker): AmFIRSTAdapter {
  return new AmFIRSTAdapter(linker);
}
