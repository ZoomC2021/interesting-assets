'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { AnalysisMarkdown } from '@/components/AnalysisMarkdown';
import { CitationPanel } from '@/components/CitationPanel';
import { DpuTrendChart } from '@/components/DpuTrendChart';
import { KpiGrid } from '@/components/KpiGrid';
import { RiskMatrix } from '@/components/RiskMatrix';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { useEntityData } from '@/hooks/useEntityData';
import { SOURCE_GROUPS, groupReferencesBySource, type SourceGroupType } from '@/lib/citation-utils';
import { METRIC_REGISTRY } from '@/lib/data-utils';
import { formatMetricValue } from '@/lib/formatters';
import type {
  MetricType,
  NormalizedReitData,
  Observation,
  ObservationPriority,
  ObservationType,
  OverallRiskRating,
  Reference,
  RiskFactor,
  RiskSeverity,
} from '@/types/frontend';

interface EntityDetailClientProps {
  entityId: string;
  analysisMarkdown?: string | null;
}

const observationLabels: Partial<Record<ObservationType, string>> = {
  executive_summary: 'Executive summary',
  portfolio_analysis: 'Portfolio',
  financial_performance: 'Financial performance',
  debt_sustainability: 'Debt sustainability',
  dividend_sustainability: 'Dividend sustainability',
  risk_assessment: 'Risk assessment',
  peer_comparison: 'Peer comparison',
  market_context: 'Market context',
  management_assessment: 'Management',
  industry_benchmark: 'Benchmark',
  governance: 'Governance',
  tenant_analysis: 'Tenant analysis',
};

const observationPriorityTone: Record<ObservationPriority, string> = {
  positive: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  critical: 'bg-danger-100 text-danger-700',
  info: 'bg-primary-100 text-primary-700',
};

const riskSeverityTone: Record<RiskSeverity, string> = {
  low: 'bg-success-100 text-success-700',
  medium: 'bg-warning-100 text-warning-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-danger-100 text-danger-700',
};

const overallRiskTone: Record<OverallRiskRating, string> = {
  low: 'bg-success-100 text-success-700',
  moderate: 'bg-warning-100 text-warning-700',
  moderate_high: 'bg-orange-100 text-orange-700',
  high: 'bg-danger-100 text-danger-700',
};

const observationOrder: Record<ObservationType, number> = {
  executive_summary: 0,
  management_assessment: 1,
  portfolio_analysis: 2,
  financial_performance: 3,
  debt_sustainability: 4,
  dividend_sustainability: 5,
  risk_assessment: 6,
  governance: 7,
  tenant_analysis: 8,
  peer_comparison: 9,
  market_context: 10,
  industry_benchmark: 11,
};

const riskSeverityRank: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getMetric(entity: NormalizedReitData, metricType: MetricType) {
  return entity.metrics.find((metric) => metric.metricType === metricType);
}

function formatEntityMetric(entity: NormalizedReitData, metricType: MetricType): string {
  const metric = getMetric(entity, metricType);
  const definition = METRIC_REGISTRY[metricType];

  if (!metric) {
    return 'N/A';
  }

  return formatMetricValue(metric.value, definition.format, metric.unit || definition.unit);
}

function formatOverallRiskLabel(rating: OverallRiskRating): string {
  return rating
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function EntityDetailClient({ entityId, analysisMarkdown }: EntityDetailClientProps) {
  const router = useRouter();

  const { data, isLoading, error } = useEntityData([entityId]);
  const [citationOpen, setCitationOpen] = useState(false);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  const { announce, liveRegionProps } = useAnnouncer();

  const entity = data[0];

  const groupedCitations = useMemo(() => {
    if (!entity) {
      return new Map<SourceGroupType, Reference[]>();
    }

    return groupReferencesBySource(entity.references);
  }, [entity]);

  const allCitationIds = useMemo(() => {
    if (!entity) {
      return [];
    }

    return Array.from(new Set(entity.references.map((reference) => reference.displayId)));
  }, [entity]);

  const observations = useMemo(() => {
    if (!entity) {
      return [];
    }

    return [...entity.observations].sort((left, right) => {
      const leftRank = observationOrder[left.observationType] ?? 99;
      const rightRank = observationOrder[right.observationType] ?? 99;
      return leftRank - rightRank;
    });
  }, [entity]);

  const primaryObservation = observations.find(
    (observation) => observation.observationType === 'executive_summary',
  ) ?? observations[0];

  const topRisks = useMemo(() => {
    if (!entity) {
      return [];
    }

    return [...entity.riskAssessment.riskFactors]
      .sort((left, right) => {
        const severityGap = riskSeverityRank[left.severity] - riskSeverityRank[right.severity];
        if (severityGap !== 0) {
          return severityGap;
        }

        return left.category.localeCompare(right.category);
      })
      .slice(0, 4);
  }, [entity]);

  const summaryMetrics = useMemo(() => {
    if (!entity) {
      return [];
    }

    return [
      {
        label: 'Portfolio scale',
        value: formatEntityMetric(entity, 'total_assets'),
        detail: `${formatEntityMetric(entity, 'property_count')} properties`,
      },
      {
        label: 'Distribution',
        value: formatEntityMetric(entity, 'dpu'),
        detail: `Yield ${formatEntityMetric(entity, 'dividend_yield_market')}`,
      },
      {
        label: 'Occupancy',
        value: formatEntityMetric(entity, 'occupancy_rate'),
        detail: `WALE ${formatEntityMetric(entity, 'wale_years')}`,
      },
      {
        label: 'Balance sheet',
        value: formatEntityMetric(entity, 'gearing_ratio'),
        detail: `IC ${formatEntityMetric(entity, 'interest_coverage')}`,
      },
    ];
  }, [entity]);

  const thesisMetrics = useMemo(() => {
    if (!entity) {
      return [];
    }

    return [
      {
        label: 'Current yield',
        value: formatEntityMetric(entity, 'dividend_yield_market'),
      },
      {
        label: 'Occupancy',
        value: formatEntityMetric(entity, 'occupancy_rate'),
      },
      {
        label: 'WALE',
        value: formatEntityMetric(entity, 'wale_years'),
      },
      {
        label: 'Overall risk',
        value: formatOverallRiskLabel(entity.riskAssessment.overallRiskRating),
      },
    ];
  }, [entity]);

  const handleMetricClick = (citationIds: string[]) => {
    setSelectedCitationIds(citationIds);
    setCitationOpen(true);
    announce(`Citation panel opened with ${citationIds.length} sources`, 'polite');
  };

  const handleCloseCitation = () => {
    setCitationOpen(false);
    setSelectedCitationIds([]);
    announce('Citation panel closed', 'polite');
  };

  const openCitationIds = (citationIds: string[]) => {
    if (citationIds.length === 0) {
      return;
    }

    setSelectedCitationIds(citationIds);
    setCitationOpen(true);
    announce(`Citation panel opened with ${citationIds.length} sources`, 'polite');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-label="Loading" />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger-600 mb-4">{error || 'Entity not found'}</p>
          <button
            onClick={() => router.push('/compare')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Comparison
          </button>
        </div>
      </div>
    );
  }

  const cardShell = 'rounded-[1.5rem] border border-stroke bg-surface shadow-card';
  const cardTitle = 'text-body-sm font-semibold text-ink';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.9),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef5ff_32%,_#f8fafc_100%)]">
      <div {...liveRegionProps.polite} />
      <div {...liveRegionProps.assertive} />

      <header className="sticky top-0 z-30 border-b border-stroke/80 bg-surface/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex min-h-14 items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => router.push('/compare')}
                className="shrink-0 rounded-full border border-stroke bg-surface p-2 text-muted transition-colors hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Go back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="min-w-0">
                <p className="text-label text-primary-700">Research dossier</p>
                <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <h1 className="truncate text-body font-semibold text-ink">{entity.entity.name}</h1>
                  <span className="font-mono text-micro text-muted">{entity.entity.code}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => openCitationIds(allCitationIds)}
                className="hidden rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-body-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 sm:inline-flex"
              >
                Open sources
              </button>

              <span className="rounded-full bg-surfaceAlt px-2 py-1 text-micro text-muted">
                {entity.entity.exchange}
              </span>
              {entity.entity.isShariahCompliant && (
                <span
                  className="rounded-full bg-success-100 px-2 py-1 text-micro text-success-700"
                  title="Shariah compliant"
                >
                  Shariah
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-stroke bg-gradient-to-br from-surface via-primary-50/80 to-success-50/70 shadow-elevated">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.15),_transparent_45%)]" />
          <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1.45fr)_22rem] lg:p-8">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-label text-primary-700">
                  Single-REIT thesis
                </span>
                <span className="rounded-full border border-stroke bg-surface/80 px-3 py-1 text-label text-muted">
                  {entity.entity.sector}
                </span>
                <span className="rounded-full border border-stroke bg-surface/80 px-3 py-1 text-label text-muted">
                  {allCitationIds.length} cited facts
                </span>
              </div>

              <h2 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {entity.entity.name} should read like a research memo, not just a dashboard.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-700 sm:text-lg">
                {primaryObservation?.content ||
                  `${entity.entity.name} now has a thesis-first detail page that keeps the narrative front and center while leaving the full evidence stack close at hand.`}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#thesis"
                  className="inline-flex rounded-full bg-primary-700 px-4 py-2 text-body font-medium text-white transition-colors hover:bg-primary-800"
                >
                  Read the thesis
                </a>
                <a
                  href="#data-room"
                  className="inline-flex rounded-full border border-stroke bg-surface px-4 py-2 text-body font-medium text-ink transition-colors hover:bg-surfaceAlt"
                >
                  Jump to data room
                </a>
                <button
                  onClick={() => openCitationIds(allCitationIds)}
                  className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-body font-medium text-primary-700 transition-colors hover:bg-primary-100"
                >
                  Browse all sources
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.25rem] border border-white/70 bg-white/75 p-4 backdrop-blur"
                  >
                    <p className="text-label text-muted">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{metric.value}</p>
                    <p className="mt-2 text-body-sm leading-5 text-muted">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label text-muted">Current posture</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">At a glance</h3>
                </div>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-label',
                    overallRiskTone[entity.riskAssessment.overallRiskRating],
                  ].join(' ')}
                >
                  {formatOverallRiskLabel(entity.riskAssessment.overallRiskRating)} risk
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {thesisMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-stroke bg-surface/80 p-3">
                    <p className="text-label text-muted">{metric.label}</p>
                    <p className="mt-1 text-metric text-ink">{metric.value}</p>
                  </div>
                ))}
              </div>

              {primaryObservation?.summary && (
                <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/80 p-4">
                  <p className="text-label text-primary-700">Thesis in one line</p>
                  <p className="mt-2 text-body leading-6 text-neutral-700">{primaryObservation.summary}</p>
                </div>
              )}
            </aside>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <section id="thesis" className={cardShell}>
              <div className="border-b border-stroke px-5 py-5 sm:px-6">
                <p className="text-label text-primary-700">Investment thesis</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  The research view, distilled into a few key calls.
                </h3>
                <p className="mt-2 max-w-3xl text-body leading-6 text-muted">
                  These are the highest-signal observations pulled from the normalized dataset, each tied back to citations so the narrative never floats away from evidence.
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:p-6">
                {observations.map((observation: Observation) => (
                  <article
                    key={observation.id}
                    className="rounded-[1.5rem] border border-stroke bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(239,246,255,0.45))] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-stroke bg-surface px-3 py-1 text-label text-muted">
                            {observationLabels[observation.observationType] || observation.observationType}
                          </span>
                          <span
                            className={[
                              'rounded-full px-3 py-1 text-label capitalize',
                              observationPriorityTone[observation.priority],
                            ].join(' ')}
                          >
                            {observation.priority}
                          </span>
                        </div>
                        <h4 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                          {observation.title || observation.summary || observationLabels[observation.observationType]}
                        </h4>
                      </div>

                      <button
                        onClick={() => openCitationIds(observation.sourceDisplayIds)}
                        className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-body-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
                      >
                        View sources
                      </button>
                    </div>

                    <p className="mt-4 text-[15px] leading-7 text-neutral-700">{observation.content}</p>

                    {observation.keyFacts && observation.keyFacts.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {observation.keyFacts.map((fact) => (
                          <div
                            key={`${observation.id}-${fact.label}`}
                            className="rounded-full border border-stroke bg-surface px-3 py-2 text-body-sm text-ink"
                          >
                            <span className="text-muted">{fact.label}:</span>{' '}
                            <span className="font-medium">
                              {fact.value}
                              {fact.unit ? ` ${fact.unit}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className={cardShell}>
              <div className="border-b border-stroke px-5 py-5 sm:px-6">
                <p className="text-label text-primary-700">Full memo</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  Read the long-form thesis.
                </h3>
                <p className="mt-2 max-w-3xl text-body leading-6 text-muted">
                  For covered names, the original markdown research note now lives inside the detail page instead of sitting outside the product.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                {analysisMarkdown ? (
                  <AnalysisMarkdown markdown={analysisMarkdown} />
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-stroke bg-surfaceAlt/60 p-6">
                    <p className="text-body text-ink">No checked-in markdown memo yet for {entity.entity.name}.</p>
                    <p className="mt-2 text-body-sm leading-6 text-muted">
                      The structured observations and data room still cover the current case, but this is the spot to surface the full write-up once one exists.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section id="data-room" className={cardShell}>
              <div className="border-b border-stroke px-5 py-5 sm:px-6">
                <p className="text-label text-primary-700">Supporting evidence</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Data room</h3>
                <p className="mt-2 max-w-3xl text-body leading-6 text-muted">
                  The numbers are still here, just arranged as supporting evidence instead of forcing the whole page into dashboard mode.
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                  <h4 className={cardTitle}>DPU trend</h4>
                  <div className="mt-3 min-h-0">
                    <DpuTrendChart entities={data} />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                  <h4 className={cardTitle}>Risk profile</h4>
                  <div className="mt-3 min-h-0">
                    <RiskMatrix entities={data} onCitationClick={handleMetricClick} embedInPanel />
                  </div>
                </div>
              </div>

              <details className="border-t border-stroke">
                <summary className="cursor-pointer list-none px-5 py-4 text-body font-medium text-ink transition-colors hover:bg-surfaceAlt/50 sm:px-6">
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Open full metric table
                  </span>
                </summary>
                <div className="px-3 pb-5 sm:px-4 sm:pb-6">
                  <KpiGrid entities={data} category="all" onMetricClick={handleMetricClick} />
                </div>
              </details>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className={cardShell + ' p-5'}>
              <p className="text-label text-primary-700">What to watch</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Key monitored risks</h3>
              <div className="mt-4 space-y-3">
                {topRisks.map((risk: RiskFactor) => (
                  <article key={`${risk.category}-${risk.title}`} className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-body font-semibold text-ink">{risk.title || risk.category}</h4>
                        <p className="mt-2 text-body-sm leading-6 text-muted">{risk.description}</p>
                      </div>
                      <span
                        className={[
                          'rounded-full px-2.5 py-1 text-label capitalize',
                          riskSeverityTone[risk.severity],
                        ].join(' ')}
                      >
                        {risk.severity}
                      </span>
                    </div>

                    {risk.monitoringTriggers && risk.monitoringTriggers.length > 0 && (
                      <ul className="mt-3 space-y-1 text-body-sm leading-5 text-muted">
                        {risk.monitoringTriggers.slice(0, 2).map((trigger) => (
                          <li key={trigger}>• {trigger}</li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={() => openCitationIds(risk.sourceDisplayIds)}
                      className="mt-4 rounded-full border border-stroke bg-surface px-3 py-1.5 text-body-sm font-medium text-ink transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                      Sources
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className={cardShell + ' p-5'}>
              <p className="text-label text-primary-700">Management</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Operating setup</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                  <p className="text-label text-muted">REIT manager</p>
                  <p className="mt-2 text-body font-medium text-ink">{entity.entity.manager.name}</p>
                </div>
                <div className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                  <p className="text-label text-muted">Trustee</p>
                  <p className="mt-2 text-body font-medium text-ink">{entity.entity.trustee}</p>
                </div>
                {entity.entity.manager.ownershipStructure && (
                  <div className="rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 p-4">
                    <p className="text-label text-muted">Ownership structure</p>
                    <p className="mt-2 text-body leading-6 text-ink">{entity.entity.manager.ownershipStructure}</p>
                  </div>
                )}
              </div>
            </section>

            <section className={cardShell + ' p-5'}>
              <p className="text-label text-primary-700">Source coverage</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Open evidence by source type</h3>
              <div className="mt-4 space-y-2">
                {(Object.keys(SOURCE_GROUPS) as SourceGroupType[]).map((type) => {
                  const references = groupedCitations.get(type) || [];
                  if (references.length === 0) {
                    return null;
                  }

                  return (
                    <button
                      key={type}
                      onClick={() => openCitationIds(references.map((reference) => reference.displayId))}
                      className="flex w-full items-center justify-between rounded-[1.25rem] border border-stroke bg-surfaceAlt/40 px-4 py-3 text-left transition-colors hover:bg-primary-50"
                    >
                      <span>
                        <span className="block text-body font-medium text-ink">{SOURCE_GROUPS[type].label}</span>
                        <span className="mt-1 block text-body-sm text-muted">{SOURCE_GROUPS[type].description}</span>
                      </span>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-label text-muted">
                        {references.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <CitationPanel
        isOpen={citationOpen}
        onClose={handleCloseCitation}
        citationIds={selectedCitationIds.length > 0 ? selectedCitationIds : allCitationIds}
        entities={data}
      />
    </div>
  );
}
