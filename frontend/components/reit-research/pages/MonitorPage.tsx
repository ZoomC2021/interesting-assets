'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { adaptReitsData, REIT } from '@/data/reits';
import { useEntityData } from '@/hooks/useEntityData';
import { AVAILABLE_ENTITIES } from '@/lib/available-entities';
import { useDesignState } from '../DesignStateProvider';
import { CompareTray } from '../CompareTray';
import { FilterSidebar, RangeFilter, DEFAULT_MARKET_CAP_RANGE, DEFAULT_YIELD_RANGE } from '../FilterSidebar';
import { RiskChip } from '../RiskChip';
import { Sparkline } from '../Sparkline';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown } from '../icons';

// Default range values are imported from FilterSidebar

type SortField =
  | 'name'
  | 'sector'
  | 'marketCap'
  | 'sharePrice'
  | 'dpu'
  | 'yield'
  | 'priceToBook'
  | 'gearing'
  | 'occupancy'
  | 'wale'
  | 'overallRisk'
  | 'citationCount';
type SortDirection = 'asc' | 'desc' | null;

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

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) {
    return <ArrowUpDown className="h-3 w-3 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />;
  }

  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-accent" />
  ) : (
    <ArrowDown className="h-3 w-3 text-accent" />
  );
}

export function MonitorPage() {
  const { isCompact } = useDesignState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [shariahOnly, setShariahOnly] = useState(false);
  const [selectedReitIds, setSelectedReitIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Range filter state
  const [marketCapRange, setMarketCapRange] = useState<RangeFilter>(DEFAULT_MARKET_CAP_RANGE);
  const [yieldRange, setYieldRange] = useState<RangeFilter>(DEFAULT_YIELD_RANGE);

  const entityCodes = useMemo(() => AVAILABLE_ENTITIES.map(({ code }) => code), []);
  const { data: entityData, isLoading, error } = useEntityData(entityCodes);
  const reitsData = useMemo(() => adaptReitsData(entityData), [entityData]);

  const totalCitationCount = useMemo(
    () => reitsData.reduce((total, reit) => total + reit.citationCount, 0),
    [reitsData],
  );

  const lastUpdatedLabel = useMemo(() => {
    const latestTimestamp = reitsData.reduce((latest, reit) => {
      const timestamp = new Date(reit.assessmentDate).getTime();
      return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
    }, 0);

    return latestTimestamp > 0 ? formatDisplayDate(new Date(latestTimestamp).toISOString()) : 'Unavailable';
  }, [reitsData]);

  const allSectors = useMemo(() => Array.from(new Set(reitsData.map((reit) => reit.sector))), [reitsData]);

  // Compute min/max values from data for range sliders
  const marketCapMinMax = useMemo(() => {
    if (reitsData.length === 0) {
      return { min: DEFAULT_MARKET_CAP_RANGE.min, max: DEFAULT_MARKET_CAP_RANGE.max };
    }
    const values = reitsData.map((r) => r.marketCap);
    return {
      min: Math.floor(Math.min(...values)),
      max: Math.ceil(Math.max(...values)),
    };
  }, [reitsData]);

  const yieldMinMax = useMemo(() => {
    if (reitsData.length === 0) {
      return { min: DEFAULT_YIELD_RANGE.min, max: DEFAULT_YIELD_RANGE.max };
    }
    const values = reitsData.map((r) => r.yield);
    return {
      min: Math.floor(Math.min(...values) * 10) / 10,
      max: Math.ceil(Math.max(...values) * 10) / 10,
    };
  }, [reitsData]);

  const handleSectorChange = (sector: string) => {
    setSelectedSectors((previous) =>
      previous.includes(sector) ? previous.filter((item) => item !== sector) : [...previous, sector],
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }

      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedReitIds);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 6) {
      next.add(id);
    }
    setSelectedReitIds(next);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedSectors([]);
    setShariahOnly(false);
    setMarketCapRange(DEFAULT_MARKET_CAP_RANGE);
    setYieldRange(DEFAULT_YIELD_RANGE);
    setSelectedReitIds(new Set());
    setSortField(null);
    setSortDirection(null);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...reitsData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (reit) =>
          reit.name.toLowerCase().includes(query) || reit.ticker.toLowerCase().includes(query),
      );
    }

    if (selectedSectors.length > 0) {
      result = result.filter((reit) => selectedSectors.includes(reit.sector));
    }

    if (shariahOnly) {
      result = result.filter((reit) => reit.shariahCompliant);
    }

    // Apply market cap range filter (inclusive)
    const isMarketCapFiltered = 
      marketCapRange.min > marketCapMinMax.min || 
      marketCapRange.max < marketCapMinMax.max;
    if (isMarketCapFiltered) {
      result = result.filter(
        (reit) => reit.marketCap >= marketCapRange.min && reit.marketCap <= marketCapRange.max,
      );
    }

    // Apply yield range filter (inclusive)
    const isYieldFiltered = 
      yieldRange.min > yieldMinMax.min || 
      yieldRange.max < yieldMinMax.max;
    if (isYieldFiltered) {
      result = result.filter(
        (reit) => reit.yield >= yieldRange.min && reit.yield <= yieldRange.max,
      );
    }

    if (sortField && sortDirection) {
      result.sort((left, right) => {
        let leftValue = left[sortField];
        let rightValue = right[sortField];

        if (sortField === 'overallRisk') {
          const riskWeight: Record<import('@/data/reits').RiskLevel, number> = {
            low: 1,
            moderate: 2,
            'moderate-high': 3,
            high: 4,
            unknown: 5, // Unknown risk sorts last
          };
          leftValue = riskWeight[left.overallRisk];
          rightValue = riskWeight[right.overallRisk];
        }

        if (leftValue < rightValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (leftValue > rightValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [
    reitsData, 
    searchQuery, 
    selectedSectors, 
    shariahOnly, 
    sortField, 
    sortDirection,
    marketCapRange,
    yieldRange,
    marketCapMinMax,
    yieldMinMax,
  ]);

  const selectedReitsList = reitsData.filter((reit) => selectedReitIds.has(reit.id));
  const selectedCap = Math.min(filteredAndSortedData.length, 6);
  const thClass =
    'group sticky top-0 z-10 cursor-pointer whitespace-nowrap border-b border-stroke bg-canvas px-3 py-2 text-left font-medium text-ink-muted transition-colors hover:bg-surface-alt';
  const tdClass = `whitespace-nowrap border-b border-stroke px-3 ${isCompact ? 'py-1.5' : 'py-3'} transition-colors`;
  const numTdClass = `${tdClass} text-right text-data`;

  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col bg-canvas pb-20">
      <div className="flex h-10 items-center border-b border-stroke bg-surface-alt px-4 text-sm text-ink-muted">
        <h1 className="font-semibold text-ink">Malaysian REIT Monitor</h1>
        <span className="mx-2 text-stroke-strong">|</span>
        <span className="font-medium text-ink">{filteredAndSortedData.length} covered</span>
        <span className="mx-2 text-stroke-strong">|</span>
        <span>{totalCitationCount.toLocaleString()} citations</span>
        <span className="mx-2 text-stroke-strong">|</span>
        <span>Last updated {lastUpdatedLabel}</span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <FilterSidebar
          sectors={allSectors}
          selectedSectors={selectedSectors}
          onSectorChange={handleSectorChange}
          shariahOnly={shariahOnly}
          onShariahChange={setShariahOnly}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          marketCapRange={marketCapRange}
          onMarketCapRangeChange={setMarketCapRange}
          yieldRange={yieldRange}
          onYieldRangeChange={setYieldRange}
          marketCapMinMax={marketCapMinMax}
          yieldMinMax={yieldMinMax}
          onReset={handleReset}
        />

        <main className="relative flex-1 overflow-auto">
          {error && (
            <div className="border-b border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full min-w-[1300px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${thClass} w-10 text-center`}>
                    <span className="flex h-11 w-11 items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label="Select all visible REITs"
                        className="h-3.5 w-3.5 rounded-sm border-stroke text-accent focus:ring-accent"
                        checked={selectedCap > 0 && selectedReitIds.size === selectedCap}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedReitIds(new Set(filteredAndSortedData.slice(0, 6).map((reit) => reit.id)));
                          } else {
                            setSelectedReitIds(new Set());
                          }
                        }}
                      />
                    </span>
                  </th>
                  <th className={`${thClass} sticky left-0 z-20`} onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">Ticker</div>
                  </th>
                  <th className={thClass} onClick={() => handleSort('sector')}>
                    <div className="flex items-center gap-1">
                      Sector <SortIcon field="sector" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('marketCap')}>
                    <div className="flex items-center justify-end gap-1">
                      Mkt Cap <SortIcon field="marketCap" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">RM M</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('sharePrice')}>
                    <div className="flex items-center justify-end gap-1">
                      Price <SortIcon field="sharePrice" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">RM</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('dpu')}>
                    <div className="flex items-center justify-end gap-1">
                      DPU <SortIcon field="dpu" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">sen</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('yield')}>
                    <div className="flex items-center justify-end gap-1">
                      Yield <SortIcon field="yield" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">%</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('priceToBook')}>
                    <div className="flex items-center justify-end gap-1">
                      P/B <SortIcon field="priceToBook" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">x</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('gearing')}>
                    <div className="flex items-center justify-end gap-1">
                      Gearing <SortIcon field="gearing" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">%</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('occupancy')}>
                    <div className="flex items-center justify-end gap-1">
                      Occ <SortIcon field="occupancy" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">%</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('wale')}>
                    <div className="flex items-center justify-end gap-1">
                      WALE <SortIcon field="wale" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">yrs</div>
                  </th>
                  <th className={thClass}>
                    <div className="flex items-center gap-1">5y DPU</div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">Trend</div>
                  </th>
                  <th className={thClass} onClick={() => handleSort('overallRisk')}>
                    <div className="flex items-center gap-1">
                      Risk <SortIcon field="overallRisk" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">Overall</div>
                  </th>
                  <th className={`${thClass} text-right`} onClick={() => handleSort('citationCount')}>
                    <div className="flex items-center justify-end gap-1">
                      Refs <SortIcon field="citationCount" sortField={sortField} sortDirection={sortDirection} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-ink-faint">Count</div>
                  </th>
                  <th className={`${thClass} w-24`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading && filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-ink-muted">
                      Loading live REIT data...
                    </td>
                  </tr>
                )}

                {filteredAndSortedData.map((reit, index) => {
                  const isSelected = selectedReitIds.has(reit.id);
                  const isZebra = isCompact && index % 2 === 0;
                  const stickyCellBg = isSelected
                    ? 'bg-highlight/30 group-hover:bg-highlight/50'
                    : isZebra
                      ? 'bg-surface group-hover:bg-surface-alt'
                      : 'bg-canvas group-hover:bg-surface-alt';

                  return (
                    <tr
                      key={reit.id}
                      className={`group ${
                        isSelected
                          ? 'bg-highlight/30 hover:bg-highlight/50'
                          : isZebra
                            ? 'bg-surface hover:bg-surface-alt'
                            : 'bg-canvas hover:bg-surface-alt'
                      }`}
                    >
                      <td className={`${tdClass} p-0 text-center`}>
                        <label className="flex h-11 w-11 cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            aria-label={`Select ${reit.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelection(reit.id)}
                            className="h-3.5 w-3.5 rounded-sm border-stroke text-accent focus:ring-accent"
                          />
                        </label>
                      </td>
                      <td className={`${tdClass} sticky left-0 z-10 ${stickyCellBg}`}>
                        <div className="font-medium text-ink">{reit.name}</div>
                        <div className="font-data text-xs text-ink-muted">{reit.ticker}</div>
                      </td>
                      <td className={tdClass}>
                        <span className="text-ink-muted">{reit.sector}</span>
                        {reit.shariahCompliant && (
                          <span className="ml-2 rounded-sm border border-success px-1 py-0.5 text-[10px] text-success">S</span>
                        )}
                      </td>
                      <td className={numTdClass}>{reit.marketCap.toLocaleString()}</td>
                      <td className={numTdClass}>{reit.sharePrice.toFixed(2)}</td>
                      <td className={numTdClass}>{reit.dpu.toFixed(2)}</td>
                      <td className={numTdClass}>{reit.yield.toFixed(1)}</td>
                      <td className={numTdClass}>{reit.priceToBook > 0 ? reit.priceToBook.toFixed(2) : '—'}</td>
                      <td className={numTdClass}>{reit.gearing.toFixed(1)}</td>
                      <td className={numTdClass}>{reit.occupancy.toFixed(1)}</td>
                      <td className={numTdClass}>{reit.wale === 'n/a' ? 'n/a' : reit.wale.toFixed(1)}</td>
                      <td className={tdClass}>
                        <Sparkline data={reit.dpuHistory} width={60} height={16} />
                      </td>
                      <td className={tdClass}>
                        <RiskChip level={reit.overallRisk} />
                      </td>
                      <td className={numTdClass}>
                        <span className="rounded-sm border border-stroke bg-surface-alt px-1.5 py-0.5 text-xs">
                          {reit.citationCount}
                        </span>
                      </td>
                      <td className={`${tdClass} pr-4 text-right`}>
                        <Link
                          href={`/entity/${reit.ticker}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Memo <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-ink-muted">
                      No REITs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <CompareTray
        selectedReits={selectedReitsList}
        onRemove={(id) => {
          const next = new Set(selectedReitIds);
          next.delete(id);
          setSelectedReitIds(next);
        }}
        onClear={() => setSelectedReitIds(new Set())}
      />
    </div>
  );
}
