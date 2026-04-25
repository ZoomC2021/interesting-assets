/**
 * Frontend-specific TypeScript types
 * Adapted from Milestone 1 schema for UI consumption
 */

// ============================================================================
// Entity Types
// ============================================================================

export interface Entity {
  id: string;
  code: string;
  name: string;
  exchange: string;
  sector: string;
  currency: string;
  isShariahCompliant: boolean;
  listingDate?: string;
  manager: {
    name: string;
    ownershipStructure?: string;
    controllingShareholder?: string;
  };
  trustee: string;
  fiscalYearEnd: {
    month: number;
    day: number;
  };
  references: string[];
}

export interface GeographicDistribution {
  region: string;
  propertyCount: number;
  percentageOfPortfolio: number;
  totalValuationRM?: number;
  totalNlaSqFt?: number;
}

export interface EntityExtended extends Entity {
  portfolio: {
    totalProperties: number;
    totalAssetsRM: number;
    investmentPropertiesRM: number;
    netLettableAreaSqFt?: number;
    geographicDistribution: GeographicDistribution[];
  };
}

// ============================================================================
// Metric Types
// ============================================================================

export type MetricType =
  | 'portfolio_size'
  | 'total_assets'
  | 'investment_properties'
  | 'property_count'
  | 'net_lettable_area'
  | 'geographic_concentration'
  | 'gross_revenue'
  | 'net_property_income'
  | 'realised_income'
  | 'net_profit'
  | 'nav_per_unit'
  | 'market_cap'
  | 'share_price'
  | 'dpu'
  | 'dpu_growth_yoy'
  | 'dividend_yield_market'
  | 'dividend_yield_nav'
  | 'payout_ratio'
  | 'gearing_ratio'
  | 'interest_coverage'
  | 'total_borrowings'
  | 'fixed_rate_debt_pct'
  | 'floating_rate_debt_pct'
  | 'wacd'
  | 'occupancy_rate'
  | 'wale_years'
  | 'tenant_count'
  | 'top_tenant_concentration'
  | 'rental_reversion'
  | 'lease_renewal_rate'
  | 'npi_margin'
  | 'tenant_risk_rating'
  | 'interest_rate_sensitivity'
  | 'refinancing_risk'
  | 'gearing_headroom'
  | 'revenue_australia_pct'
  | 'revenue_malaysia_pct'
  | 'revenue_japan_pct'
  | 'revenue_australia'
  | 'revenue_malaysia'
  | 'revenue_japan'
  | 'reit_segment_revenue'
  | 'cost_of_debt'
  | 'occupancy_rate_retail'
  | 'wale_years_retail'
  | 'hotel_occupancy'
  | 'hotel_adr'
  | 'hotel_revpar'
  | 'price_to_book'
  | 'premium_discount_to_nav';

export type MetricCategory =
  | 'portfolio'
  | 'financial_performance'
  | 'per_share'
  | 'leverage'
  | 'operational'
  | 'risk'
  | 'market';

export type MetricFormat =
  | 'number'
  | 'percentage'
  | 'currency'
  | 'ratio'
  | 'years'
  | 'count'
  | 'boolean'
  | 'string';

export interface Metric {
  id: string;
  metricType: MetricType;
  value: number | string | boolean | null;
  unit?: string;
  period: {
    type: 'point_in_time' | 'fiscal_year' | 'quarter' | 'trailing_twelve_months';
    fiscalYear?: number;
    quarter?: number;
    date?: string;
  };
  isEstimated: boolean;
  isTimeSensitive: boolean;
  sourceDisplayIds: string[];
}

export interface MetricDefinition {
  type: MetricType;
  category: MetricCategory;
  displayName: string;
  description: string;
  unit: string;
  format: MetricFormat;
  isHigherBetter: boolean | null;
  benchmarkRange?: {
    min?: number;
    max?: number;
    typical?: number;
  };
  relatedMetricTypes?: MetricType[];
}

// ============================================================================
// Reference Types
// ============================================================================

export interface Reference {
  id: string;
  displayId: string;
  fact: string;
  source: string;
  citation: string;
  url?: string;
  dateAccessed: string;
  timeSensitive: boolean;
  entityId: string;
}

// ============================================================================
// TimeSeries Types
// ============================================================================

export interface TimeSeriesPoint {
  date: string;
  value: number | string | boolean | null;
  isInterpolated: boolean;
  sourceDisplayId?: string;
}

export interface TimeSeries {
  id: string;
  entityId: string;
  metricType: MetricType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  unit: string;
  dataPoints: TimeSeriesPoint[];
  sourceDisplayIds: string[];
  metadata?: {
    startDate: string;
    endDate: string;
    pointCount: number;
  };
}

// ============================================================================
// Risk Types
// ============================================================================

export type RiskCategory =
  | 'concentration'
  | 'gearing'
  | 'interest_rate'
  | 'tenant_rollover'
  | 'liquidity'
  | 'transparency'
  | 'geographic'
  | 'counterparty'
  | 'governance'
  | 'market'
  | 'operational';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type OverallRiskRating = 'low' | 'moderate' | 'moderate_high' | 'high';

export interface RiskFactor {
  category: RiskCategory;
  severity: RiskSeverity;
  title?: string;
  description: string;
  currentScore?: number;
  benchmarkScore?: number;
  peerComparison?: 'better' | 'similar' | 'worse';
  quantitativeBacking?: Array<{
    metricType: string;
    value: number | string;
    context: string;
  }>;
  mitigatingFactors: Array<{
    factor: string;
    impact: 'significant' | 'moderate' | 'minor';
  }>;
  aggravatingFactors: Array<{
    factor: string;
    impact: 'significant' | 'moderate' | 'minor';
  }>;
  trend?: 'improving' | 'stable' | 'deteriorating' | 'unknown';
  monitoringTriggers?: string[];
  relatedMetricTypes?: MetricType[];
  sourceDisplayIds: string[];
}

export interface RiskAssessment {
  id: string;
  entityId: string;
  assessmentDate: string;
  overallRiskRating: OverallRiskRating;
  overallScore?: number;
  riskFactors: RiskFactor[];
  peerComparison?: {
    vsPeerId: string;
    relativeRisk: 'lower' | 'similar' | 'higher';
    keyDifferences: string[];
  };
}

// ============================================================================
// Observation Types
// ============================================================================

export type ObservationType =
  | 'executive_summary'
  | 'portfolio_analysis'
  | 'financial_performance'
  | 'debt_sustainability'
  | 'dividend_sustainability'
  | 'risk_assessment'
  | 'peer_comparison'
  | 'market_context'
  | 'management_assessment'
  | 'industry_benchmark'
  | 'governance'
  | 'tenant_analysis';

export type ObservationPriority = 'info' | 'positive' | 'warning' | 'critical';

export interface Observation {
  id: string;
  observationType: ObservationType;
  title?: string;
  content: string;
  summary?: string;
  priority: ObservationPriority;
  keyFacts?: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  indicator?: {
    icon: string;
    color: string;
    badge?: string;
  };
  relatedMetrics?: Array<{
    metricType: string;
    value?: string | number;
    context?: string;
  }>;
  relatedRisks?: Array<{
    category: string;
    severity?: string;
  }>;
  primaryCitation?: string;
  relatedMetricTypes?: MetricType[];
  sourceDisplayIds: string[];
}

// ============================================================================
// Normalized Data Container
// ============================================================================

export interface NormalizedReitData {
  schemaVersion: string;
  generatedAt: string;
  entity: Entity;
  references: Reference[];
  metrics: Metric[];
  timeSeries: TimeSeries[];
  riskAssessment: RiskAssessment;
  observations: Observation[];
}

// ============================================================================
// UI Types
// ============================================================================

export interface ComparisonState {
  selectedEntityIds: string[];
  activeMetricCategory: MetricCategory | 'all';
  citationPanelOpen: boolean;
  selectedCitationIds: string[];
}

export interface EntityComparison {
  entity: EntityExtended;
  metrics: Metric[];
  timeSeries: TimeSeries[];
  riskAssessment: RiskAssessment;
}
