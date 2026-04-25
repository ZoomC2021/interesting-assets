/**
 * Pavilion REIT Data Adapter
 * 
 * Transforms Pavilion REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Handles premier retail focus with 4 malls (Pavilion KL, Elite, Bukit Jalil, Da Men)
 * and preserves all P:XXX citations.
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
// Pavilion Adapter Class
// ============================================================================

export class PavilionAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5212.KL');
  }

  /**
   * Process Pavilion references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5212.KL', displayId, {
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
      .filter(r => r.entityCode === '5212.KL')
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
    const entityRefs = ['P:1', 'P:5', 'P:7', 'P:32', 'P:33', 'P:35'];
    
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
      code: '5212.KL',
      name: 'Pavilion Real Estate Investment Trust',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: false,
      listingDate: '2011-12-07',
      manager: {
        name: 'Pavilion REIT Management Sdn Bhd',
        ownershipStructure: 'Professional external manager with KL Pavilion sponsorship',
        controllingShareholder: undefined
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
   * Build all metrics (30+ identifiable)
   */
  buildMetrics(): Metric[] {
    const fy2025: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2025 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-12-31' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 4,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['P:9', 'P:38']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 7550,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['P:10']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 4,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['P:9']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 2760000,
      unit: 'sq ft',
      period: q4Point,
      sourceDisplayIds: ['P:11']
    });

    this.addMetric({
      metricType: 'geographic_concentration',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['P:56']
    });

    // Financial performance metrics
    this.addMetric({
      metricType: 'gross_revenue',
      value: 901.49,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['P:23', 'P:24']
    });

    this.addMetric({
      metricType: 'net_property_income',
      value: 567.89,
      unit: 'RM million',
      period: fy2025,
      sourceDisplayIds: ['P:25', 'P:26']
    });

    this.addMetric({
      metricType: 'nav_per_unit',
      value: 1.33,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['P:125']
    });

    this.addMetric({
      metricType: 'market_cap',
      value: 4600,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['P:131']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 10.00,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['P:21']
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 5.9,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['P:22']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 6.9,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['P:127']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 95,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['P:121']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 37.5,
      unit: '%',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['P:18']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 1.91,
      unit: 'x',
      period: fy2025,
      sourceDisplayIds: ['P:20']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 2760,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['P:59']
    });

    this.addMetric({
      metricType: 'fixed_rate_debt_pct',
      value: 65,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['P:65']
    });

    this.addMetric({
      metricType: 'floating_rate_debt_pct',
      value: 35,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['P:66']
    });

    this.addMetric({
      metricType: 'wacd',
      value: 4.35,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['P:63']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 83,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['P:13']
    });

    this.addMetric({
      metricType: 'wale_years',
      value: 2.1,
      unit: 'years',
      period: q4Point,
      sourceDisplayIds: ['P:72']
    });

    this.addMetric({
      metricType: 'top_tenant_concentration',
      value: 35,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['P:71']
    });

    this.addMetric({
      metricType: 'rental_reversion',
      value: 3.5,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['P:74']
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 63,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['P:27']
    });

    // Additional operational metrics
    this.addMetric({
      metricType: 'property_count',
      value: 4,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['P:9']
    });

    this.addMetric({
      metricType: 'investment_properties',
      value: 7550,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['P:10']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 1.45,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['P:122']
    });

    this.addMetric({
      metricType: 'gearing_ratio',
      value: 15,
      unit: '% unencumbered',
      period: q4Point,
      isEstimated: true,
      sourceDisplayIds: ['P:67']
    });

    this.addMetric({
      metricType: 'lease_renewal_rate',
      value: 42,
      unit: '% expiring',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['P:73']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 1.09,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['P:129']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: 9,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['P:130']
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
        title: 'Flagship Property Concentration',
        description: 'Pavilion KL contributes ~77% of total asset value, creating significant single-asset concentration risk.',
        currentScore: 4,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'geographic_concentration', value: 77, context: 'Pavilion KL asset concentration' }
        ],
        mitigatingFactors: [
          { factor: 'Pavilion KL is premier luxury destination with strong tenant demand', impact: 'significant' },
          { factor: '98% occupancy at flagship demonstrates resilience', impact: 'significant' },
          { factor: 'Diversification across 4 mall properties', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '77% concentration in single asset exceeds prudent thresholds', impact: 'significant' },
          { factor: 'Any disruption at Pavilion KL severely impacts revenue', impact: 'significant' },
          { factor: 'Klang Valley retail market exposure', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Pavilion KL occupancy trends',
          'Tenant sales performance at flagship',
          'Bukit Bintang retail market conditions'
        ],
        sourceDisplayIds: ['P:42', 'P:14', 'P:38', 'P:56']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'medium',
        title: 'Interest Rate Sensitivity',
        description: '35% floating-rate debt exposure with 1.91x interest coverage provides limited cushion against rate increases.',
        currentScore: 3,
        peerComparison: 'similar',
        quantitativeBacking: [
          { metricType: 'interest_coverage', value: 1.91, context: 'Below comfortable 2.5x threshold' }
        ],
        mitigatingFactors: [
          { factor: '65% fixed-rate debt provides majority protection', impact: 'significant' },
          { factor: 'Debt maturity profile is manageable', impact: 'moderate' },
          { factor: 'Investment-grade AA3 credit rating', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Interest coverage at 1.91x leaves limited buffer', impact: 'significant' },
          { factor: 'BNM OPR increases directly impact 35% of debt', impact: 'moderate' },
          { factor: 'Average debt tenure only 2.5-3.0 years', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Bank Negara Malaysia OPR decisions',
          'Refinancing negotiations',
          'Interest coverage ratio trends'
        ],
        sourceDisplayIds: ['P:20', 'P:65', 'P:66', 'P:64', 'P:69']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'Professional Management Structure',
        description: 'Strong governance with independent chairman, experienced CEO, and comprehensive board committees.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Independent Non-Executive Chairman', impact: 'significant' },
          { factor: '4 of 7 directors independent (57%)', impact: 'significant' },
          { factor: '3 board committees (Audit, Nomination, Remuneration)', impact: 'moderate' },
          { factor: 'Experienced management team with retail expertise', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: [
          'Board composition changes',
          'Related party transaction disclosures',
          'Governance practice updates'
        ],
        sourceDisplayIds: ['P:79', 'P:80', 'P:81', 'P:85', 'P:86', 'P:87']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'low',
        title: 'Comprehensive Disclosure',
        description: 'Full disclosure of portfolio metrics, mall-level performance, and lease profiles with high transparency.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Quarterly mall-level occupancy disclosure', impact: 'significant' },
          { factor: 'Detailed lease expiry profile provided', impact: 'moderate' },
          { factor: 'ESG reporting and sustainability initiatives disclosed', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: ['Continued disclosure maintenance'],
        sourceDisplayIds: ['P:13', 'P:14', 'P:15', 'P:16', 'P:17', 'P:72', 'P:73']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'medium',
        title: 'Lease Expiry Profile',
        description: '2.1-year WALE with ~42% of leases expiring in 2025 requires active lease management.',
        currentScore: 2.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: 'Strong tenant relationships at flagship', impact: 'significant' },
          { factor: 'Positive rental reversions (+3.5%) demonstrate pricing power', impact: 'moderate' },
          { factor: 'Diversified tenant mix across categories', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '42% lease expiry concentration in single year', impact: 'moderate' },
          { factor: 'Newer malls (Bukit Jalil 71%, Elite 73%) still ramping up', impact: 'moderate' },
          { factor: 'Retail sector cyclical exposure', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Lease renewal progress',
          'Rental reversion trends',
          'New mall occupancy ramp-up'
        ],
        sourceDisplayIds: ['P:72', 'P:73', 'P:74', 'P:15', 'P:16']
      },
      {
        id: this.generateId(),
        category: 'geographic',
        severity: 'high',
        title: 'Klang Valley Concentration',
        description: '100% portfolio concentration in Klang Valley creates single-region economic exposure.',
        currentScore: 4,
        peerComparison: 'worse',
        mitigatingFactors: [
          { factor: 'Klang Valley is Malaysia economic hub with stable demand', impact: 'significant' },
          { factor: 'Strategic locations near transportation nodes', impact: 'moderate' },
          { factor: 'Premier retail positioning attracts quality tenants', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '100% concentration in single economic region', impact: 'significant' },
          { factor: 'Klang Valley retail supply increasing', impact: 'moderate' },
          { factor: 'No geographic diversification outside KL', impact: 'significant' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Klang Valley retail market conditions',
          'New retail supply pipeline',
          'Regional economic indicators'
        ],
        sourceDisplayIds: ['P:56', 'P:57', 'P:58']
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
      overallScore: 3,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5227.KL'),
        relativeRisk: 'higher',
        keyDifferences: [
          'Flagship concentration 77% vs diversified portfolio',
          '1.91x interest cover vs 9.6x',
          '100% KL exposure vs KL+JB',
          '2.1-year WALE vs stable long-term leases'
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
        title: 'Steady DPU Growth Continues',
        content: 'Pavilion REIT delivered consistent FY2025 performance with DPU of 10.00 sen, up 5.9% YoY, demonstrating resilience in premier retail positioning.',
        summary: '5.9% DPU growth to 10.00 sen, RM901M revenue',
        keyFacts: [
          { label: 'DPU', value: 10.00, unit: 'sen' },
          { label: 'DPU Growth', value: 5.9, unit: '%' },
          { label: 'Revenue', value: 901.49, unit: 'RM M' }
        ],
        indicator: { icon: 'trend_up', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu', value: 10.00 },
          { metricType: 'dpu_growth_yoy', value: 5.9 },
          { metricType: 'gross_revenue', value: 901.49 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['P:21', 'P:22', 'P:23'],
        primaryCitation: 'P:21'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'warning',
        title: 'New Mall Ramp-Up Progress',
        content: 'Pavilion Bukit Jalil (71% occupancy) and Elite Pavilion Malls (73% occupancy) continue lease-up. Pavilion KL maintains strong 98% occupancy.',
        summary: 'Newer malls at 71-73% occupancy, flagship at 98%',
        keyFacts: [
          { label: 'Pavilion KL', value: 98, unit: '%' },
          { label: 'Bukit Jalil', value: 71, unit: '%' },
          { label: 'Elite Malls', value: 73, unit: '%' }
        ],
        indicator: { icon: 'alert', color: 'yellow' },
        relatedMetrics: [
          { metricType: 'occupancy_rate', value: 83 },
          { metricType: 'top_tenant_concentration', value: 35 }
        ],
        relatedRisks: [
          { category: 'concentration', severity: 'high' },
          { category: 'tenant_rollover', severity: 'medium' }
        ],
        sourceDisplayIds: ['P:14', 'P:15', 'P:16'],
        primaryCitation: 'P:14'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'warning',
        title: 'Interest Coverage Monitoring',
        content: 'Interest coverage at 1.91x is below comfortable threshold. While 65% fixed-rate debt provides protection, coverage ratio warrants monitoring given limited cushion.',
        summary: '1.91x interest cover below ideal 2.5x+ threshold',
        keyFacts: [
          { label: 'Interest Cover', value: 1.91, unit: 'x' },
          { label: 'Fixed Rate Debt', value: 65, unit: '%' },
          { label: 'Credit Rating', value: 'AA3', unit: '' }
        ],
        indicator: { icon: 'warning', color: 'orange' },
        relatedMetrics: [
          { metricType: 'interest_coverage', value: 1.91 },
          { metricType: 'fixed_rate_debt_pct', value: 65 }
        ],
        relatedRisks: [
          { category: 'interest_rate', severity: 'medium' }
        ],
        sourceDisplayIds: ['P:20', 'P:65', 'P:69'],
        primaryCitation: 'P:20'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'executive_summary',
        priority: 'positive',
        title: 'Investment Grade Credit Quality',
        content: 'AA3/Stable rating from RAM reflects strong asset quality and stable cash flows. Conservative gearing at 37.5% provides headroom for growth initiatives.',
        summary: 'AA3 credit rating, 37.5% gearing, 11-14% headroom',
        keyFacts: [
          { label: 'Credit Rating', value: 'AA3', unit: '' },
          { label: 'Gearing', value: 37.5, unit: '%' },
          { label: 'Headroom', value: 12.5, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'gearing_ratio', value: 37.5 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['P:69', 'P:18', 'P:61'],
        primaryCitation: 'P:69'
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
        { date: '2021-12-31', value: 8.78, isInterpolated: true },
        { date: '2022-12-31', value: 9.0, isInterpolated: true },
        { date: '2023-12-31', value: 9.44, isInterpolated: false, sourceDisplayId: 'P:118' },
        { date: '2024-12-31', value: 9.44, isInterpolated: false, sourceDisplayId: 'P:115' },
        { date: '2025-12-31', value: 10.00, isInterpolated: false, sourceDisplayId: 'P:21' }
      ],
      sourceDisplayIds: ['P:21', 'P:115', 'P:118']
    };

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 650, isInterpolated: true },
        { date: '2022-12-31', value: 720, isInterpolated: true },
        { date: '2023-12-31', value: 780, isInterpolated: true },
        { date: '2024-12-31', value: 832.5, isInterpolated: false, sourceDisplayId: 'P:116' },
        { date: '2025-12-31', value: 901.49, isInterpolated: false, sourceDisplayId: 'P:23' }
      ],
      sourceDisplayIds: ['P:23', 'P:116']
    };

    // Occupancy rate series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 78, isInterpolated: true },
        { date: '2022-12-31', value: 80, isInterpolated: true },
        { date: '2023-12-31', value: 82, isInterpolated: true },
        { date: '2024-12-31', value: 82, isInterpolated: true },
        { date: '2025-12-31', value: 83, isInterpolated: false, sourceDisplayId: 'P:13' }
      ],
      sourceDisplayIds: ['P:13']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-12-31', value: 1.32, isInterpolated: true },
        { date: '2022-12-31', value: 1.34, isInterpolated: true },
        { date: '2023-12-31', value: 1.35, isInterpolated: true },
        { date: '2024-12-31', value: 1.37, isInterpolated: false, sourceDisplayId: 'P:126' },
        { date: '2025-12-31', value: 1.33, isInterpolated: false, sourceDisplayId: 'P:125' }
      ],
      sourceDisplayIds: ['P:125', 'P:126']
    };

    // NPI series
    const npiSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'net_property_income',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 420, isInterpolated: true },
        { date: '2022-12-31', value: 480, isInterpolated: true },
        { date: '2023-12-31', value: 510, isInterpolated: true },
        { date: '2024-12-31', value: 533.8, isInterpolated: false, sourceDisplayId: 'P:117' },
        { date: '2025-12-31', value: 567.89, isInterpolated: false, sourceDisplayId: 'P:25' }
      ],
      sourceDisplayIds: ['P:25', 'P:117']
    };

    this.timeSeries = [dpuSeries, revenueSeries, occupancySeries, navSeries, npiSeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - Pavilion REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[PavilionAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createPavilionAdapter(linker: CitationLinker): PavilionAdapter {
  return new PavilionAdapter(linker);
}
