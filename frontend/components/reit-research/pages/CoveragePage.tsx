'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { adaptReitsData } from '@/data/reits';
import { useEntityData } from '@/hooks/useEntityData';
import { AVAILABLE_ENTITIES } from '@/lib/available-entities';
import { useDesignState } from '../DesignStateProvider';
import { ArrowRight, Database, FileText, Globe, Shield } from '../icons';

interface CoverageStats {
  totalEntities: number;
  totalCitations: number;
  coverageBySector: Record<string, number>;
  dataSources: string[];
  lastUpdated: string;
}

export function CoveragePage() {
  const { isCompact } = useDesignState();

  const entityCodes = useMemo(() => AVAILABLE_ENTITIES.map(({ code }) => code), []);
  const { data: entityData, isLoading, error } = useEntityData(entityCodes);
  const reitsData = useMemo(() => adaptReitsData(entityData), [entityData]);

  const stats: CoverageStats = useMemo(() => {
    const totalEntities = reitsData.length;
    const totalCitations = reitsData.reduce((sum, reit) => sum + reit.citationCount, 0);

    const coverageBySector: Record<string, number> = {};
    reitsData.forEach((reit) => {
      coverageBySector[reit.sector] = (coverageBySector[reit.sector] || 0) + 1;
    });

    // Get latest timestamp
    const latestTimestamp = reitsData.reduce((latest, reit) => {
      const timestamp = new Date(reit.assessmentDate).getTime();
      return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
    }, 0);

    const dataSources = [
      'Bursa Malaysia',
      'Annual Reports',
      'Quarterly Disclosures',
      'Company Filings',
      'Official Announcements',
    ];

    return {
      totalEntities,
      totalCitations,
      coverageBySector,
      dataSources,
      lastUpdated: latestTimestamp > 0 ? new Date(latestTimestamp).toLocaleDateString('en-GB') : 'Unavailable',
    };
  }, [reitsData]);

  const sectorEntries = Object.entries(stats.coverageBySector).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-[calc(100vh-48px)] bg-canvas pb-20">
      {/* Header */}
      <div className="border-b border-stroke bg-surface px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Coverage</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Research coverage universe for Malaysian REITs. All entities are monitored with
            structured data and verified citations from primary sources.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        {error && (
          <div className="mb-6 rounded-sm border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-sm border border-stroke bg-surface p-8 text-center text-ink-muted">
            Loading coverage data...
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-sm border border-stroke bg-surface p-4 ${isCompact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center gap-2 text-ink-muted">
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Entities</span>
                </div>
                <div className="mt-2 text-2xl font-semibold text-ink">{stats.totalEntities}</div>
                <div className="mt-1 text-xs text-ink-muted">Active REITs covered</div>
              </div>

              <div className={`rounded-sm border border-stroke bg-surface p-4 ${isCompact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center gap-2 text-ink-muted">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Citations</span>
                </div>
                <div className="mt-2 text-2xl font-semibold text-ink">{stats.totalCitations.toLocaleString()}</div>
                <div className="mt-1 text-xs text-ink-muted">Verified source references</div>
              </div>

              <div className={`rounded-sm border border-stroke bg-surface p-4 ${isCompact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center gap-2 text-ink-muted">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Sectors</span>
                </div>
                <div className="mt-2 text-2xl font-semibold text-ink">{sectorEntries.length}</div>
                <div className="mt-1 text-xs text-ink-muted">Property segments</div>
              </div>

              <div className={`rounded-sm border border-stroke bg-surface p-4 ${isCompact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center gap-2 text-ink-muted">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Updated</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-ink">{stats.lastUpdated}</div>
                <div className="mt-1 text-xs text-ink-muted">Latest assessment</div>
              </div>
            </div>

            {/* Sector Distribution */}
            <div className="mb-8 rounded-sm border border-stroke bg-surface p-4 md:p-6">
              <h2 className="text-sm font-semibold text-ink">Coverage by Sector</h2>
              <p className="text-xs text-ink-muted">REIT distribution across property types</p>

              <div className="mt-6 space-y-4">
                {sectorEntries.map(([sector, count]) => {
                  const percentage = (count / stats.totalEntities) * 100;
                  return (
                    <div key={sector}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{sector}</span>
                        <span className="text-ink-muted">{count} REITs</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {sectorEntries.length === 0 && (
                  <div className="py-4 text-center text-sm text-ink-muted">No sector data available</div>
                )}
              </div>
            </div>

            {/* Data Sources */}
            <div className="mb-8 rounded-sm border border-stroke bg-surface p-4 md:p-6">
              <h2 className="text-sm font-semibold text-ink">Data Sources</h2>
              <p className="text-xs text-ink-muted">Primary sources for verification and citation</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.dataSources.map((source) => (
                  <div
                    key={source}
                    className="flex items-center gap-2 rounded-sm border border-stroke bg-surface-alt px-3 py-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm text-ink">{source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation CTA */}
            <div className="flex items-center justify-between rounded-sm border border-accent/20 bg-accent/5 px-4 py-4 md:px-6">
              <div>
                <h3 className="text-sm font-medium text-ink">View Monitored REITs</h3>
                <p className="text-xs text-ink-muted">Browse the full coverage list with live metrics</p>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Go to Monitor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
