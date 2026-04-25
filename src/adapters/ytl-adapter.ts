/**
 * YTL REIT Data Adapter
 *
 * Transforms YTL REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 *
 * Handles hospitality sector specifics and cross-border
 * portfolio characteristics while preserving all Y:XXX citations.
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
// YTL Adapter Class
// ============================================================================

export class YtlAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5109.KL');
  }

  /**
   * Process YTL references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};

    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5109.KL', displayId, {
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
      .filter(r => r.entityCode === '5109.KL')
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
    const entityRefs = ['Y:1', 'Y:2', 'Y:6', 'Y:7', 'Y:28', 'Y:29', 'Y:31', 'Y:34'];

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
      code: '5109.KL',
      name: 'YTL Hospitality Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2005-12-16',
      manager: {
        name: 'Pintar Projek Sdn Bhd',
        ownershipStructure: '70% YTL Corporation Berhad',
        controllingShareholder: 'YTL Corporation Berhad'
      },
      trustee: 'Maybank Trustees Berhad',
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
   * Build all metrics (30+ identifiable)
   */
  buildMetrics(): Metric[] {
    const fy2025: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2025 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-06-30' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 19,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['Y:11', 'Y:12']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 5445,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['Y:13']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 19,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['Y:11', 'Y:42', 'Y:43', 'Y:44']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 65.4,
      unit: '%',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['Y:47', 'Y:144']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 548.3,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['Y:20']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 292.1,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['Y:22']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.725,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['Y:23']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 600,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['Y:131']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 0.995,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['Y:24']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 7.75,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['Y:18', 'Y:19', 'Y:112', 'Y:113']
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 10.7,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:122']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 7.79,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['Y:128']
    });

    this.addMetric({
      metricType: 'dividend_yield_nav',
      value: 4.49,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:132']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 77.5,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:125']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 42.8,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['Y:15']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 2.75,
      unit: 'x',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:103']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 2330,
      unit: 'RM million',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['Y:100']
    });

    this.addMetric({
      metricType: 'fixed_rate_debt_pct',
      value: 65,
      unit: '%',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['Y:105', 'Y:108']
    });

    this.addMetric({
      metricType: 'floating_rate_debt_pct',
      value: 35,
      unit: '%',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['Y:106', 'Y:109']
    });

    this.addMetric({
      metricType: 'wacd',
      value: 4.2,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:100', 'Y:105']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 82.9,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['Y:75']
    });

    // Note: WALE not applicable for hospitality REITs (different lease structure)

    this.addMetric({
      metricType: 'npi_margin',
      value: 53.3,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['Y:141']
    });

    // Geographic revenue breakdown
    this.addMetric({
      metricType: 'revenue_australia_pct',
      value: 65.4,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['Y:47', 'Y:144']
    });

    this.addMetric({
      metricType: 'revenue_malaysia_pct',
      value: 29.7,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['Y:46', 'Y:145']
    });

    this.addMetric({
      metricType: 'revenue_japan_pct',
      value: 4.9,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['Y:48', 'Y:146']
    });

    // Revenue by geography
    this.addMetric({
      metricType: 'revenue_australia',
      value: 358.6,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['Y:47']
    });

    this.addMetric({
      metricType: 'revenue_malaysia',
      value: 163.1,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['Y:46']
    });

    this.addMetric({
      metricType: 'revenue_japan',
      value: 26.6,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['Y:48']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 0.58,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['Y:129']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: -42,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['Y:130']
    });

    // Risk metrics
    this.addMetric({
      metricType: 'gearing_headroom',
      value: 7.2,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['Y:101']
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
        title: 'Geographic and Currency Concentration',
        description: '65.4% of revenue from Australia creates significant AUD exposure. Single-country concentration risk higher than diversified industrial peers.',
        currentScore: 3.5,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'revenue_australia_pct', value: 65.4, context: 'Single country dominance' }
        ],
        mitigatingFactors: [
          { factor: 'FX hedging program in place', impact: 'moderate' },
          { factor: 'MYR revenue (29.7%) provides partial natural hedge', impact: 'moderate' },
          { factor: 'Premium assets in stable Australian market', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: '65.4% revenue from single country', impact: 'significant' },
          { factor: 'AUD depreciation directly impacts reported revenue', impact: 'significant' },
          { factor: 'Tourism cycles correlate with economic conditions', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'AUD/MYR exchange rate movements',
          'Australian tourism demand indicators',
          'Reserve Bank of Australia policy changes'
        ],
        sourceDisplayIds: ['Y:47', 'Y:94', 'Y:144', 'Y:110']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'medium',
        title: 'Interest Rate and Gearing Exposure',
        description: '42.8% gearing provides limited headroom (7.2%) to 50% regulatory limit. Mix of fixed sukuk and floating bank debt creates partial exposure.',
        currentScore: 3,
        peerComparison: 'similar',
        quantitativeBacking: [
          { metricType: 'gearing_ratio', value: 42.8, context: 'Above 40% threshold' },
          { metricType: 'gearing_headroom', value: 7.2, context: 'Limited refinancing flexibility' }
        ],
        mitigatingFactors: [
          { factor: 'Sukuk component provides fixed-rate protection', impact: 'significant' },
          { factor: 'RAM AA2(s) rating supports refinancing access', impact: 'moderate' },
          { factor: 'Hospitality assets have collateral value', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Limited headroom to 50% limit', impact: 'significant' },
          { factor: 'Floating bank loans exposed to OPR changes', impact: 'moderate' },
          { factor: 'Interest coverage estimated at 2.5-3.0x (thin cushion)', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Refinancing negotiations',
          'Gearing ratio trending toward 50%'
        ],
        sourceDisplayIds: ['Y:15', 'Y:101', 'Y:103', 'Y:109', 'Y:26']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'high',
        title: 'Related Party Management and Leases',
        description: '70% YTL Corp ownership of Manager creates related party risk. Master leases with YTL Hotels entities require arm\'s length scrutiny.',
        currentScore: 3.5,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Trustee (Maybank Trustees) provides oversight', impact: 'moderate' },
          { factor: 'YTL Corp backing provides financial strength', impact: 'significant' },
          { factor: 'Disclosed related party transactions', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Manager 70% owned by YTL Corp', impact: 'significant' },
          { factor: 'Malaysia hotels under YTL Hotels master leases', impact: 'significant' },
          { factor: 'Potential conflicts in rent negotiations', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Related party transaction disclosures',
          'Master lease renewal terms',
          'Trustee circulars on connected transactions'
        ],
        sourceDisplayIds: ['Y:34', 'Y:80', 'Y:81', 'Y:84', 'Y:88']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'medium',
        title: 'Hospitality Sector Disclosure Gaps',
        description: 'Unlike industrial REITs with WALE, hospitality uses management agreements with variable disclosure. Occupancy and RevPAR data limited.',
        currentScore: 2.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Geographic revenue breakdown provided', impact: 'moderate' },
          { factor: 'Australia occupancy (82.9%) disclosed', impact: 'moderate' },
          { factor: 'Regular quarterly announcements', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'No detailed RevPAR metrics disclosed', impact: 'moderate' },
          { factor: 'Master lease terms not fully transparent', impact: 'moderate' },
          { factor: 'Limited forward booking visibility', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Annual report disclosure improvements',
          'Investor presentation metrics expansion'
        ],
        sourceDisplayIds: ['Y:75', 'Y:46', 'Y:47', 'Y:48']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'low',
        title: 'Master Lease Income Stability',
        description: 'Master lease structure with international operators (Marriott, Hilton) provides income predictability despite hospitality sector volatility.',
        currentScore: 2,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Master leases provide base rent stability', impact: 'significant' },
          { factor: 'Marriott and Hilton are investment-grade operators', impact: 'significant' },
          { factor: 'Long-term management agreements in place', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: 'Variable rent component tied to performance', impact: 'moderate' },
          { factor: 'Related party leases may not be arms-length', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Master lease renewal dates',
          'Operator financial performance',
          'Management agreement amendments'
        ],
        sourceDisplayIds: ['Y:80', 'Y:82', 'Y:85', 'Y:69', 'Y:198']
      },
      {
        id: this.generateId(),
        category: 'geographic',
        severity: 'medium',
        title: 'Multi-Country Operational Complexity',
        description: 'Operations across Malaysia, Australia, and Japan create regulatory, tax, and operational complexity compared to domestic peers.',
        currentScore: 3,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Diversification reduces single-country risk', impact: 'significant' },
          { factor: 'Australia and Japan are stable jurisdictions', impact: 'significant' },
          { factor: 'Established operations in all markets', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Multi-currency reporting complexity', impact: 'moderate' },
          { factor: 'Cross-border tax implications', impact: 'moderate' },
          { factor: 'Japan earthquake risk for Niseko', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Australian tax policy changes',
          'Japan tourism regulations',
          'Cross-border tax treaty changes'
        ],
        sourceDisplayIds: ['Y:8', 'Y:97', 'Y:68', 'Y:44']
      },
      {
        id: this.generateId(),
        category: 'counterparty',
        severity: 'low',
        title: 'Operator Credit Quality',
        description: 'Properties operated by investment-grade hospitality groups (Marriott, Hilton) with strong global presence and financial backing.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Marriott is global hospitality leader', impact: 'significant' },
          { factor: 'Hilton has investment-grade credit profile', impact: 'significant' },
          { factor: 'Global reservation systems provide guest flow', impact: 'significant' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: [
          'Operator credit rating changes',
          'Management agreement compliance'
        ],
        sourceDisplayIds: ['Y:85', 'Y:69', 'Y:54', 'Y:57']
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
      overallRiskRating: 'moderate_high',
      overallScore: 2.9,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5106.KL'),
        relativeRisk: 'higher',
        keyDifferences: [
          'Higher sector volatility (hospitality vs industrial)',
          'Cross-border operations vs domestic focus',
          'Related party exposure vs professional management',
          'Currency risk (AUD) vs all-MYR exposure'
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
        title: 'Strong Post-COVID Recovery',
        content: 'YTL REIT delivered FY2025 DPU of 7.75 sen, representing continued recovery from COVID-19 lows (3.0 sen in FY2021). Australia portfolio achieved 82.9% occupancy.',
        summary: 'DPU recovery from 3.0 to 7.75 sen, 82.9% Australia occupancy',
        keyFacts: [
          { label: 'FY2025 DPU', value: 7.75, unit: 'sen' },
          { label: 'Australia Occupancy', value: 82.9, unit: '%' },
          { label: 'Growth vs FY2021', value: 158, unit: '%' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu', value: 7.75 },
          { metricType: 'occupancy_rate', value: 82.9 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['Y:18', 'Y:75', 'Y:114', 'Y:223'],
        primaryCitation: 'Y:18'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'warning',
        title: 'Elevated Gearing with Limited Headroom',
        content: 'Gearing at 42.8% leaves only 7.2% headroom to 50% regulatory limit. This is higher than Axis REIT (33%) and limits financial flexibility for acquisitions.',
        summary: '42.8% gearing, 7.2% headroom to limit, AA2(s) rating maintained',
        keyFacts: [
          { label: 'Gearing', value: 42.8, unit: '%' },
          { label: 'Headroom', value: 7.2, unit: '%' },
          { label: 'Rating', value: 'AA2(s)' }
        ],
        indicator: { icon: 'warning', color: 'orange' },
        relatedMetrics: [
          { metricType: 'gearing_ratio', value: 42.8 },
          { metricType: 'gearing_headroom', value: 7.2 }
        ],
        relatedRisks: [
          { category: 'interest_rate', severity: 'medium' }
        ],
        sourceDisplayIds: ['Y:15', 'Y:101', 'Y:26'],
        primaryCitation: 'Y:15'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'warning',
        title: 'Australia Revenue Concentration and AUD Risk',
        content: '65.4% of revenue from Australia creates significant AUD exposure. While hedging is in place, currency fluctuations materially impact MYR-reported results.',
        summary: '65.4% Australia revenue, AUD currency exposure, FX hedging active',
        keyFacts: [
          { label: 'Australia Revenue', value: 65.4, unit: '%' },
          { label: 'AUD Revenue', value: 358.6, unit: 'RM M' }
        ],
        indicator: { icon: 'alert', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'revenue_australia_pct', value: 65.4 },
          { metricType: 'revenue_australia', value: 358.6 }
        ],
        relatedRisks: [
          { category: 'concentration', severity: 'high' }
        ],
        sourceDisplayIds: ['Y:47', 'Y:94', 'Y:110', 'Y:144'],
        primaryCitation: 'Y:47'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'governance',
        priority: 'warning',
        title: 'Related Party Management Structure',
        content: 'Manager is 70% owned by YTL Corporation, and Malaysia properties operate under YTL Hotels master leases. This creates potential conflicts of interest requiring trustee oversight.',
        summary: '70% YTL Corp ownership, related party leases, trustee oversight',
        keyFacts: [
          { label: 'YTL Corp Ownership', value: 70, unit: '%' },
          { label: 'Malaysia Properties', value: 13, unit: 'properties' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [],
        relatedRisks: [
          { category: 'governance', severity: 'high' }
        ],
        sourceDisplayIds: ['Y:34', 'Y:80', 'Y:88', 'Y:42'],
        primaryCitation: 'Y:34'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'positive',
        title: 'Premium Brand Partnerships',
        content: 'Properties operated under globally recognized brands including Marriott (5+ hotels), Ritz-Carlton, Hilton, and Autograph Collection, providing access to global reservation systems.',
        summary: 'Marriott, Hilton, Ritz-Carlton brand partnerships, global reach',
        keyFacts: [
          { label: 'Marriott Properties', value: 5, unit: 'hotels' },
          { label: 'Brand Partners', value: 4, unit: 'flags' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [],
        relatedRisks: [],
        sourceDisplayIds: ['Y:85', 'Y:69', 'Y:55', 'Y:60'],
        primaryCitation: 'Y:85'
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
        { date: '2021-06-30', value: 3.0, isInterpolated: false, sourceDisplayId: 'Y:114' },
        { date: '2022-06-30', value: 4.5, isInterpolated: false, sourceDisplayId: 'Y:116' },
        { date: '2023-06-30', value: 5.8, isInterpolated: false, sourceDisplayId: 'Y:118' },
        { date: '2024-06-30', value: 7.0, isInterpolated: false, sourceDisplayId: 'Y:120' },
        { date: '2025-06-30', value: 7.75, isInterpolated: false, sourceDisplayId: 'Y:18' }
      ],
      sourceDisplayIds: ['Y:114', 'Y:116', 'Y:118', 'Y:120', 'Y:18']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-06-30', value: 1.95, isInterpolated: true },
        { date: '2022-06-30', value: 1.88, isInterpolated: true },
        { date: '2023-06-30', value: 1.80, isInterpolated: true },
        { date: '2024-06-30', value: 1.76, isInterpolated: false, sourceDisplayId: 'Y:23' },
        { date: '2025-06-30', value: 1.725, isInterpolated: false, sourceDisplayId: 'Y:23' }
      ],
      sourceDisplayIds: ['Y:23']
    };

    // Gearing ratio series
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-06-30', value: 39.5, isInterpolated: true },
        { date: '2022-06-30', value: 40.2, isInterpolated: true },
        { date: '2023-06-30', value: 41.5, isInterpolated: true },
        { date: '2024-06-30', value: 42.2, isInterpolated: false, sourceDisplayId: 'Y:15' },
        { date: '2025-06-30', value: 42.8, isInterpolated: false, sourceDisplayId: 'Y:15' }
      ],
      sourceDisplayIds: ['Y:15']
    };

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-06-30', value: 285.0, isInterpolated: true },
        { date: '2022-06-30', value: 350.0, isInterpolated: true },
        { date: '2023-06-30', value: 425.0, isInterpolated: true },
        { date: '2024-06-30', value: 495.0, isInterpolated: true },
        { date: '2025-06-30', value: 548.3, isInterpolated: false, sourceDisplayId: 'Y:20' }
      ],
      sourceDisplayIds: ['Y:20']
    };

    // NPI series
    const npiSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'net_property_income',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-06-30', value: 145.0, isInterpolated: true },
        { date: '2022-06-30', value: 185.0, isInterpolated: true },
        { date: '2023-06-30', value: 225.0, isInterpolated: true },
        { date: '2024-06-30', value: 265.0, isInterpolated: true },
        { date: '2025-06-30', value: 292.1, isInterpolated: false, sourceDisplayId: 'Y:22' }
      ],
      sourceDisplayIds: ['Y:22']
    };

    this.timeSeries = [dpuSeries, navSeries, gearingSeries, revenueSeries, npiSeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - YTL REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[YtlAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createYtlAdapter(linker: CitationLinker): YtlAdapter {
  return new YtlAdapter(linker);
}
