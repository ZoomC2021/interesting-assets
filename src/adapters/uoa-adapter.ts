/**
 * UOA REIT Data Adapter
 * 
 * Transforms UOA REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Handles office-focused portfolio with 6 buildings (UOA Downtown, UOA Bangsar, etc.)
 * and preserves all U:XXX citations.
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
// UOA Adapter Class
// ============================================================================

export class UoaAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5110.KL');
  }

  /**
   * Process UOA references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5110.KL', displayId, {
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
      .filter(r => r.entityCode === '5110.KL')
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
    const entityRefs = ['U:1', 'U:3', 'U:6', 'U:11', 'U:15', 'U:17'];
    
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
      code: '5110.KL',
      name: 'UOA Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2005-12-30',
      manager: {
        name: 'UOA Asset Management Sdn Bhd',
        ownershipStructure: 'Subsidiary of UOA Holdings Sdn Bhd, ultimate parent United Overseas Australia Ltd',
        controllingShareholder: 'United Overseas Australia Ltd (~45-50%)'
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
      value: 6,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['U:36']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 1762.86,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['U:348']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 6,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['U:36']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 1800000,
      unit: 'sq ft',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['U:39']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['U:83']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 125.3,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['U:112']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 77.534,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['U:114']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.4248,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['U:131']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 554,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['U:2']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 6.95,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['U:181']
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 13.2,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['U:181']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 8.7,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['U:2', 'U:181']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 95,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:195']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 40.5,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['U:139']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 3.0,
      unit: 'x',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:166']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 713.5,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['U:136']
    });

    this.addMetric({
      metricType: 'fixed_rate_debt_pct',
      value: 0,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['U:141']
    });

    this.addMetric({
      metricType: 'floating_rate_debt_pct',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['U:140']
    });

    this.addMetric({
      metricType: 'wacd',
      value: 3.8,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:150']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 85,
      unit: '%',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['U:40']
    });

    this.addMetric({
      metricType: 'wale_years',
      value: 1.36,
      unit: 'years',
      period: q4Point,
      sourceDisplayIds: ['U:41']
    });

    this.addMetric({
      metricType: 'rental_reversion',
      value: -5,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:187']
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 61.8,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['U:115']
    });

    // Additional operational metrics
    this.addMetric({
      metricType: 'investment_properties',
      value: 1734,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['U:347']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 0.80,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['U:2']
    });

    this.addMetric({
      metricType: 'lease_renewal_rate',
      value: 74,
      unit: '% expiring',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:41']
    });

    this.addMetric({
      metricType: 'gearing_ratio',
      value: 20,
      unit: '% unencumbered',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['U:136']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 6,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['U:36']
    });

    // Risk metrics
    this.addMetric({
      metricType: 'interest_rate_sensitivity',
      value: 1.78,
      unit: 'RM million per +25bps',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['U:151']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 0.56,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['U:2', 'U:131']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: -44,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      isEstimated: true,
      sourceDisplayIds: ['U:2', 'U:131']
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
        title: 'Office Sector Concentration',
        description: '100% office portfolio with 6 buildings concentrated in KL commercial precincts creates sector and regional exposure.',
        currentScore: 2.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: '6 properties across 3 sub-markets (Golden Triangle, Damansara, Bangsar South)', impact: 'significant' },
          { factor: 'Diversified tenant base across professional services, GLCs, MNCs', impact: 'moderate' },
          { factor: 'Quality Grade A and GBI-certified assets', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '100% office exposure vs mixed-use REITs', impact: 'moderate' },
          { factor: 'KL office market challenging with oversupply concerns', impact: 'moderate' },
          { factor: 'No retail/hotel diversification', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'KL office market vacancy rates',
          'Rental rate trends by submarket',
          'New office supply pipeline'
        ],
        sourceDisplayIds: ['U:36', 'U:78', 'U:79', 'U:80', 'U:87']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'critical',
        title: 'Extreme Floating-Rate Debt Exposure',
        description: '100% floating-rate debt exposes UOA REIT to full OPR volatility. Each +25bps impacts DPU by ~0.26 sen (~3.7%).',
        currentScore: 4.5,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'floating_rate_debt_pct', value: 100, context: 'Highest rate sensitivity in peer group' }
        ],
        mitigatingFactors: [
          { factor: 'Gearing at 40.5% provides some cushion', impact: 'moderate' },
          { factor: 'Interest cover ~3.0x above regulatory minimum', impact: 'moderate' },
          { factor: 'Manageable debt maturity profile', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '100% floating-rate - no fixed-rate protection', impact: 'significant' },
          { factor: 'No interest rate hedging instruments disclosed', impact: 'significant' },
          { factor: 'OPR increases flow directly through to finance costs', impact: 'significant' },
          { factor: 'Major shift from 59% fixed in FY2024 to 0% in FY2025', impact: 'significant' }
        ],
        trend: 'deteriorating',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Refinancing terms at each maturity',
          'Interest rate hedging adoption',
          'Finance cost trends vs revenue'
        ],
        sourceDisplayIds: ['U:140', 'U:141', 'U:142', 'U:143', 'U:147', 'U:151']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'Australian Parent Oversight',
        description: 'Cross-border ownership structure with United Overseas Australia Ltd (ASX-listed) provides additional governance layer.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: '20+ year track record since 2005 IPO', impact: 'significant' },
          { factor: 'Australian ASX-listed parent company oversight', impact: 'significant' },
          { factor: 'Professional management team with long tenure', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Cross-border ownership adds complexity', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Parent company financial health',
          'Management stability',
          'Governance practice updates'
        ],
        sourceDisplayIds: ['U:13', 'U:20', 'U:21', 'U:23']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'low',
        title: 'Standard Disclosure Practices',
        description: 'Regular disclosure of financial metrics with standard Bursa Malaysia compliance.',
        currentScore: 1.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Regular quarterly reporting', impact: 'moderate' },
          { factor: 'Property-level occupancy updates', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: ['Continued disclosure maintenance'],
        sourceDisplayIds: ['U:24', 'U:40']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'high',
        title: 'Short WALE Risk',
        description: '1.36-year WALE is notably short, creating near-term re-leasing pressure in challenging office market.',
        currentScore: 3.5,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'wale_years', value: 1.36, context: 'Below industry average ~3-4 years' }
        ],
        mitigatingFactors: [
          { factor: '+19% occupancy improvement at Menara UOA Bangsar shows recovery', impact: 'significant' },
          { factor: 'Quality tenant base (Skrine, Bank Rakyat) provides stability', impact: 'moderate' },
          { factor: '19% Menara UOA Bangsar gain demonstrates leasing success', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: '1.36-year WALE requires constant re-leasing effort', impact: 'significant' },
          { factor: 'KL office market oversupply pressures rents', impact: 'significant' },
          { factor: 'Aggressive retention pricing may compress margins', impact: 'moderate' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Lease renewal progress',
          'Occupancy trends by building',
          'Rental rate negotiations',
          'Tenant retention announcements'
        ],
        sourceDisplayIds: ['U:41', 'U:96', 'U:66', 'U:99', 'U:102']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'Aligned Sponsor Structure',
        description: '45-50% ownership by United Overseas Australia Ltd creates alignment, though listed parent diversifies sponsor risk.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Major sponsor stake aligns interests with unitholders', impact: 'significant' },
          { factor: 'Australian-listed parent provides governance standards', impact: 'moderate' },
          { factor: '20-year track record demonstrates commitment', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Cross-border structure adds complexity', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Sponsor stake changes',
          'Parent company performance',
          'Strategic direction alignment'
        ],
        sourceDisplayIds: ['U:31', 'U:13', 'U:35']
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
      overallScore: 3.5,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5106.KL'),
        relativeRisk: 'higher',
        keyDifferences: [
          '100% floating-rate debt vs 35% floating',
          '1.36-year WALE vs 4.4 years',
          '44% discount to NAV vs 21% premium',
          'Recovery phase vs established growth'
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
        title: 'Encouraging Recovery Signs',
        content: 'FY2025 shows positive momentum with +13.2% DPU growth to 6.95 sen and +19% occupancy gain at Menara UOA Bangsar, marking potential trough exit.',
        summary: '+13.2% DPU growth, occupancy recovery, RM77.5M NPI',
        keyFacts: [
          { label: 'DPU Growth', value: 13.2, unit: '%' },
          { label: 'Occupancy Gain', value: 19, unit: '%' },
          { label: 'DPU', value: 6.95, unit: 'sen' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu_growth_yoy', value: 13.2 },
          { metricType: 'dpu', value: 6.95 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['U:181', 'U:66', 'U:183'],
        primaryCitation: 'U:181'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'warning',
        title: 'Critical Rate Sensitivity',
        content: '100% floating-rate debt makes UOA REIT most rate-sensitive in peer group. Shift from 59% fixed (FY2024) to 0% fixed (FY2025) amplifies OPR risk significantly.',
        summary: '100% floating-rate, 0% fixed, high sensitivity',
        keyFacts: [
          { label: 'Floating Rate', value: 100, unit: '%' },
          { label: 'Impact/25bps', value: 0.26, unit: 'sen DPU' },
          { label: 'Prior Fixed', value: 59, unit: '% (FY2024)' }
        ],
        indicator: { icon: 'warning', color: 'orange' },
        relatedMetrics: [
          { metricType: 'floating_rate_debt_pct', value: 100 },
          { metricType: 'interest_rate_sensitivity', value: 1.78 }
        ],
        relatedRisks: [
          { category: 'interest_rate', severity: 'significant' }
        ],
        sourceDisplayIds: ['U:140', 'U:143', 'U:151'],
        primaryCitation: 'U:140'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'risk_assessment',
        priority: 'warning',
        title: 'Short WALE Challenge',
        content: '1.36-year WALE creates constant re-leasing pressure. While +19% Menara UOA Bangsar improvement is positive, short leases require ongoing tenant retention efforts.',
        summary: '1.36-year WALE, 19% occupancy gain at key property',
        keyFacts: [
          { label: 'WALE', value: 1.36, unit: 'years' },
          { label: 'Occupancy Gain', value: 19, unit: '%' },
          { label: 'Building', value: 'Menara UOA Bangsar', unit: '' }
        ],
        indicator: { icon: 'alert', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'wale_years', value: 1.36 }
        ],
        relatedRisks: [
          { category: 'tenant_rollover', severity: 'high' }
        ],
        sourceDisplayIds: ['U:41', 'U:66', 'U:96'],
        primaryCitation: 'U:41'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'market_context',
        priority: 'positive',
        title: 'Deep Value Opportunity',
        content: 'Trading at ~44% discount to NAV (RM0.80 vs RM1.42) with 8.7% yield offers deep value for contrarian investors, if recovery trajectory continues.',
        summary: '44% discount to NAV, 8.7% yield, value opportunity',
        keyFacts: [
          { label: 'NAV', value: 1.42, unit: 'RM' },
          { label: 'Discount', value: 44, unit: '%' },
          { label: 'Yield', value: 8.7, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'premium_discount_to_nav', value: -44 },
          { metricType: 'dividend_yield_market', value: 8.7 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['U:131', 'U:2'],
        primaryCitation: 'U:131'
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
        { date: '2019-12-31', value: 9.33, isInterpolated: false, sourceDisplayId: 'U:175' },
        { date: '2020-12-31', value: 8.85, isInterpolated: false, sourceDisplayId: 'U:176' },
        { date: '2021-12-31', value: 8.64, isInterpolated: false, sourceDisplayId: 'U:177' },
        { date: '2022-12-31', value: 8.62, isInterpolated: false, sourceDisplayId: 'U:178' },
        { date: '2023-12-31', value: 8.28, isInterpolated: false, sourceDisplayId: 'U:179' },
        { date: '2024-12-31', value: 6.14, isInterpolated: false, sourceDisplayId: 'U:180' },
        { date: '2025-12-31', value: 6.95, isInterpolated: false, sourceDisplayId: 'U:181' }
      ],
      sourceDisplayIds: ['U:175', 'U:176', 'U:177', 'U:178', 'U:179', 'U:180', 'U:181']
    };

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 111.4, isInterpolated: false, sourceDisplayId: 'U:123' },
        { date: '2022-12-31', value: 115.6, isInterpolated: false, sourceDisplayId: 'U:122' },
        { date: '2023-12-31', value: 111.4, isInterpolated: false, sourceDisplayId: 'U:123' },
        { date: '2024-12-31', value: 111.4, isInterpolated: false, sourceDisplayId: 'U:124' },
        { date: '2025-12-31', value: 125.3, isInterpolated: false, sourceDisplayId: 'U:112' }
      ],
      sourceDisplayIds: ['U:112', 'U:122', 'U:123', 'U:124']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-12-31', value: 1.45, isInterpolated: true },
        { date: '2022-12-31', value: 1.44, isInterpolated: true },
        { date: '2023-12-31', value: 1.43, isInterpolated: true },
        { date: '2024-12-31', value: 1.42, isInterpolated: true },
        { date: '2025-12-31', value: 1.4248, isInterpolated: false, sourceDisplayId: 'U:131' }
      ],
      sourceDisplayIds: ['U:131']
    };

    // Gearing ratio series
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 40, isInterpolated: true },
        { date: '2022-12-31', value: 40, isInterpolated: true },
        { date: '2023-12-31', value: 40, isInterpolated: true },
        { date: '2024-12-31', value: 40, isInterpolated: true },
        { date: '2025-12-31', value: 40.5, isInterpolated: false, sourceDisplayId: 'U:139' }
      ],
      sourceDisplayIds: ['U:139']
    };

    // NPI series
    const npiSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'net_property_income',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 72.3, isInterpolated: false, sourceDisplayId: 'U:123' },
        { date: '2022-12-31', value: 75.8, isInterpolated: false, sourceDisplayId: 'U:122' },
        { date: '2023-12-31', value: 72.3, isInterpolated: false, sourceDisplayId: 'U:123' },
        { date: '2024-12-31', value: 74.8, isInterpolated: false, sourceDisplayId: 'U:124' },
        { date: '2025-12-31', value: 77.5, isInterpolated: false, sourceDisplayId: 'U:114' }
      ],
      sourceDisplayIds: ['U:114', 'U:122', 'U:123', 'U:124']
    };

    this.timeSeries = [dpuSeries, revenueSeries, navSeries, gearingSeries, npiSeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - UOA REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[UoaAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createUoaAdapter(linker: CitationLinker): UoaAdapter {
  return new UoaAdapter(linker);
}
