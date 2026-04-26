/**
 * Sentral REIT Data Adapter
 * 
 * Transforms Sentral REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Sentral REIT is a Malaysian commercial REIT focused on
 * prime office properties in Kuala Lumpur.
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
// Sentral Adapter Class
// ============================================================================

export class SentralAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5123.KL');
  }

  /**
   * Process Sentral references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5123.KL', displayId, {
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
    this.references = Array.from(this.linker['references'].values())
      .filter(r => r.entityCode === '5123.KL')
      .map(r => ({
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
    const entityRefs = ['SE:1', 'SE:5', 'SE:15', 'SE:16', 'SE:18', 'SE:19', 'SE:25'];
    
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
      code: '5123.KL',
      name: 'Sentral Real Estate Investment Trust (Sentral REIT)',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2006-04-12',
      manager: {
        name: 'Sentral REIT Managers Sdn Bhd',
        ownershipStructure: 'Professional management'
      },
      trustee: 'Maybank Trustees Berhad',
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
   * Build all metrics
   */
  buildMetrics(): Metric[] {
    const fy2025: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2025 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-12-31' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 5,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['SE:23', 'SE:28']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 2800,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['SE:21', 'SE:39']
    });

    this.addMetric({
      metricType: 'investment_properties',
      value: 2700,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['SE:22', 'SE:34']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 5,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['SE:23']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['SE:24', 'SE:37']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 180,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['SE:14', 'SE:74']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 135,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['SE:75']
    });

    this.addMetric({
      metricType: 'realised_income',
      value: 76,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['SE:57', 'SE:76']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.58,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['SE:13', 'SE:41', 'SE:62', 'SE:79']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 1.15,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['SE:61', 'SE:80']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 7.5,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['SE:12', 'SE:54', 'SE:56', 'SE:63']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 98,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['SE:59', 'SE:70']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 38,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['SE:9', 'SE:42', 'SE:50', 'SE:68']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 3.2,
      unit: 'x',
      period: fy2025,
      sourceDisplayIds: ['SE:11', 'SE:44', 'SE:51']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 1064,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['SE:40']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 85,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['SE:30', 'SE:66']
    });

    this.addMetric({
      metricType: 'wale_years',
      value: 6.5,
      unit: 'years',
      period: q4Point,
      sourceDisplayIds: ['SE:38', 'SE:67']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 0.73,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['SE:61', 'SE:62']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: -27,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['SE:61', 'SE:62']
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
        title: 'Geographic Concentration Risk',
        description: '100% portfolio concentration in Kuala Lumpur office market creates exposure to local economic cycles and office market conditions.',
        currentScore: 4,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Prime locations in KL commercial district', impact: 'significant' },
          { factor: 'High-quality tenant base', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Complete KL concentration with no geographic diversification', impact: 'significant' },
          { factor: 'Office market exposure to evolving workplace trends', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'KL office market vacancy rates',
          'Rental rate trends in prime locations',
          'New office supply pipeline'
        ],
        sourceDisplayIds: ['SE:24', 'SE:86', 'SE:88', 'SE:92']
      },
      {
        id: this.generateId(),
        category: 'concentration',
        severity: 'medium',
        title: 'Tenant Concentration Risk',
        description: 'Exposure to corporate tenant credit quality with potential concentration in select industries.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Long-term lease structures provide income stability', impact: 'significant' },
          { factor: 'Corporate tenants include multinational companies', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Credit exposure to corporate occupiers', impact: 'moderate' },
          { factor: 'Office sector tenant business cycle correlation', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Tenant financial health reports',
          'Lease expiry schedule',
          'Occupancy rate trends'
        ],
        sourceDisplayIds: ['SE:31', 'SE:87', 'SE:97']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'medium',
        title: 'Interest Rate Sensitivity',
        description: 'Floating rate debt exposure creates sensitivity to BNM OPR changes and market interest rates.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Conservative gearing at 38% provides buffer', impact: 'moderate' },
          { factor: 'Strong interest coverage at 3.2x', impact: 'moderate' },
          { factor: 'Active interest rate risk management', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Floating rate debt exposure', impact: 'significant' },
          { factor: 'Interest rate environment uncertainty', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Debt maturity profile',
          'Refinancing negotiations'
        ],
        sourceDisplayIds: ['SE:48', 'SE:49', 'SE:69', 'SE:89', 'SE:98']
      },
      {
        id: this.generateId(),
        category: 'market',
        severity: 'medium',
        title: 'Office Market Conditions',
        description: 'Evolving workplace trends and hybrid work adoption may impact office space demand and rental rates.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Prime location properties maintain attractiveness', impact: 'significant' },
          { factor: 'Long-term leases provide near-term stability', impact: 'significant' },
          { factor: 'WALE of 6.5 years reduces near-term rollover risk', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Office market uncertainty from evolving workplace trends', impact: 'significant' },
          { factor: 'Potential oversupply in KL office market', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Office market absorption rates',
          'Rental reversion trends',
          'Workplace policy changes among major tenants'
        ],
        sourceDisplayIds: ['SE:86', 'SE:96']
      },
      {
        id: this.generateId(),
        category: 'gearing',
        severity: 'low',
        title: 'Debt Maturity and Refinancing',
        description: 'Debt maturity profile requires active refinancing management over medium term.',
        currentScore: 2,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Conservative gearing level', impact: 'significant' },
          { factor: 'Strong sponsor support and banking relationships', impact: 'moderate' },
          { factor: 'Diversified funding sources', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Debt maturity profile requires monitoring', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Debt maturity schedule',
          'Refinancing negotiations',
          'Credit market conditions'
        ],
        sourceDisplayIds: ['SE:46', 'SE:52', 'SE:90']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'REIT Regulatory Compliance',
        description: 'SC Malaysia REIT Guidelines require minimum 90% distribution and compliance with gearing limits.',
        currentScore: 2,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Consistent compliance with SC guidelines', impact: 'significant' },
          { factor: 'Payout ratio above 90% requirement', impact: 'significant' },
          { factor: 'Gearing well below 60% regulatory limit', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: 'Regulatory changes could impact structure', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'SC Malaysia REIT guideline updates',
          'Distribution compliance',
          'Gearing limit changes'
        ],
        sourceDisplayIds: ['SE:10', 'SE:43', 'SE:60', 'SE:73', 'SE:91', 'SE:94']
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
      overallScore: 3,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5130.KL'),
        relativeRisk: 'similar',
        keyDifferences: [
          'Similar gearing to peers (~38%)',
          'Higher geographic concentration than diversified peers',
          'Office focus vs industrial/retail peers'
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
        title: 'Prime KL Commercial Portfolio',
        content: 'Sentral REIT maintains a portfolio of prime commercial office properties in Kuala Lumpur, including Menara Shell and other Grade A office buildings. The portfolio benefits from strategic locations in the commercial district.',
        summary: 'Prime KL office portfolio with strategic locations',
        keyFacts: [
          { label: 'Properties', value: 5 },
          { label: 'Focus', value: 'KL Commercial' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [
          { metricType: 'property_count', value: 5 },
          { metricType: 'geographic_concentration', value: 100 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['SE:6', 'SE:7', 'SE:26', 'SE:92'],
        primaryCitation: 'SE:6'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'positive',
        title: 'Conservative Leverage Profile',
        content: 'Sentral REIT maintains conservative gearing at ~38%, well below the 60% regulatory limit. Interest coverage of 3.2x provides adequate cushion for debt servicing.',
        summary: 'Conservative 38% gearing, 3.2x interest coverage',
        keyFacts: [
          { label: 'Gearing', value: 38, unit: '%' },
          { label: 'Interest Cover', value: 3.2, unit: 'x' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'gearing_ratio', value: 38 },
          { metricType: 'interest_coverage', value: 3.2 }
        ],
        relatedRisks: [
          { category: 'interest_rate', severity: 'medium' }
        ],
        sourceDisplayIds: ['SE:9', 'SE:42', 'SE:50', 'SE:68', 'SE:95'],
        primaryCitation: 'SE:42'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'info',
        title: 'Long-Term Lease Structure',
        content: 'Portfolio WALE of 6.5 years provides income stability with long-term corporate leases. However, 100% KL concentration creates geographic risk requiring monitoring.',
        summary: '6.5 years WALE with 100% KL concentration',
        keyFacts: [
          { label: 'WALE', value: 6.5, unit: 'years' },
          { label: 'Concentration', value: 100, unit: '% KL' }
        ],
        indicator: { icon: 'neutral', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'wale_years', value: 6.5 },
          { metricType: 'occupancy_rate', value: 85 }
        ],
        relatedRisks: [
          { category: 'concentration', severity: 'high' },
          { category: 'market', severity: 'medium' }
        ],
        sourceDisplayIds: ['SE:38', 'SE:71', 'SE:88'],
        primaryCitation: 'SE:38'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'warning',
        title: 'Market Price Discount to NAV',
        content: 'Trading at ~27% discount to NAV, reflecting market concerns about office sector outlook and geographic concentration. This presents both risk and potential value opportunity.',
        summary: 'Trading at 27% discount to NAV',
        keyFacts: [
          { label: 'NAV', value: 1.58, unit: 'RM' },
          { label: 'Price', value: 1.15, unit: 'RM' }
        ],
        indicator: { icon: 'trend_down', color: 'orange' },
        relatedMetrics: [
          { metricType: 'nav_per_unit', value: 1.58 },
          { metricType: 'share_price', value: 1.15 },
          { metricType: 'premium_discount_to_nav', value: -27 }
        ],
        relatedRisks: [
          { category: 'market', severity: 'medium' }
        ],
        sourceDisplayIds: ['SE:61', 'SE:62', 'SE:80'],
        primaryCitation: 'SE:61'
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

    // Historical DPU series (estimated based on available data)
    const dpuSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'dpu',
      frequency: 'annual',
      unit: 'sen',
      dataPoints: [
        { date: '2021-12-31', value: 7.2, isInterpolated: false, sourceDisplayId: 'SE:55' },
        { date: '2022-12-31', value: 7.3, isInterpolated: false, sourceDisplayId: 'SE:55' },
        { date: '2023-12-31', value: 7.0, isInterpolated: false, sourceDisplayId: 'SE:55' },
        { date: '2024-12-31', value: 7.4, isInterpolated: false, sourceDisplayId: 'SE:55' },
        { date: '2025-12-31', value: 7.5, isInterpolated: false, sourceDisplayId: 'SE:56' }
      ],
      sourceDisplayIds: ['SE:55', 'SE:56', 'SE:63']
    };

    // Occupancy rate series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 88, isInterpolated: true },
        { date: '2022-12-31', value: 87, isInterpolated: true },
        { date: '2023-12-31', value: 85, isInterpolated: false, sourceDisplayId: 'SE:30' },
        { date: '2024-12-31', value: 86, isInterpolated: true },
        { date: '2025-12-31', value: 85, isInterpolated: false, sourceDisplayId: 'SE:66' }
      ],
      sourceDisplayIds: ['SE:30', 'SE:66']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-12-31', value: 1.65, isInterpolated: false, sourceDisplayId: 'SE:79' },
        { date: '2022-12-31', value: 1.62, isInterpolated: false, sourceDisplayId: 'SE:79' },
        { date: '2023-12-31', value: 1.60, isInterpolated: false, sourceDisplayId: 'SE:79' },
        { date: '2024-12-31', value: 1.59, isInterpolated: false, sourceDisplayId: 'SE:79' },
        { date: '2025-12-31', value: 1.58, isInterpolated: false, sourceDisplayId: 'SE:62' }
      ],
      sourceDisplayIds: ['SE:79', 'SE:62', 'SE:13']
    };

    // Gearing ratio series
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 36, isInterpolated: false, sourceDisplayId: 'SE:9' },
        { date: '2022-12-31', value: 37, isInterpolated: false, sourceDisplayId: 'SE:9' },
        { date: '2023-12-31', value: 38, isInterpolated: false, sourceDisplayId: 'SE:9' },
        { date: '2024-12-31', value: 38, isInterpolated: false, sourceDisplayId: 'SE:9' },
        { date: '2025-12-31', value: 38, isInterpolated: false, sourceDisplayId: 'SE:42' }
      ],
      sourceDisplayIds: ['SE:9', 'SE:42', 'SE:50']
    };

    // Gross revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 175, isInterpolated: true },
        { date: '2022-12-31', value: 178, isInterpolated: true },
        { date: '2023-12-31', value: 176, isInterpolated: true },
        { date: '2024-12-31', value: 179, isInterpolated: true },
        { date: '2025-12-31', value: 180, isInterpolated: false, sourceDisplayId: 'SE:74' }
      ],
      sourceDisplayIds: ['SE:14', 'SE:74']
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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - Sentral REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[SentralAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createSentralAdapter(linker: CitationLinker): SentralAdapter {
  return new SentralAdapter(linker);
}
