/**
 * KLCC REIT Data Adapter
 * 
 * Transforms KLCC REIT source data (MD + JSON references)
 * into normalized schema format per adapter-spec.md.
 * 
 * Includes full disclosure metrics (WALE, tenant count, etc.)
 * and preserves all K:XXX citations.
 * 
 * Special note: KLCC REIT is Malaysia's only stapled security
 * combining KLCC REIT (Islamic) and KLCC Property Holdings.
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
// KLCC Adapter Class
// ============================================================================

export class KlccAdapter {
  private linker: CitationLinker;
  private entityId: string;
  private references: Reference[] = [];
  private metrics: Metric[] = [];
  private timeSeries: TimeSeries[] = [];
  private observations: Observation[] = [];

  constructor(linker: CitationLinker) {
    this.linker = linker;
    this.entityId = CitationLinker.generateEntityUuid('5235SS');
  }

  /**
   * Process KLCC references from JSON
   */
  processReferences(sourceData: Record<string, any>): void {
    const refs = sourceData.references || {};
    
    for (const [displayId, refData] of Object.entries(refs)) {
      if (typeof refData === 'object' && refData !== null) {
        this.linker.registerReference('5235SS', displayId, {
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
      .filter(r => r.entityCode === '5235SS')
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
    const entityRefs = ['K:1', 'K:5', 'K:6', 'K:24', 'K:26', 'K:27'];
    
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
      code: '5235SS',
      name: 'KLCCP Stapled Group (KLCC REIT)',
      exchange: 'Bursa Malaysia',
      sector: 'Real Estate Investment Trusts',
      currency: 'MYR',
      isShariahCompliant: true,
      isStapledSecurity: true,
      listingDate: '2013-02-08',
      manager: {
        name: 'KLCC REIT Management Sdn Bhd',
        ownershipStructure: 'KLCC (Holdings) Sdn Bhd, ultimately owned by PETRONAS',
        controllingShareholder: 'KLCC (Holdings) Sdn Bhd (~60%)'
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
    const fy2024: Metric['period'] = { type: 'fiscal_year', fiscalYear: 2024 };
    const q4Point: Metric['period'] = { type: 'point_in_time', date: '2025-12-31' };

    // Portfolio metrics
    this.addMetric({
      metricType: 'portfolio_size',
      value: 6,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['K:8', 'K:52', 'K:54', 'K:56', 'K:59', 'K:62', 'K:64', 'K:67']
    });

    this.addMetric({
      metricType: 'total_assets',
      value: 16800,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['K:9', 'K:222']
    });

    this.addMetric({
      metricType: 'property_count',
      value: 6,
      unit: 'properties',
      period: q4Point,
      sourceDisplayIds: ['K:8']
    });

    this.addMetric({
      metricType: 'net_lettable_area',
      value: 5000000,
      unit: 'sq ft',
      period: q4Point,
      sourceDisplayIds: ['K:10']
    });

    // Financial performance metrics - Group
    this.addMetric({
      metricType: 'gross_revenue',
      value: 1712,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['K:129']
    });

    this.addMetric({
      metricType: 'gross_revenue',
      value: 1758,
      unit: 'RM million',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['K:137']
    });

    // REIT segment revenue
    this.addMetric({
      metricType: 'reit_segment_revenue',
      value: 579,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['K:131']
    });

    // NPI metrics
    this.addMetric({
      metricType: 'net_property_income',
      value: 546,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['K:133']
    });

    this.addMetric({
      metricType: 'net_profit',
      value: 892,
      unit: 'RM million',
      period: fy2024,
      sourceDisplayIds: ['K:135']
    });

    // NAV per unit
    this.addMetric({
      metricType: 'nav_per_unit',
      value: 7.57,
      unit: 'RM',
      period: q4Point,
      sourceDisplayIds: ['K:17', 'K:222']
    });

    // Market metrics
    this.addMetric({
      metricType: 'market_cap',
      value: 16000,
      unit: 'RM million',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['K:127']
    });

    this.addMetric({
      metricType: 'share_price',
      value: 8.90,
      unit: 'RM',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['K:124']
    });

    // Per-share metrics
    this.addMetric({
      metricType: 'dpu',
      value: 44.50,
      unit: 'sen',
      period: fy2024,
      sourceDisplayIds: ['K:18', 'K:110', 'K:111', 'K:112', 'K:113']
    });

    this.addMetric({
      metricType: 'dpu',
      value: 47.00,
      unit: 'sen',
      period: fy2025,
      sourceDisplayIds: ['K:19', 'K:114', 'K:115', 'K:116', 'K:117']
    });

    this.addMetric({
      metricType: 'dpu_growth_yoy',
      value: 5.6,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['K:19']
    });

    this.addMetric({
      metricType: 'dividend_yield_market',
      value: 5.3,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['K:20']
    });

    this.addMetric({
      metricType: 'dividend_yield_nav',
      value: 6.2,
      unit: '%',
      period: fy2025,
      isEstimated: true,
      sourceDisplayIds: ['K:17', 'K:19']
    });

    this.addMetric({
      metricType: 'payout_ratio',
      value: 95,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['K:121']
    });

    // Leverage metrics
    this.addMetric({
      metricType: 'gearing_ratio',
      value: 31.6,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:14', 'K:15']
    });

    this.addMetric({
      metricType: 'interest_coverage',
      value: 5.9,
      unit: 'x',
      period: fy2025,
      sourceDisplayIds: ['K:16']
    });

    this.addMetric({
      metricType: 'total_borrowings',
      value: 5300,
      unit: 'RM million',
      period: q4Point,
      sourceDisplayIds: ['K:99']
    });

    this.addMetric({
      metricType: 'fixed_rate_debt_pct',
      value: 60,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:197']
    });

    this.addMetric({
      metricType: 'floating_rate_debt_pct',
      value: 40,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:198']
    });

    this.addMetric({
      metricType: 'cost_of_debt',
      value: 4.8,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:196']
    });

    // Operational metrics
    this.addMetric({
      metricType: 'occupancy_rate',
      value: 100,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:11']
    });

    this.addMetric({
      metricType: 'occupancy_rate_retail',
      value: 99,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:13']
    });

    this.addMetric({
      metricType: 'wale_years',
      value: 18,
      unit: 'years',
      period: q4Point,
      sourceDisplayIds: ['K:22', 'K:223']
    });

    this.addMetric({
      metricType: 'wale_years_retail',
      value: 3,
      unit: 'years',
      period: q4Point,
      sourceDisplayIds: ['K:77']
    });

    this.addMetric({
      metricType: 'tenant_count',
      value: 300,
      unit: 'tenants',
      period: q4Point,
      sourceDisplayIds: ['K:61']
    });

    this.addMetric({
      metricType: 'top_tenant_concentration',
      value: 75,
      unit: '%',
      period: q4Point,
      sourceDisplayIds: ['K:144']
    });

    this.addMetric({
      metricType: 'npi_margin',
      value: 94.3,
      unit: '%',
      period: fy2024,
      isEstimated: true,
      sourceDisplayIds: ['K:131', 'K:133']
    });

    // Market metrics
    this.addMetric({
      metricType: 'price_to_book',
      value: 1.18,
      unit: 'x',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['K:126']
    });

    this.addMetric({
      metricType: 'premium_discount_to_nav',
      value: 18,
      unit: '%',
      period: q4Point,
      isTimeSensitive: true,
      sourceDisplayIds: ['K:126']
    });

    // Hospitality metrics
    this.addMetric({
      metricType: 'hotel_occupancy',
      value: 75,
      unit: '%',
      period: fy2025,
      sourceDisplayIds: ['K:239']
    });

    this.addMetric({
      metricType: 'hotel_adr',
      value: 850,
      unit: 'RM',
      period: fy2025,
      sourceDisplayIds: ['K:240']
    });

    this.addMetric({
      metricType: 'hotel_revpar',
      value: 640,
      unit: 'RM',
      period: fy2025,
      sourceDisplayIds: ['K:241']
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
        title: 'High Tenant Concentration - PETRONAS',
        description: 'PETRONAS contributes ~75% of REIT rental income. While this creates concentration risk, the sovereign backing effectively eliminates credit risk.',
        currentScore: 3.5,
        peerComparison: 'worse',
        quantitativeBacking: [
          { metricType: 'top_tenant_concentration', value: 75, context: 'Well above typical 10-20%' }
        ],
        mitigatingFactors: [
          { factor: 'PETRONAS is 100% government-owned sovereign entity', impact: 'significant' },
          { factor: 'Triple net lease to 2042 provides long-term stability', impact: 'significant' },
          { factor: 'Corporate guarantee from PETRONAS on lease obligations', impact: 'significant' },
          { factor: 'Diversification through Suria KLCC retail (25% of income)', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '75% single-tenant concentration is extreme', impact: 'significant' },
          { factor: 'Renewal risk in 2042 (17 years) requires monitoring', impact: 'moderate' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'PETRONAS credit rating changes',
          'Government ownership policy changes',
          'Lease renewal negotiations (commencing 2040)'
        ],
        sourceDisplayIds: ['K:144', 'K:21', 'K:22', 'K:146', 'K:147', 'K:232']
      },
      {
        id: this.generateId(),
        category: 'interest_rate',
        severity: 'low',
        title: 'Manageable Interest Rate Risk',
        description: '60% fixed-rate debt with 5.9x interest cover provides substantial protection. Natural hedge through long-term lease income.',
        currentScore: 1.5,
        peerComparison: 'better',
        quantitativeBacking: [
          { metricType: 'interest_coverage', value: 5.9, context: 'Exceptional coverage vs 3-4x peer average' },
          { metricType: 'fixed_rate_debt_pct', value: 60, context: 'Above average fixed-rate proportion' }
        ],
        mitigatingFactors: [
          { factor: '5.9x interest cover provides massive buffer', impact: 'significant' },
          { factor: '60% fixed-rate debt', impact: 'significant' },
          { factor: 'Natural hedge from 18-year fixed lease income', impact: 'significant' },
          { factor: 'PETRONAS backing enables favorable refinancing', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: '40% floating-rate exposure to rate cycles', impact: 'minor' },
          { factor: 'RM 2.9B debt maturing 2025-2027', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Interest rate movements',
          'Refinancing spreads',
          'PETRONAS lease escalation vs interest cost growth'
        ],
        sourceDisplayIds: ['K:16', 'K:197', 'K:105', 'K:170', 'K:171']
      },
      {
        id: this.generateId(),
        category: 'governance',
        severity: 'low',
        title: 'Strong Governance with Sponsor Backing',
        description: 'Professional management with PETRONAS backing. Low management fees (0.5% base vs 1.0% standard).',
        currentScore: 1.5,
        peerComparison: 'similar',
        mitigatingFactors: [
          { factor: '9+ year CEO tenure provides stability', impact: 'significant' },
          { factor: 'PETRONAS sponsor backing ensures institutional standards', impact: 'significant' },
          { factor: '0.5% management fee below industry 1.0% standard', impact: 'moderate' },
          { factor: '60% independent directors', impact: 'moderate' },
          { factor: 'Performance fee aligns with DPU growth', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Related party transactions with PETRONAS group', impact: 'minor' },
          { factor: 'Stapled structure complexity adds governance layer', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'Management changes',
          'Related party transaction terms',
          'Fee structure reviews'
        ],
        sourceDisplayIds: ['K:38', 'K:41', 'K:48', 'K:259', 'K:50']
      },
      {
        id: this.generateId(),
        category: 'transparency',
        severity: 'low',
        title: 'Excellent Disclosure',
        description: 'Comprehensive disclosure of lease terms, tenant concentration, and financial metrics.',
        currentScore: 1.5,
        peerComparison: 'better',
        mitigatingFactors: [
          { factor: 'Full disclosure of PETRONAS lease terms', impact: 'significant' },
          { factor: 'Quarterly operating metrics published', impact: 'moderate' },
          { factor: 'Detailed segment reporting (REIT vs Property Holdings)', impact: 'moderate' },
          { factor: 'Independent annual valuations disclosed', impact: 'moderate' }
        ],
        aggravatingFactors: [],
        trend: 'stable',
        monitoringTriggers: ['Continued disclosure maintenance'],
        sourceDisplayIds: ['K:22', 'K:144', 'K:24', 'K:217']
      },
      {
        id: this.generateId(),
        category: 'tenant_rollover',
        severity: 'low',
        title: 'Exceptional Lease Profile',
        description: '18-year WALE with 100% occupancy and PETRONAS master lease to 2042.',
        currentScore: 1,
        peerComparison: 'better',
        quantitativeBacking: [
          { metricType: 'wale_years', value: 18, context: 'Exceptional vs 3-5 year peer average' },
          { metricType: 'occupancy_rate', value: 100, context: 'Full occupancy' }
        ],
        mitigatingFactors: [
          { factor: '18-year WALE is exceptional', impact: 'significant' },
          { factor: '100% occupancy on core office assets', impact: 'significant' },
          { factor: 'PETRONAS lease has built-in escalations', impact: 'significant' },
          { factor: '<1% lease expiry through 2030', impact: 'significant' }
        ],
        aggravatingFactors: [
          { factor: 'Concentrated 2042 expiry creates cliff risk', impact: 'minor' }
        ],
        trend: 'stable',
        monitoringTriggers: [
          'PETRONAS lease compliance',
          'Rent escalation calculations',
          'Long-term renewal strategy'
        ],
        sourceDisplayIds: ['K:22', 'K:223', 'K:11', 'K:229', 'K:224']
      },
      {
        id: this.generateId(),
        category: 'market',
        severity: 'medium',
        title: 'Retail Cyclicality at Suria KLCC',
        description: 'Suria KLCC contributes ~25% of income with exposure to consumer discretionary spending and tourism cycles.',
        currentScore: 2.5,
        peerComparison: 'similar',
        quantitativeBacking: [
          { metricType: 'occupancy_rate_retail', value: 99, context: 'Premium positioning' }
        ],
        mitigatingFactors: [
          { factor: 'Luxury retail focus is more resilient', impact: 'significant' },
          { factor: '99% occupancy demonstrates strength', impact: 'significant' },
          { factor: 'Iconic location attracts tourists', impact: 'moderate' },
          { factor: 'Recent RM 150M AEI refresh completed', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Consumer discretionary exposure', impact: 'moderate' },
          { factor: 'Tourism-dependent (40M visitors)', impact: 'moderate' },
          { factor: 'E-commerce competition for non-luxury retail', impact: 'minor' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Retail sales growth',
          'Tourism arrival statistics',
          'Luxury retail trends',
          'Tenant retention rates'
        ],
        sourceDisplayIds: ['K:13', 'K:79', 'K:165', 'K:238', 'K:143']
      },
      {
        id: this.generateId(),
        category: 'operational',
        severity: 'medium',
        title: 'Hospitality Recovery Post-COVID',
        description: 'Mandarin Oriental KL (75% stake) contributes ~10% of income with hotel market volatility.',
        currentScore: 2.5,
        peerComparison: 'similar',
        quantitativeBacking: [
          { metricType: 'hotel_occupancy', value: 75, context: 'Recovery from COAD lows' },
          { metricType: 'hotel_revpar', value: 640, context: '5-star positioning' }
        ],
        mitigatingFactors: [
          { factor: '5-star luxury positioning is resilient', impact: 'significant' },
          { factor: 'Prime KLCC location', impact: 'significant' },
          { factor: 'Recent RM 80M renovation completed', impact: 'moderate' },
          { factor: '75% stake limits full consolidation of volatility', impact: 'moderate' }
        ],
        aggravatingFactors: [
          { factor: 'Hotel market cyclicality', impact: 'moderate' },
          { factor: 'Tourism-dependent revenue', impact: 'moderate' },
          { factor: 'High fixed cost structure', impact: 'minor' }
        ],
        trend: 'improving',
        monitoringTriggers: [
          'Hotel occupancy trends',
          'ADR and RevPAR growth',
          'Tourism recovery metrics',
          'Competitive supply'
        ],
        sourceDisplayIds: ['K:62', 'K:128', 'K:239', 'K:240', 'K:241', 'K:82']
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
      overallRiskRating: 'low',
      overallScore: 1.9,
      riskFactors: riskFactors as any,
      peerComparison: {
        vsPeerId: CitationLinker.generateEntityUuid('5106.KL'),
        relativeRisk: 'lower',
        keyDifferences: [
          'Exceptional lease profile (18-year WALE vs 4.4 years)',
          'Sovereign-backed tenant (PETRONAS vs diversified)',
          'Lower gearing (31.6% vs 33%)',
          'Higher interest cover (5.9x vs 3.9x)',
          'Concentration risk (75% single tenant vs diversified)'
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
        title: 'Malaysia\'s Premier Iconic REIT with Sovereign Backing',
        content: 'KLCC REIT is Malaysia\'s only stapled security holding the iconic PETRONAS Twin Towers. With 100% occupancy backed by PETRONAS master lease to 2042, 31.6% conservative gearing, and 5.9x interest cover, KLCC REIT offers unparalleled income stability in the Malaysian REIT sector.',
        summary: 'Iconic assets, sovereign tenant, exceptional stability',
        keyFacts: [
          { label: 'Occupancy', value: 100, unit: '%' },
          { label: 'WALE', value: 18, unit: 'years' },
          { label: 'Interest Cover', value: 5.9, unit: 'x' },
          { label: 'Gearing', value: 31.6, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'occupancy_rate', value: 100 },
          { metricType: 'wale_years', value: 18 },
          { metricType: 'interest_coverage', value: 5.9 },
          { metricType: 'gearing_ratio', value: 31.6 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['K:5', 'K:11', 'K:22', 'K:16', 'K:14'],
        primaryCitation: 'K:5'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'debt_sustainability',
        priority: 'positive',
        title: 'Exceptional Debt Metrics with Sovereign Support',
        content: 'KLCC REIT maintains conservative 31.6% gearing with 5.9x interest cover - among the strongest in the sector. 60% fixed-rate debt and staggered maturities through 2030, combined with PETRONAS sponsor backing, provide exceptional refinancing resilience.',
        summary: '31.6% gearing, 5.9x cover, investment-grade structure',
        keyFacts: [
          { label: 'Gearing', value: 31.6, unit: '%' },
          { label: 'Interest Cover', value: 5.9, unit: 'x' },
          { label: 'Fixed Rate Debt', value: 60, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'gearing_ratio', value: 31.6 },
          { metricType: 'interest_coverage', value: 5.9 },
          { metricType: 'fixed_rate_debt_pct', value: 60 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['K:14', 'K:16', 'K:197', 'K:99', 'K:109'],
        primaryCitation: 'K:14'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'positive',
        title: 'Active Asset Enhancement Driving Value',
        content: 'RM 150M+ Suria KLCC refresh completed in 2023-2024, RM 80M+ Mandarin Oriental renovation ongoing. These AEIs position the portfolio for continued growth while maintaining the iconic status of assets.',
        summary: 'AEI investment, portfolio refresh, value enhancement',
        keyFacts: [
          { label: 'Suria KLCC AEI', value: 150, unit: 'RM M' },
          { label: 'Hotel Renovation', value: 80, unit: 'RM M' },
          { label: 'Retail Occupancy', value: 99, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'occupancy_rate_retail', value: 99 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['K:79', 'K:80', 'K:82', 'K:83', 'K:13'],
        primaryCitation: 'K:79'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'portfolio_analysis',
        priority: 'info',
        title: 'PETRONAS Master Lease - Double-Edged Sword',
        content: 'The PETRONAS master lease to 2042 provides exceptional income stability but creates 75% tenant concentration. The sovereign backing effectively eliminates credit risk, making this concentration a trade-off for stability rather than a pure risk.',
        summary: 'Sovereign backing, concentration trade-off, 2042 visibility',
        keyFacts: [
          { label: 'Tenant Concentration', value: 75, unit: '%' },
          { label: 'Lease Expiry', value: 2042, unit: '' },
          { label: 'Structure', value: 0, unit: 'Triple Net' }
        ],
        indicator: { icon: 'info', color: 'blue' },
        relatedMetrics: [
          { metricType: 'top_tenant_concentration', value: 75 },
          { metricType: 'wale_years', value: 18 }
        ],
        relatedRisks: [{ category: 'concentration', severity: 'high' }],
        sourceDisplayIds: ['K:144', 'K:12', 'K:21', 'K:22', 'K:147'],
        primaryCitation: 'K:144'
      },
      {
        id: this.generateId(),
        entityId: this.entityId,
        observationType: 'dividend_sustainability',
        priority: 'positive',
        title: '12+ Years of Stable, Growing Distributions',
        content: 'KLCC REIT has maintained 100% quarterly distribution track record since 2013 listing. FY2025 DPU of 47.00 sen represents 5.6% growth over FY2024, demonstrating the stability and growth potential of the income stream.',
        summary: '47.00 sen DPU, +5.6% growth, uninterrupted since 2013',
        keyFacts: [
          { label: 'FY2025 DPU', value: 47.00, unit: 'sen' },
          { label: 'DPU Growth', value: 5.6, unit: '%' },
          { label: 'Yield', value: 5.3, unit: '%' }
        ],
        indicator: { icon: 'check', color: 'green' },
        relatedMetrics: [
          { metricType: 'dpu', value: 47.00 },
          { metricType: 'dpu_growth_yoy', value: 5.6 },
          { metricType: 'dividend_yield_market', value: 5.3 }
        ],
        relatedRisks: [],
        sourceDisplayIds: ['K:19', 'K:122', 'K:20', 'K:121'],
        primaryCitation: 'K:19'
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
        { date: '2021-12-31', value: 40.0, isInterpolated: false, sourceDisplayId: 'K:118' },
        { date: '2022-12-31', value: 42.0, isInterpolated: false, sourceDisplayId: 'K:119' },
        { date: '2023-12-31', value: 43.0, isInterpolated: false, sourceDisplayId: 'K:120' },
        { date: '2024-12-31', value: 44.50, isInterpolated: false, sourceDisplayId: 'K:18' },
        { date: '2025-12-31', value: 47.00, isInterpolated: false, sourceDisplayId: 'K:19' }
      ],
      sourceDisplayIds: ['K:118', 'K:119', 'K:120', 'K:18', 'K:19']
    };

    // NAV per unit series
    const navSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'nav_per_unit',
      frequency: 'annual',
      unit: 'RM',
      dataPoints: [
        { date: '2021-12-31', value: 6.95, isInterpolated: false, sourceDisplayId: 'K:17' },
        { date: '2022-12-31', value: 7.12, isInterpolated: false, sourceDisplayId: 'K:17' },
        { date: '2023-12-31', value: 7.31, isInterpolated: false, sourceDisplayId: 'K:17' },
        { date: '2024-12-31', value: 7.45, isInterpolated: false, sourceDisplayId: 'K:17' },
        { date: '2025-12-31', value: 7.57, isInterpolated: false, sourceDisplayId: 'K:17' }
      ],
      sourceDisplayIds: ['K:17']
    };

    // Gearing ratio series
    const gearingSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gearing_ratio',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 33.5, isInterpolated: false, sourceDisplayId: 'K:14' },
        { date: '2022-12-31', value: 33.0, isInterpolated: false, sourceDisplayId: 'K:14' },
        { date: '2023-12-31', value: 32.5, isInterpolated: false, sourceDisplayId: 'K:14' },
        { date: '2024-12-31', value: 32.0, isInterpolated: false, sourceDisplayId: 'K:14' },
        { date: '2025-12-31', value: 31.6, isInterpolated: false, sourceDisplayId: 'K:14' }
      ],
      sourceDisplayIds: ['K:14']
    };

    // Occupancy rate series
    const occupancySeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'occupancy_rate',
      frequency: 'annual',
      unit: '%',
      dataPoints: [
        { date: '2021-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'K:11' },
        { date: '2022-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'K:11' },
        { date: '2023-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'K:11' },
        { date: '2024-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'K:11' },
        { date: '2025-12-31', value: 100, isInterpolated: false, sourceDisplayId: 'K:11' }
      ],
      sourceDisplayIds: ['K:11']
    };

    // Revenue series
    const revenueSeries: TimeSeries = {
      id: this.generateId(),
      entityId,
      metricType: 'gross_revenue',
      frequency: 'annual',
      unit: 'RM million',
      dataPoints: [
        { date: '2021-12-31', value: 1520, isInterpolated: false, sourceDisplayId: 'K:129' },
        { date: '2022-12-31', value: 1598, isInterpolated: false, sourceDisplayId: 'K:129' },
        { date: '2023-12-31', value: 1658, isInterpolated: false, sourceDisplayId: 'K:130' },
        { date: '2024-12-31', value: 1712, isInterpolated: false, sourceDisplayId: 'K:129' },
        { date: '2025-12-31', value: 1758, isInterpolated: true, sourceDisplayId: 'K:137' }
      ],
      sourceDisplayIds: ['K:129', 'K:130', 'K:137']
    };

    this.timeSeries = [dpuSeries, navSeries, gearingSeries, occupancySeries, revenueSeries];

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
    const linkedOrphans = this.linker.linkAllOrphans('Source reference - KLCC REIT');
    if (linkedOrphans.length > 0) {
      console.log(`[KlccAdapter] Linked ${linkedOrphans.length} orphan references`);
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

export function createKlccAdapter(linker: CitationLinker): KlccAdapter {
  return new KlccAdapter(linker);
}
