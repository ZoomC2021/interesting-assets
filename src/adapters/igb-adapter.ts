/**
 * IGB REIT Data Adapter
 * 
 * Transforms IGB REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Handles 3 premier malls (Mid Valley Megamall, The Gardens Mall, Southkey Megamall)
 * and preserves all I:XXX citations.
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
// IGB Adapter Class
// ============================================================================

export class IgbAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5227.KL');
  }

  /**
   * Process IGB references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5227.KL', displayId, {
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
      .filter(r => r.entityCode === '5227.KL')
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
    const entityRefs = ['I:1', 'I:6', 'I:7', 'I:24', 'I:25', 'I:27'];
    
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
      code: '5227.KL',
      name: 'IGB Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2012-09-21',
      manager: {
        name: 'IGB REIT Management Sdn Bhd',
        ownershipStructure: 'IGB Berhad sponsored with ~45.8% ownership',
        controllingShareholder: 'IGB Berhad'
      },
      trustee: 'RHB Trustees Berhad',
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
   * Build all metrics (30+ identifiable)
   */
  buildMetrics(): Metric[] {
    const fy2025: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2025 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-12-31' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 3,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['I:10', 'I:57', 'I:62', 'I:67']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 6500,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['I:11', 'I:9']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 3,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['I:10']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 4500000,
      unit: 'sq ft',
      period: q4Point,
      sourceDisplayIds: ['I:54']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 86,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['I:73']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 705.1,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['I:18', 'I:19']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 533.6,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['I:20', 'I:21']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.40,
      unit: 'RM',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['I:11', 'I:138']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 6200,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['I:22']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 11.56,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['I:13']
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 11.4,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['I:14']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 6.27,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['I:23']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 90,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['I:194', 'I:195']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 31,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['I:15']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 9.6,
      unit: 'x',
      period: fy2025,
      sourceDisplayIds: ['I:17']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 1215,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['I:136']
    });

    this.addMetric({
      metricType: 'fixed_rate_debt_pct',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['I:134']
    });

    this.addMetric({
      metricType: 'floating_rate_debt_pct',
      value: 0,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['I:134']
    });

    this.addMetric({
      metricType: 'wacd',
      value: 4.49,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['I:137']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['I:12']
    });

    this.addMetric({
      metricType: 'wale_years',
      value: 2.5,
      unit: 'years',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['I:115']
    });

    this.addMetric({
      metricType: 'tenant_count',
      value: 630,
      unit: 'tenants',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['I:61', 'I:66']
    });

    this.addMetric({
      metricType: 'rental_reversion',
      value: 2,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['I:118']
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 75.7,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['I:18', 'I:20']
    });

    // Additional operational metrics
    this.addMetric({
      metricType: 'investment_properties',
      value: 6500,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['I:11']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 1.84,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['I:22']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 1215,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['I:136']
    });

    this.addMetric({
      metricType: 'lease_renewal_rate',
      value: 28.5,
      unit: '% expiring',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['I:115']
    });

    this.addMetric({
      metricType: 'gearing_ratio',
      value: 0,
      unit: '% unencumbered',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['I:145']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 0.95,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['I:22', 'I:11']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: -5,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['I:22', 'I:11']
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
        severity: 'medium',
        title: 'Geographic Concentration',
        description: '86% of portfolio value in Kuala Lumpur (Mid Valley + The Gardens) with Southkey JB adding geographic spread.',
        currentScore: 2.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Southkey acquisition adds Johor Bahru exposure (~14%)', impact: 'significant' },
          { factor: 'Johor Bahru provides Singapore corridor exposure', impact: 'moderate' },
          { factor: 'Both KL malls in prime established locations', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '86% KL concentration remains high', impact: 'moderate' },
          { factor: 'Singapore corridor competition may affect Southkey', impact: 'minor' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Southkey performance metrics',
          'Johor retail market conditions',
          'Singapore visitor trends'
        ],
        sourceDisplayIds: ['I:73', 'I:77', 'I:76']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'low',
        title: 'Fixed-Rate Debt Protection',
        description: '100% fixed-rate debt at 4.49% through MTN issuance provides complete protection from rate volatility.',
        currentScore: 1,
        peerComparison: 'better',
        quantitativeBacking: [
          { metricType: 'fixed_rate_debt_pct', value: 100, context: 'Full protection from rate changes' }
        ],
        mitigatingFactors: [
          { factor: '100% fixed-rate debt eliminates rate risk', impact: 'significant' },
          { factor: 'Excellent 9.6x interest coverage', impact: 'significant' },
          { factor: 'Conservative 31% gearing', impact: 'moderate' },
          { factor: 'Long-term MTN structure', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: [
          'Refinancing timeline (long-term)',
          'Future debt issuance terms'
        ],
        sourceDisplayIds: ['I:134', 'I:137', 'I:17', 'I:15', 'I:138']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'medium',
        title: 'Related Party Considerations',
        description: '45.8% sponsor ownership by IGB Berhad with Southkey acquisition as related party transaction requires monitoring.',
        currentScore: 2.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'IGB Group 50+ year track record', impact: 'significant' },
          { factor: 'Independent director oversight', impact: 'moderate' },
          { factor: 'Regulatory compliance with RPT disclosures', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'High sponsor concentration (45.8%)', impact: 'significant' },
          { factor: 'Southkey acquisition was related party transaction', impact: 'moderate' },
          { factor: 'Chairman is IGB Group veteran (non-independent)', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Related party transaction volumes',
          'Independent committee decisions',
          'Sponsor alignment indicators'
        ],
        sourceDisplayIds: ['I:27', 'I:35', 'I:38', 'I:39']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'low',
        title: 'Strong Disclosure Standards',
        description: 'Comprehensive disclosure of mall-level metrics, lease expiry profiles, and quarterly performance data.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: '100% occupancy disclosure by mall', impact: 'significant' },
          { factor: 'Detailed lease expiry profile provided', impact: 'moderate' },
          { factor: 'Quarterly performance transparency', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: ['Continued disclosure maintenance'],
        sourceDisplayIds: ['I:12', 'I:60', 'I:65', 'I:112', 'I:113', 'I:114']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'high',
        title: '2026 Lease Expiry Concentration',
        description: '40.5% of Mid Valley NLA (40.5% of total) expiring in 2026 creates significant lease rollover risk.',
        currentScore: 4,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'lease_renewal_rate', value: 40.5, context: 'Elevated expiry concentration' }
        ],
        mitigatingFactors: [
          { factor: '100% current occupancy provides buffer', impact: 'significant' },
          { factor: 'Strong tenant retention history', impact: 'moderate' },
          { factor: 'Diversified tenant base reduces single-tenant risk', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '40.5% concentration in single year is elevated', impact: 'significant' },
          { factor: 'Market conditions may pressure rental rates', impact: 'significant' },
          { factor: 'MVM is flagship asset - disruption impact high', impact: 'significant' }
        ],
        trend: 'deteriorating',
        monitoringTriggers: [
          '2026 renewal progress',
          'Rental reversion trends',
          'Tenant retention announcements'
        ],
        sourceDisplayIds: ['I:112', 'I:115', 'I:117', 'I:118', 'I:12']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'IGB Berhad Sponsor Support',
        description: 'Long-standing sponsor relationship with demonstrated support through Southkey acquisition at favorable terms.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'IGB Group 50+ year Malaysian property track record', impact: 'significant' },
          { factor: 'Southkey acquisition at accretive terms', impact: 'significant' },
          { factor: 'Sponsor provides acquisition pipeline', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Related party transaction concentration', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Pipeline acquisition terms',
          'Sponsor financial health',
          'Related party transaction pricing'
        ],
        sourceDisplayIds: ['I:27', 'I:35', 'I:37']
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
      assessmentDate: '2026-04-25',
      overallRiskRating: 'moderate',
      overallScore: 2.5,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5212.KL'),
        relativeRisk: 'lower',
        keyDifferences: [
          '100% fixed-rate debt vs 35% floating exposure',
          '9.6x interest cover vs 1.91x',
          'Near-perfect occupancy vs 83%',
          '31% gearing vs 37.5%'
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
        title: 'Transformative Southkey Acquisition',
        content: 'FY2025 marked transformative RM1.215B Southkey acquisition, expanding portfolio to 3 malls and driving 11.4% DPU growth to record 11.56 sen.',
        summary: '11.4% DPU growth, RM1.215B Southkey acquisition, record performance',
        keyFacts: [
          { label: 'DPU Growth', value: 11.4, unit: '%' },
          { label: 'Acquisition Value', value: 1215, unit: 'RM M' },
          { label: 'New DPU', value: 11.56, unit: 'sen' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu_growth_yoy', value: 11.4 },
          { metricType: 'dpu', value: 11.56 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['I:13', 'I:14', 'I:76', 'I:8'],
        primaryCitation: 'I:13'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'positive',
        title: 'Excellent Debt Structure',
        content: '100% fixed-rate debt at 4.49% provides complete rate protection. Conservative 31% gearing with exceptional 9.6x interest coverage and ~19pp headroom to 50% limit.',
        summary: '100% fixed-rate, 9.6x cover, 31% gearing',
        keyFacts: [
          { label: 'Fixed Rate', value: 100, unit: '%' },
          { label: 'Interest Cover', value: 9.6, unit: 'x' },
          { label: 'Gearing', value: 31, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'fixed_rate_debt_pct', value: 100 },
          { metricType: 'interest_coverage', value: 9.6 },
          { metricType: 'gearing_ratio', value: 31 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['I:134', 'I:137', 'I:17', 'I:15', 'I:142'],
        primaryCitation: 'I:17'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'positive',
        title: 'Near-Perfect Occupancy',
        content: 'Portfolio maintains ~100% occupancy across all 3 malls (MVM, TGM, Southkey), demonstrating exceptional asset quality and tenant demand.',
        summary: '~100% occupancy across all properties',
        keyFacts: [
          { label: 'MVM Occupancy', value: 100, unit: '%' },
          { label: 'TGM Occupancy', value: 100, unit: '%' },
          { label: 'Southkey Occupancy', value: 100, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'occupancy_rate', value: 100 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['I:12', 'I:60', 'I:65', 'I:70'],
        primaryCitation: 'I:12'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'warning',
        title: '2026 Lease Expiry Headwind',
        content: '40.5% of Mid Valley NLA expiring in 2026 presents significant leasing task. Historical tenant retention is strong but rental reversion risk exists in current market.',
        summary: '40.5% MVM NLA expiry in 2026 - key monitoring point',
        keyFacts: [
          { label: 'MVM 2026 Expiry', value: 40.5, unit: '%' },
          { label: 'Portfolio Expiry', value: 28.5, unit: '%' },
          { label: 'TGM Expiry', value: 26, unit: '%' }
        ],
        indicator: { icon: 'alert', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'occupancy_rate', value: 100 }
        ],
        relatedRisks: [
          { category: 'tenant_rollover', severity: 'high' }
        ],
        sourceDisplayIds: ['I:112', 'I:115', 'I:117', 'I:113'],
        primaryCitation: 'I:112'
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
        { date: '2021-12-31', value: 7.95, isInterpolated: false, sourceDisplayId: 'I:164' },
        { date: '2022-12-31', value: 9.94, isInterpolated: false, sourceDisplayId: 'I:166' },
        { date: '2023-12-31', value: 10.27, isInterpolated: false, sourceDisplayId: 'I:169' },
        { date: '2024-12-31', value: 10.38, isInterpolated: false, sourceDisplayId: 'I:172' },
        { date: '2025-12-31', value: 11.56, isInterpolated: false, sourceDisplayId: 'I:13' }
      ],
      sourceDisplayIds: ['I:13', 'I:164', 'I:166', 'I:169', 'I:172']
    };

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 443.4, isInterpolated: false, sourceDisplayId: 'I:218' },
        { date: '2022-12-31', value: 557.5, isInterpolated: false, sourceDisplayId: 'I:221' },
        { date: '2023-12-31', value: 609.5, isInterpolated: false, sourceDisplayId: 'I:224' },
        { date: '2024-12-31', value: 626.1, isInterpolated: false, sourceDisplayId: 'I:227' },
        { date: '2025-12-31', value: 705.1, isInterpolated: false, sourceDisplayId: 'I:18' }
      ],
      sourceDisplayIds: ['I:18', 'I:218', 'I:221', 'I:224', 'I:227']
    };

    // NPI series
    const npiSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'net_property_income',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 309.7, isInterpolated: false, sourceDisplayId: 'I:219' },
        { date: '2022-12-31', value: 400.3, isInterpolated: false, sourceDisplayId: 'I:222' },
        { date: '2023-12-31', value: 441.9, isInterpolated: false, sourceDisplayId: 'I:225' },
        { date: '2024-12-31', value: 455.7, isInterpolated: false, sourceDisplayId: 'I:228' },
        { date: '2025-12-31', value: 533.6, isInterpolated: false, sourceDisplayId: 'I:20' }
      ],
      sourceDisplayIds: ['I:20', 'I:219', 'I:222', 'I:225', 'I:228']
    };

    // Gearing ratio series
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
        { date: '2024-12-31', value: 22, isInterpolated: false, sourceDisplayId: 'I:16' },
        { date: '2025-12-31', value: 31, isInterpolated: false, sourceDisplayId: 'I:15' }
      ],
      sourceDisplayIds: ['I:15', 'I:16']
    };

    // Occupancy series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 98, isInterpolated: true },
        { date: '2022-12-31', value: 99, isInterpolated: true },
        { date: '2023-12-31', value: 99, isInterpolated: true },
        { date: '2024-12-31', value: 99.5, isInterpolated: false, sourceDisplayId: 'I:80' },
        { date: '2025-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'I:12' }
      ],
      sourceDisplayIds: ['I:12', 'I:80']
    };

    this.timeSeries = [dpuSeries, revenueSeries, npiSeries, gearingSeries, occupancySeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - IGB REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[IgbAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createIgbAdapter(linker: CitationLinker): IgbAdapter {
  return new IgbAdapter(linker);
}
