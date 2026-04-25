import type { Metric, MetricType, NormalizedReitData, Reference } from '@/types/frontend';

export type RiskLevel = 'low' | 'moderate' | 'moderate-high' | 'high';

export interface ResearchCitation {
  id: string;
  type: string;
  title: string;
  date: string;
  url?: string;
  fact: string;
}

export interface REIT {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  shariahCompliant: boolean;
  marketCap: number;
  sharePrice: number;
  dpu: number;
  yield: number;
  gearing: number;
  interestCover: number;
  occupancy: number;
  wale: number;
  navPerUnit: number;
  priceToBook: number;
  overallRisk: RiskLevel;
  citationCount: number;
  dpuHistory: number[];
  managerName: string;
  assessmentDate: string;
  citations: ResearchCitation[];
  raw: NormalizedReitData;
}

export const DEFAULT_ENTITY_CODES = [
  '5130.KL',
  '5106.KL',
  '5176.KL',
  '5212.KL',
  '5227.KL',
  '5235SS',
  '5180.KL',
  '5114.KL',
  '5121.KL',
  '5110.KL',
] as const;

export const DEFAULT_COMPARE_CODES = DEFAULT_ENTITY_CODES.slice(0, 4);

const ENTITY_CODE_ALIASES: Record<string, string> = {
  '5204.KL': '5212.KL',
  '5200.KL': '5110.KL',
  '5142.KL': '5114.KL',
  '5235.KL': '5235SS',
};

const SECTOR_OVERRIDES: Record<string, string> = {
  '5130.KL': 'Industrial',
  '5106.KL': 'Industrial',
  '5176.KL': 'Diversified',
  '5212.KL': 'Retail',
  '5227.KL': 'Retail',
  '5235SS': 'Diversified',
  '5180.KL': 'Retail',
  '5114.KL': 'Industrial',
  '5121.KL': 'Retail',
  '5110.KL': 'Commercial',
};

function metricSortValue(metric: Metric) {
  switch (metric.period.type) {
    case 'point_in_time':
      return Date.parse(metric.period.date ?? '1970-01-01');
    case 'fiscal_year':
      return Date.UTC(metric.period.fiscalYear ?? 0, 11, 31);
    case 'quarter':
      return Date.UTC(metric.period.fiscalYear ?? 0, ((metric.period.quarter ?? 1) * 3) - 1, 1);
    case 'trailing_twelve_months':
      return Date.parse(metric.period.date ?? '1970-01-01');
    default:
      return 0;
  }
}

function pickMetric(
  data: NormalizedReitData,
  metricType: MetricType,
  options: {
    excludeUnitIncludes?: string[];
  } = {},
) {
  const matches = data.metrics.filter((metric) => metric.metricType === metricType);
  const filtered = matches.filter(
    (metric) =>
      !options.excludeUnitIncludes?.some((needle) =>
        (metric.unit ?? '').toLowerCase().includes(needle.toLowerCase()),
      ),
  );

  const source = filtered.length > 0 ? filtered : matches;

  return [...source].sort((left, right) => metricSortValue(right) - metricSortValue(left))[0];
}

function normalizePercent(value: number) {
  return value <= 1 ? value * 100 : value;
}

function normalizeMarketCapMillions(value: number, unit?: string) {
  const normalizedUnit = (unit ?? '').toLowerCase();

  if (normalizedUnit.includes('million')) {
    return value;
  }

  if (value >= 1_000_000) {
    return value / 1_000_000;
  }

  return value;
}

function getMetricNumber(
  data: NormalizedReitData,
  metricType: MetricType,
  options: {
    excludeUnitIncludes?: string[];
    normalize?: (value: number, unit?: string) => number;
  } = {},
) {
  const metric = pickMetric(data, metricType, options);

  if (!metric || typeof metric.value !== 'number') {
    return null;
  }

  return options.normalize ? options.normalize(metric.value, metric.unit) : metric.value;
}

function getTimeSeriesValues(data: NormalizedReitData, metricType: MetricType, maxPoints = 5) {
  const series = data.timeSeries.find((timeSeries) => timeSeries.metricType === metricType);

  if (!series) {
    return [];
  }

  return [...series.dataPoints]
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date))
    .slice(-maxPoints)
    .map((point) => (typeof point.value === 'number' ? point.value : null))
    .filter((value): value is number => value !== null);
}

function mapRiskLevel(rating: NormalizedReitData['riskAssessment']['overallRiskRating']): RiskLevel {
  if (rating === 'moderate_high') {
    return 'moderate-high';
  }

  return rating;
}

function resolveSharePrice(data: NormalizedReitData, navPerUnit: number, priceToBook: number, dpu: number, yieldPct: number) {
  const directPrice = getMetricNumber(data, 'share_price');

  if (directPrice && directPrice > 0) {
    return directPrice;
  }

  if (navPerUnit > 0 && priceToBook > 0) {
    return navPerUnit * priceToBook;
  }

  if (dpu > 0 && yieldPct > 0) {
    return (dpu / 100) / (yieldPct / 100);
  }

  return 0;
}

function adaptReference(reference: Reference): ResearchCitation {
  return {
    id: reference.displayId,
    type: reference.source,
    title: reference.citation,
    date: reference.dateAccessed,
    url: reference.url,
    fact: reference.fact,
  };
}

export function resolveEntityCode(input: string) {
  const normalized = input.toUpperCase();
  return ENTITY_CODE_ALIASES[normalized] ?? normalized;
}

export function normalizeEntityCode(input?: string | null) {
  if (!input) {
    return '';
  }

  return resolveEntityCode(input);
}

export function normalizeEntityCodes(inputs: string[]) {
  const seen = new Set<string>();

  return inputs.reduce<string[]>((normalizedCodes, input) => {
    const normalizedCode = normalizeEntityCode(input);

    if (!normalizedCode || seen.has(normalizedCode)) {
      return normalizedCodes;
    }

    seen.add(normalizedCode);
    normalizedCodes.push(normalizedCode);
    return normalizedCodes;
  }, []);
}

export function formatDataDate(dateString?: string) {
  if (!dateString) {
    return 'N/A';
  }

  return new Date(dateString).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function adaptNormalizedReitData(data: NormalizedReitData): REIT {
  const ticker = resolveEntityCode(data.entity.code);
  const dpu = getMetricNumber(data, 'dpu') ?? getTimeSeriesValues(data, 'dpu').at(-1) ?? 0;
  const yieldPct =
    getMetricNumber(data, 'dividend_yield_market', {
      normalize: (value) => normalizePercent(value),
    }) ?? 0;
  const navPerUnit = getMetricNumber(data, 'nav_per_unit') ?? 0;
  const priceToBook =
    getMetricNumber(data, 'price_to_book') ??
    (navPerUnit > 0 ? resolveSharePrice(data, navPerUnit, 0, dpu, yieldPct) / navPerUnit : 0);
  const sharePrice = resolveSharePrice(data, navPerUnit, priceToBook, dpu, yieldPct);
  const gearing =
    getMetricNumber(data, 'gearing_ratio', {
      excludeUnitIncludes: ['unencumbered'],
      normalize: (value) => normalizePercent(value),
    }) ?? 0;
  const occupancy =
    getMetricNumber(data, 'occupancy_rate', {
      normalize: (value) => normalizePercent(value),
    }) ?? 0;
  const citations = [...data.references]
    .sort((left, right) => Date.parse(right.dateAccessed) - Date.parse(left.dateAccessed))
    .map(adaptReference);

  return {
    id: ticker,
    name: data.entity.name,
    ticker,
    sector: SECTOR_OVERRIDES[ticker] ?? data.entity.sector,
    shariahCompliant: data.entity.isShariahCompliant,
    marketCap:
      getMetricNumber(data, 'market_cap', {
        normalize: (value, unit) => normalizeMarketCapMillions(value, unit),
      }) ?? 0,
    sharePrice,
    dpu,
    yield: yieldPct,
    gearing,
    interestCover: getMetricNumber(data, 'interest_coverage') ?? 0,
    occupancy,
    wale: getMetricNumber(data, 'wale_years') ?? 0,
    navPerUnit,
    priceToBook,
    overallRisk: mapRiskLevel(data.riskAssessment.overallRiskRating),
    citationCount: new Set(citations.map((citation) => citation.id)).size,
    dpuHistory: getTimeSeriesValues(data, 'dpu'),
    managerName: data.entity.manager.name,
    assessmentDate: data.generatedAt,
    citations,
    raw: data,
  };
}

export function adaptReitData(data: NormalizedReitData) {
  return adaptNormalizedReitData(data);
}

export function adaptReitsData(datasets: NormalizedReitData[]) {
  return datasets.map(adaptNormalizedReitData);
}

export function getDefaultEntityCodes() {
  return [...DEFAULT_COMPARE_CODES];
}

export function getReitMetricSourceIds(
  reit: REIT,
  metricType: MetricType,
  options: {
    excludeUnitIncludes?: string[];
  } = {},
) {
  return pickMetric(reit.raw, metricType, options)?.sourceDisplayIds ?? [];
}
