'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adaptReitData, type REIT } from '@/data/reits';
import { useEntityData } from '@/hooks/useEntityData';
import { extractMemoOutline, type MemoOutlineEntry } from '@/lib/memo-outline';
import type { GeographicDistribution } from '@/types/frontend';
import { Callout } from '../Callout';
import { CitationChip } from '../CitationChip';
import { CitationPanel } from '../CitationPanel';
import { Figure } from '../Figure';
import { KpiGrid } from '@/components/KpiGrid';
import { MemoMarkdown } from '../MemoMarkdown';
import { RiskChip } from '../RiskChip';
import { SectionHeader } from '../SectionHeader';
import { Sparkline } from '../Sparkline';
import { ArrowLeft, ArrowUp, ArrowUpRight, ArrowDownRight, ChevronRight, Download, Share, Check } from '../icons';

// Must stay aligned with the <section id="..."> elements rendered in the
// placeholder-fallback branch below, otherwise outline links will scroll
// nowhere when no markdown memo exists yet.
const FALLBACK_SECTIONS: MemoOutlineEntry[] = [
  { id: 'executive-summary', label: 'Executive Summary' },
  { id: 'company-overview', label: 'Company Overview' },
  { id: 'financials', label: 'Financial Performance' },
  { id: 'debt', label: 'Debt Sustainability' },
  { id: 'thesis', label: 'Outlook & Thesis' },
];

interface EntityPageProps {
  ticker: string;
  analysisMarkdown?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDisplayDate(date?: string) {
  if (!date) {
    return 'Unavailable';
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unavailable';
  }

  return dateFormatter.format(parsedDate);
}

export function EntityPage({ ticker, analysisMarkdown }: EntityPageProps) {
  const { data, isLoading, error } = useEntityData([ticker]);
  const reit = useMemo(() => (data[0] ? adaptReitData(data[0]) : null), [data]);

  const outlineSections = useMemo<MemoOutlineEntry[]>(() => {
    if (!analysisMarkdown) {
      return FALLBACK_SECTIONS;
    }
    const extracted = extractMemoOutline(analysisMarkdown);
    return extracted.length > 0 ? extracted : FALLBACK_SECTIONS;
  }, [analysisMarkdown]);

  const [activeTab, setActiveTab] = useState<'memo' | 'data-room'>('memo');
  const [activeSection, setActiveSection] = useState(outlineSections[0]?.id ?? '');
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [selectedCitationIds, setSelectedCitationIds] = useState<string[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [downloadFeedback, setDownloadFeedback] = useState<'idle' | 'downloaded'>('idle');
  const discountToNav = reit && reit.navPerUnit > 0
    ? Math.max(0, ((reit.navPerUnit - reit.sharePrice) / reit.navPerUnit) * 100)
    : 0;

  const allCitationIds = useMemo(
    () => (reit ? reit.citations.map((c) => c.id) : []),
    [reit],
  );

  const handleMetricClick = useCallback((citationIds: string[]) => {
    if (citationIds.length === 0) return;
    setSelectedCitationIds(citationIds);
    setActiveCitationId(null);
    setCitationPanelOpen(true);
  }, []);

  useEffect(() => {
    setActiveSection((current) =>
      outlineSections.some((section) => section.id === current)
        ? current
        : outlineSections[0]?.id ?? '',
    );
  }, [outlineSections]);

  // Cache section element references to avoid DOM queries on every scroll
  const sectionElementsRef = React.useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // Update cached references when outlineSections change
    sectionElementsRef.current = outlineSections.map(
      (section) => document.getElementById(section.id) as HTMLElement | null
    );
  }, [outlineSections]);

  useEffect(() => {
    // Get element position relative to document (handles sticky ancestors correctly)
    const getElementOffsetTop = (element: HTMLElement | null): number => {
      if (!element) return 0;
      // Use getBoundingClientRect for accurate position relative to viewport,
      // then add scroll position to get document-relative position
      return element.getBoundingClientRect().top + window.scrollY;
    };

    const handleScroll = () => {
      // Sticky chrome takes ~104px (48px global nav + ~56px sub-header); bias
      // the scrollspy trigger a little below the sub-header so the active entry
      // updates the moment a heading crosses into the reading area.
      const scrollPosition = window.scrollY + 140;

      for (let index = sectionElementsRef.current.length - 1; index >= 0; index -= 1) {
        const element = sectionElementsRef.current[index];
        const offsetTop = getElementOffsetTop(element);
        if (element && offsetTop <= scrollPosition) {
          setActiveSection(outlineSections[index].id);
          break;
        }
      }

      setShowBackToTop(window.scrollY > 480);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [outlineSections]);

  const handleCitationClick = (id: string) => {
    setActiveCitationId(id);
    setSelectedCitationIds([id]);
    setCitationPanelOpen(true);
  };

  // ============================================================================
  // Share & Download Handlers (must be before any conditional returns)
  // ============================================================================

  const handleShare = useCallback(async () => {
    if (!reit) return;

    const shareData = {
      title: `${reit.name} (${reit.ticker}) - REIT Analysis`,
      text: `Check out ${reit.name} trading at RM ${reit.sharePrice.toFixed(2)} with ${reit.yield.toFixed(1)}% yield`,
      url: window.location.href,
    };

    // Try Web Share API first
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShareFeedback('shared');
        setTimeout(() => setShareFeedback('idle'), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if (err instanceof Error && err.name === 'AbortError') {
          return; // User cancelled, don't show error
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback('copied');
      setTimeout(() => setShareFeedback('idle'), 2000);
    } catch {
      // Clipboard failed silently - no feedback needed
    }
  }, [reit]);

  const handleDownload = useCallback(() => {
    if (!reit) return;

    const snapshot = {
      exportedAt: new Date().toISOString(),
      entity: {
        ticker: reit.ticker,
        name: reit.name,
        sector: reit.sector,
        managerName: reit.managerName,
        shariahCompliant: reit.shariahCompliant,
      },
      metrics: {
        sharePrice: reit.sharePrice,
        navPerUnit: reit.navPerUnit,
        priceToBook: reit.priceToBook,
        dpu: reit.dpu,
        yield: reit.yield,
        gearing: reit.gearing,
        interestCover: reit.interestCover,
        occupancy: reit.occupancy,
        wale: reit.wale,
        marketCap: reit.marketCap,
      },
      raw: reit.raw,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reit.ticker.replace('.', '_')}_snapshot_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadFeedback('downloaded');
    setTimeout(() => setDownloadFeedback('idle'), 2000);
  }, [reit]);

  // ============================================================================
  // Price Change Calculation (must be before any conditional returns)
  // ============================================================================

  const priceChange = useMemo(() => {
    if (!reit?.raw?.timeSeries) return null;

    const sharePriceSeries = reit.raw.timeSeries.find(ts => ts.metricType === 'share_price');
    if (!sharePriceSeries?.dataPoints?.length) return null;

    const sorted = [...sharePriceSeries.dataPoints]
      .filter(dp => typeof dp.value === 'number')
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

    if (sorted.length < 2) return null;

    const latest = sorted[0].value as number;
    const previous = sorted[1].value as number;

    if (previous === 0) return null;

    const change = latest - previous;
    const percent = (change / previous) * 100;

    return {
      value: change,
      percent,
      isPositive: change >= 0,
    };
  }, [reit]);

  // ============================================================================
  // Geographic Distribution (must be before any conditional returns)
  // ============================================================================

  const geographicData = useMemo<GeographicDistribution[]>(() => {
    if (!reit?.raw?.entity) return [];

    // Try to get geographic distribution from extended entity data
    const extended = reit.raw.entity as typeof reit.raw.entity & {
      portfolio?: {
        geographicDistribution?: GeographicDistribution[];
      };
    };

    return extended.portfolio?.geographicDistribution ?? [];
  }, [reit]);

  const hasGeographicData = geographicData.length > 0;

  const renderCitationChip = (citation?: REIT['citations'][number]) => {
    if (!citation) {
      return null;
    }

    return <CitationChip id={citation.id} onClick={() => handleCitationClick(citation.id)} />;
  };

  if (isLoading && !reit) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-10 md:px-6">
        <div className="rounded-sm border border-stroke bg-surface p-8 text-center text-ink-muted">
          Loading REIT memo...
        </div>
      </div>
    );
  }

  if (!reit) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-10 md:px-6">
        <div className="rounded-sm border border-stroke bg-surface p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">REIT not found</h1>
          <p className="mt-2 text-sm text-ink-muted">{error ?? 'This entity could not be loaded from the normalized dataset.'}</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-medium text-accent transition-colors hover:text-accent-hover">
            Return to Monitor
          </Link>
        </div>
      </div>
    );
  }

  const primaryReferences = reit.citations.slice(0, 4);
  const overviewSource = primaryReferences.slice(0, 2).map((citation) => `[${citation.id}]`).join(', ');
  const dpuFigureSource = primaryReferences.map((citation) => `[${citation.id}]`).join(', ');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    // Use getBoundingClientRect for accurate document-relative position
    // (handles sticky/fixed ancestors correctly, unlike offsetTop)
    // Offset accounts for the global nav (48px) + sub-header (~56px) stack so
    // the target heading lands just below the sticky chrome instead of being
    // hidden behind it.
    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementTop - 112,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas pb-24">
      <div className="sticky top-12 z-30 border-b border-stroke bg-surface/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="text-ink-muted transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-stroke" />
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="truncate text-lg font-bold text-ink">{reit.name}</h1>
            <span className="font-data text-sm text-ink-muted">{reit.ticker}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-stroke bg-surface-alt px-2 py-0.5 text-xs font-medium text-ink-muted">
              {reit.sector}
            </span>
            {reit.shariahCompliant && (
              <span className="rounded-sm border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Shariah
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Manager</span>
            <span className="font-medium text-ink">{reit.managerName}</span>
          </div>
          <div className="hidden h-4 w-px bg-stroke md:block" />
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="text-xs uppercase tracking-wider">Assessment</span>
            <span className="font-data text-ink">{formatDisplayDate(reit.assessmentDate)}</span>
          </div>
          <div className="ml-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label={shareFeedback === 'copied' ? 'Link copied to clipboard' : shareFeedback === 'shared' ? 'Shared successfully' : 'Share this page'}
              className={`rounded-sm p-1.5 transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                shareFeedback !== 'idle' ? 'text-success' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {shareFeedback === 'copied' || shareFeedback === 'shared' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Share className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              aria-label={downloadFeedback === 'downloaded' ? 'Download started' : 'Download entity snapshot'}
              className={`rounded-sm p-1.5 transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                downloadFeedback !== 'idle' ? 'text-success' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {downloadFeedback === 'downloaded' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

        <div className="flex gap-1 border-t border-stroke px-4 md:px-6" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'memo'}
            onClick={() => setActiveTab('memo')}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'memo'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Memo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'data-room'}
            onClick={() => setActiveTab('data-room')}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'data-room'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Data Room
          </button>
        </div>
      </div>

      <div className="mx-auto mt-8 flex min-h-screen max-w-[1440px] items-start gap-12 px-4 md:px-6 xl:px-8">
        {activeTab === 'memo' && <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-[220px] shrink-0 self-start overflow-y-auto pr-2 lg:block">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-label">Document Outline</span>
            <span className="font-data text-[11px] text-ink-faint">
              {outlineSections.length}
            </span>
          </div>
          <nav aria-label="Memo sections" className="space-y-1 border-l border-stroke">
            {outlineSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`-ml-[2px] block w-full border-l-[3px] px-4 py-1.5 text-left text-sm transition-all ${
                    isActive
                      ? 'border-accent font-semibold text-ink'
                      : 'border-transparent text-ink-muted hover:border-stroke-strong hover:text-ink'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 space-y-3 border-t border-stroke pt-6">
            <button
              type="button"
              onClick={() => setActiveTab('data-room')}
              className="flex w-full items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Switch to Data Room <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex w-full items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowUp className="h-4 w-4" /> Back to top
            </button>
          </div>
        </aside>}

        <main className="min-w-0 max-w-[760px] flex-1">
          {activeTab === 'data-room' ? (
            <div className="pb-16">
              <SectionHeader label="DATA ROOM" title="Financial & Operational Metrics" />
              <p className="mt-2 mb-6 text-sm text-ink-muted">
                All available metrics for {reit.name}, sourced from company filings and public disclosures.
                Click any cited row to view supporting evidence.
              </p>
              <KpiGrid
                entities={[reit.raw]}
                category="all"
                onMetricClick={handleMetricClick}
              />
            </div>
          ) : (
          <article className="prose-container border-b border-stroke pb-16">
            {analysisMarkdown ? (
              <MemoMarkdown
                markdown={analysisMarkdown}
                citations={reit.citations}
                onCitationClick={handleCitationClick}
              />
            ) : (
              <>
                <section id="executive-summary" className="mb-12 scroll-mt-28">
                  <h2 className="mb-6 font-serif text-2xl font-bold text-ink">Executive Summary</h2>

                  <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">
                     {reit.name}&apos;s {reit.sector.toLowerCase()} portfolio trades at a roughly {discountToNav.toFixed(0)}%
                    {' '}discount to NAV despite {reit.occupancy.toFixed(1)}% occupancy and a {reit.wale === 'n/a' ? 'n/a' : `${reit.wale.toFixed(1)}-year`}
                    {' '}WALE, with market concerns centered on refinancing risk at the current gearing level of {reit.gearing.toFixed(1)}%
                    {' '}{renderCitationChip(primaryReferences[0])}. We view the setup as more
                    balanced than the headline suggests: interest cover of {reit.interestCover.toFixed(1)}x
                    {' '}{renderCitationChip(primaryReferences[1])} and a steady operating backdrop
                    {' '}{renderCitationChip(primaryReferences[2])} help contain the risk narrative.
                  </p>

                  <Callout type="thesis">
                    No long-form memo has been checked in for {reit.name} yet. The page falls back to a short data-driven
                    summary so the sidebar, fact sheet, and data room stay usable while the written note is pending.
                  </Callout>

                  <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">
                    Distribution per unit across the last five years
                    <span className="mx-1 inline-block align-middle">
                      <Sparkline data={reit.dpuHistory} width={36} height={14} />
                    </span>
                    combined with the balance-sheet snapshot in the right-hand rail still gives the reader an
                    evidence-backed starting point before the full memo lands.
                  </p>
                </section>

                <section id="company-overview" className="mb-12 scroll-mt-28">
                  <div className="mb-8 h-px w-full bg-stroke" />
                  <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Company Overview</h2>

                  <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">
                    Listed on the Main Market of Bursa Malaysia, {reit.name} offers a sector-specific way to access
                    income and asset exposure through a public REIT structure.
                  </p>

                  <Figure
                    caption="Figure 1. Portfolio NLA breakdown by region"
                    source={overviewSource ? `Company Filings ${overviewSource}` : undefined}
                  >
                    {hasGeographicData ? (
                      <>
                        <div className="flex h-48 items-end justify-center gap-2 pb-4 px-2">
                          {geographicData.map((region, index) => {
                            const maxPercent = Math.max(...geographicData.map(r => r.percentageOfPortfolio));
                            const heightPercent = maxPercent > 0
                              ? (region.percentageOfPortfolio / maxPercent) * 100
                              : 0;
                            return (
                              <div
                                key={region.region}
                                className="group relative flex flex-col items-center"
                                title={`${region.region}: ${region.percentageOfPortfolio.toFixed(1)}%`}
                              >
                                <div
                                  className="w-12 bg-accent transition-all hover:bg-accent-hover"
                                  style={{
                                    height: `${Math.max(heightPercent, 8)}%`,
                                    opacity: 1 - (index * 0.15),
                                  }}
                                  aria-label={`${region.region}: ${region.percentageOfPortfolio.toFixed(1)}%`}
                                />
                                <span className="mt-2 text-[10px] text-ink-muted max-w-[60px] truncate">
                                  {region.percentageOfPortfolio.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                          {geographicData.map((region) => (
                            <span key={region.region} className="flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-sm bg-accent" />
                              {region.region}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center gap-2 text-ink-muted">
                        <span className="text-sm">Geographic distribution data unavailable</span>
                        <span className="text-xs">Check Data Room for portfolio details</span>
                      </div>
                    )}
                  </Figure>
                </section>

                <section id="financials" className="mb-12 scroll-mt-28">
                  <div className="mb-8 h-px w-full bg-stroke" />
                  <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Financial Performance</h2>

                  <Figure
                    caption="Figure 2. DPU history"
                    source={dpuFigureSource ? `Annual Reports ${dpuFigureSource}` : undefined}
                  >
                    <div className="flex h-40 items-end justify-between gap-2 border-b border-stroke px-4 pb-4">
                      {reit.dpuHistory.map((value, index) => (
                        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="group relative w-full max-w-[32px] bg-accent"
                            style={{ height: `${(value / Math.max(...reit.dpuHistory)) * 100}%` }}
                          />
                          <span className="font-data text-xs text-ink-muted">FY{19 + index}</span>
                        </div>
                      ))}
                    </div>
                  </Figure>
                </section>

                <section id="debt" className="mb-12 scroll-mt-28">
                  <div className="mb-8 h-px w-full bg-stroke" />
                  <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Debt Sustainability</h2>
                  <p className="mb-4 font-serif text-[15px] leading-[1.65] text-ink">
                    Gearing currently sits at {reit.gearing.toFixed(1)}%, while interest cover is {reit.interestCover.toFixed(1)}x.
                  </p>
                </section>

                <section id="thesis" className="scroll-mt-28">
                  <div className="mb-8 h-px w-full bg-stroke" />
                  <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Outlook &amp; Thesis</h2>
                  <Callout type="thesis">
                    No written research memo has been published for {reit.name} yet. This section will display
                    the full investment thesis and outlook analysis once available. The Data Room below provides
                    the foundational metrics used to inform that analysis.
                  </Callout>
                  <p className="font-serif text-[15px] leading-[1.65] text-ink-muted">
                    Key metrics to watch: DPU sustainability at {reit.dpu.toFixed(2)} sen, refinancing trajectory
                    with {reit.gearing.toFixed(1)}% gearing, and occupancy trends around {reit.occupancy.toFixed(1)}%.
                  </p>
                </section>
              </>
            )}
          </article>
          )}
        </main>

        <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-[300px] shrink-0 self-start overflow-y-auto xl:block">
          <div className="rounded-sm border border-stroke bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4">
              <div>
                <div className="font-data text-2xl font-semibold text-ink">RM {reit.sharePrice.toFixed(2)}</div>
                {priceChange ? (
                  <div className={`mt-1 flex items-center gap-1 font-data text-sm ${priceChange.isPositive ? 'text-success' : 'text-danger'}`}>
                    {priceChange.isPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>
                      {priceChange.isPositive ? '+' : ''}{priceChange.value.toFixed(2)} ({priceChange.isPositive ? '+' : ''}{priceChange.percent.toFixed(1)}%)
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 font-data text-sm text-ink-muted">
                    <span aria-label="Price change unavailable">—</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <RiskChip level={reit.overallRisk} />
                <div className="mt-2 text-[10px] uppercase tracking-wider text-ink-muted">Overall Risk</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-muted">Div Yield</span>
                <span className="font-data text-sm font-medium">{reit.yield.toFixed(1)}%</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-muted">Price / Book</span>
                <span className="font-data text-sm font-medium">{reit.priceToBook.toFixed(2)}x</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-muted">Gearing</span>
                <span className="font-data text-sm font-medium">{reit.gearing.toFixed(1)}%</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-muted">Interest Cover</span>
                <span className="font-data text-sm font-medium">{reit.interestCover.toFixed(1)}x</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-muted">WALE</span>
                <span className="font-data text-sm font-medium">{reit.wale === 'n/a' ? 'n/a' : `${reit.wale.toFixed(1)} yrs`}</span>
              </div>
            </div>

            <div className="mt-6 border-t border-stroke pt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">5Y DPU Trend</div>
              <Sparkline data={reit.dpuHistory} width={258} height={40} className="w-full" />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-stroke pt-4 text-xs text-ink-muted">
              <span>Last assessed: {formatDisplayDate(reit.assessmentDate)}</span>
              <button
                type="button"
                className="flex items-center gap-1 transition-colors hover:text-ink"
                onClick={() => {
                  setSelectedCitationIds(allCitationIds);
                  setCitationPanelOpen(true);
                }}
              >
                {reit.citationCount} citations <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <CitationPanel
        isOpen={citationPanelOpen}
        onClose={() => {
          setCitationPanelOpen(false);
          setSelectedCitationIds([]);
          setActiveCitationId(null);
        }}
        activeCitationId={activeCitationId}
        citationIds={selectedCitationIds.length > 0 ? selectedCitationIds : allCitationIds}
        entities={[reit.raw]}
      />

      {/* Floating back-to-top button; fades in once the reader scrolls past the memo
          intro. Hidden on lg+ where the outline sidebar already exposes the same action. */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-surface text-ink-muted shadow-md transition-all duration-200 hover:bg-surface-alt hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden ${
          showBackToTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}
