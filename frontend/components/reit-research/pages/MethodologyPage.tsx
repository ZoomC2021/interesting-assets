'use client';

import Link from 'next/link';
import React from 'react';
import { useDesignState } from '../DesignStateProvider';
import { ArrowRight, BookOpen, CheckCircle, Scale, FileSearch, TrendingUp, AlertCircle } from '../icons';

interface MethodologySection {
  id: string;
  title: string;
  description: string;
  items: string[];
}

const methodologySections: MethodologySection[] = [
  {
    id: 'data-collection',
    title: 'Data Collection',
    description: 'Structured extraction from primary sources with full traceability.',
    items: [
      'Annual and quarterly reports from Bursa Malaysia filings',
      'Official company announcements and press releases',
      'Regulatory disclosures and compliance statements',
      'Direct verification with REIT management where available',
    ],
  },
  {
    id: 'metrics',
    title: 'Key Metrics',
    description: 'Standardized calculation approach across all covered entities.',
    items: [
      'DPU calculated from trailing twelve months distributions',
      'Yield based on current market price versus annualized DPU',
      'Gearing ratio as total borrowings divided by total assets',
      'Occupancy weighted by net lettable area (NLA)',
      'WALE by rental income with lease expiry profile',
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Multi-factor evaluation framework for operational and financial risks.',
    items: [
      'Concentration risk: tenant and geographic exposure limits',
      'Refinancing risk: debt maturity profile and coverage ratios',
      'Operational risk: occupancy trends and lease rollover',
      'Market risk: sector dynamics and competitive positioning',
    ],
  },
  {
    id: 'citations',
    title: 'Citation System',
    description: 'Every metric links to its source for verification and audit.',
    items: [
      'Unique citation identifiers per source document',
      'Inline references in analysis and memos',
      'Source document summaries with key dates',
      'Cross-entity citation linking for comparison',
    ],
  },
];

const qualityStandards = [
  { icon: CheckCircle, label: 'Primary Source Verified', description: 'All data traced to original documents' },
  { icon: Scale, label: 'Standardized Methodology', description: 'Consistent calculations across entities' },
  { icon: FileSearch, label: 'Full Traceability', description: 'Every metric has a verifiable source' },
  { icon: TrendingUp, label: 'Continuous Monitoring', description: 'Regular updates as data becomes available' },
];

export function MethodologyPage() {
  const { isCompact } = useDesignState();

  return (
    <div className="min-h-[calc(100vh-48px)] bg-canvas pb-20">
      {/* Header */}
      <div className="border-b border-stroke bg-surface px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Methodology</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Research methodology for REIT analysis, data collection, and risk assessment.
            All metrics follow standardized calculations with full source attribution.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        {/* Quality Standards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {qualityStandards.map((standard) => (
            <div
              key={standard.label}
              className={`flex items-start gap-3 rounded-sm border border-stroke bg-surface ${isCompact ? 'p-3' : 'p-4'}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent/10">
                <standard.icon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-ink">{standard.label}</h3>
                <p className="text-xs text-ink-muted">{standard.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Methodology Sections */}
        <div className="space-y-6">
          {methodologySections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-sm border border-stroke bg-surface p-4 md:p-6"
            >
              <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{section.description}</p>

              <ul className="mt-4 space-y-2">
                {section.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-sm text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Update Cadence */}
        <div className="mt-6 rounded-sm border border-stroke bg-surface p-4 md:p-6">
          <h2 className="text-lg font-semibold text-ink">Update Cadence</h2>
          <p className="mt-1 text-sm text-ink-muted">How and when data is refreshed</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-stroke bg-surface-alt p-3">
              <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">Quarterly</div>
              <div className="mt-1 text-sm text-ink">Financial results, DPU announcements</div>
            </div>
            <div className="rounded-sm border border-stroke bg-surface-alt p-3">
              <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">Annually</div>
              <div className="mt-1 text-sm text-ink">Annual reports, full portfolio reviews</div>
            </div>
            <div className="rounded-sm border border-stroke bg-surface-alt p-3">
              <div className="text-xs font-medium uppercase tracking-wider text-ink-muted">As Needed</div>
              <div className="mt-1 text-sm text-ink">Major events, M&A, rights issues</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-sm border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <h3 className="text-sm font-medium text-ink">Important Disclaimer</h3>
              <p className="mt-1 text-xs text-ink-muted">
                This research is for informational purposes only and does not constitute investment advice.
                Data is sourced from publicly available filings and announcements. Always verify critical
                figures with official sources before making investment decisions. Past performance does not
                guarantee future results.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation CTA */}
        <div className="mt-6 flex items-center justify-between rounded-sm border border-accent/20 bg-accent/5 px-4 py-4 md:px-6">
          <div>
            <h3 className="text-sm font-medium text-ink">View Coverage Universe</h3>
            <p className="text-xs text-ink-muted">See which REITs are included in our research</p>
          </div>
          <Link
            href="/coverage"
            className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Go to Coverage <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
