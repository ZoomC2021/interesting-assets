'use client';

/**
 * CitationPanel - Enhanced citation panel with accessibility features
 * Includes: focus trapping, keyboard navigation, source filtering, copy-to-clipboard
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { NormalizedReitData, Reference } from '@/types/frontend';
import { formatDate } from '@/lib/formatters';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import {
  groupReferencesBySource,
  getSourceGroupType,
  copyCitationToClipboard,
  copyCitationsToClipboard,
  SOURCE_GROUPS,
  type SourceGroupType,
} from '@/lib/citation-utils';

interface CitationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  citationIds: string[];
  entities: NormalizedReitData[];
}

export function CitationPanel({ isOpen, onClose, citationIds, entities }: CitationPanelProps) {
  const [activeFilter, setActiveFilter] = useState<SourceGroupType | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const { announce, liveRegionProps } = useAnnouncer();
  
  // Focus trap for accessibility
  const panelRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    returnFocusOnDeactivate: true,
  });

  // Get all references from entities (memoized to prevent recreating array each render)
  const allReferences = useMemo(
    () => entities.flatMap(e => e.references),
    [entities]
  );

  // Find matching citations
  const citations = useMemo(() => {
    return citationIds
      .map(id => allReferences.find(r => r.id === id || r.displayId === id))
      .filter((ref): ref is Reference => ref !== undefined);
  }, [citationIds, allReferences]);

  // Group citations by source
  const groupedCitations = useMemo(() => {
    return groupReferencesBySource(citations);
  }, [citations]);

  // Filter citations based on active filter
  const filteredCitations = useMemo(() => {
    if (activeFilter === 'all') return citations;
    return groupedCitations.get(activeFilter) || [];
  }, [citations, groupedCitations, activeFilter]);

  // Announce panel state changes
  const handleClose = useCallback(() => {
    announce('Citation panel closed', 'polite');
    onClose();
  }, [announce, onClose]);

  // Handle copy single citation
  const handleCopyCitation = useCallback(async (reference: Reference) => {
    const success = await copyCitationToClipboard(reference);
    if (success) {
      setCopiedId(reference.id);
      announce(`Citation ${reference.displayId} copied to clipboard`, 'polite');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      announce('Failed to copy citation', 'assertive');
    }
  }, [announce]);

  // Handle copy all citations
  const handleCopyAll = useCallback(async () => {
    const success = await copyCitationsToClipboard(filteredCitations);
    if (success) {
      announce(`Copied ${filteredCitations.length} citations to clipboard`, 'polite');
    } else {
      announce('Failed to copy citations', 'assertive');
    }
  }, [filteredCitations, announce]);

  // Handle filter change
  const handleFilterChange = useCallback((filter: SourceGroupType | 'all') => {
    setActiveFilter(filter);
    const label = filter === 'all' ? 'all sources' : SOURCE_GROUPS[filter].label;
    announce(`Filtering citations by ${label}`, 'polite');
  }, [announce]);

  // Announce filter results when filter changes
  useEffect(() => {
    if (isOpen && activeFilter !== 'all' && filteredCitations.length > 0) {
      announce(`Showing ${filteredCitations.length} citations from ${SOURCE_GROUPS[activeFilter].label}`, 'polite');
    }
  }, [activeFilter, filteredCitations.length, isOpen, announce]);

  if (!isOpen) return null;

  return (
    <>
      {/* Screen reader live regions */}
      <div {...liveRegionProps.polite} aria-label="Screen reader announcements polite" />
      <div {...liveRegionProps.assertive} aria-label="Screen reader announcements assertive" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity forced-colors:bg-black"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-panel-title"
        aria-describedby="citation-panel-description"
        className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-stroke bg-surface shadow-panel transform transition-transform duration-300 ease-out forced-colors:border-l-2 forced-colors:border-black"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke bg-surfaceAlt px-3 py-2">
          <div className="min-w-0 pr-2">
            <h2 
              id="citation-panel-title" 
              className="text-sm font-semibold text-ink"
            >
              Sources & citations
            </h2>
            <p 
              id="citation-panel-description"
              className="text-[11px] leading-snug text-muted"
            >
              {citations.length} reference{citations.length !== 1 ? 's' : ''} from {entities.length} source{entities.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close citation panel"
            title="Close (Escape)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Bar */}
        {citations.length > 0 && (
          <div className="border-b border-stroke bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-label">Filter</span>
              <button
                onClick={() => handleFilterChange('all')}
                className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'border border-primary-300 bg-primary-100 text-primary-700'
                    : 'border border-transparent bg-surfaceAlt text-muted hover:bg-surface'
                }`}
                aria-pressed={activeFilter === 'all'}
                aria-label="Show all sources"
              >
                All
              </button>
              {(Object.keys(SOURCE_GROUPS) as SourceGroupType[]).map(groupType => {
                const group = SOURCE_GROUPS[groupType];
                const count = groupedCitations.get(groupType)?.length || 0;
                if (count === 0) return null;
                
                return (
                  <button
                    key={groupType}
                    onClick={() => handleFilterChange(groupType)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                      activeFilter === groupType
                        ? `${group.colorClass} border border-current`
                        : 'border border-transparent bg-surfaceAlt text-muted hover:bg-surface'
                    }`}
                    aria-pressed={activeFilter === groupType}
                    aria-label={`Filter by ${group.label} (${count} citations)`}
                    title={group.description}
                  >
                    {group.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Copy All Button */}
        {filteredCitations.length > 0 && (
          <div className="border-b border-stroke bg-surface px-3 py-1.5">
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Copy all ${filteredCitations.length} citations to clipboard`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy All ({filteredCitations.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {citations.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto mb-2 h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-muted">No citations available</p>
            </div>
          ) : filteredCitations.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted">No citations match the selected filter</p>
              <button
                onClick={() => handleFilterChange('all')}
                className="mt-2 text-xs text-primary-600 hover:text-primary-700"
              >
                Show all citations
              </button>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label="Citations list">
              {filteredCitations.map((citation, idx) => {
                const sourceGroup = getSourceGroupType(citation);
                const groupConfig = SOURCE_GROUPS[sourceGroup];
                const isCopied = copiedId === citation.id;
                const isHovered = hoveredCitation === citation.id;
                
                return (
                  <div
                    key={citation.id}
                    role="listitem"
                    className={`rounded-lg border border-stroke bg-surfaceAlt p-3 transition-all ${
                      isHovered ? 'border-primary-300 ring-2 ring-primary-100' : ''
                    }`}
                    onMouseEnter={() => setHoveredCitation(citation.id)}
                    onMouseLeave={() => setHoveredCitation(null)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-ink">
                            {citation.displayId}
                          </p>
                          <button
                            onClick={() => handleCopyCitation(citation)}
                            className={`rounded p-0.5 transition-colors ${
                              isCopied 
                                ? 'bg-success-100 text-success-600' 
                                : 'text-muted hover:bg-surface hover:text-ink'
                            }`}
                            aria-label={isCopied ? 'Citation copied' : `Copy citation ${citation.displayId}`}
                            title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                          >
                            {isCopied ? (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        <p className="mb-1.5 text-[12.5px] leading-5 text-ink">
                          {citation.fact}
                        </p>

                        <div className="mb-1.5 flex flex-wrap gap-1 text-[10px]">
                          <span className={`rounded px-1.5 py-0.5 ${groupConfig.colorClass}`}>
                            {groupConfig.label}
                          </span>
                          {citation.timeSensitive && (
                            <span 
                              className="inline-flex items-center gap-0.5 rounded bg-warning-100 px-1.5 py-0.5 text-warning-700"
                              title="This information may be time-sensitive"
                            >
                              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Time-sensitive
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 rounded border border-stroke bg-surface p-1.5 text-[11px] leading-relaxed text-muted">
                          <span className="font-medium text-ink">Citation:</span> {citation.citation}
                        </p>

                        <p className="mt-1 text-[10px] text-muted">
                          <span className="font-medium text-ink">Accessed:</span> {formatDate(citation.dateAccessed)}
                        </p>

                        {citation.url && (
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-0.5 rounded px-0.5 py-0.5 text-[11px] text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label={`View source for ${citation.displayId} (opens in new tab)`}
                          >
                            View Source
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stroke bg-surfaceAlt px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] leading-snug text-muted">
              Sources verified from annual reports and Bursa Malaysia announcements.
            </p>
            <span className="shrink-0 text-[10px] text-muted" aria-live="polite">
              {copiedId ? 'Copied' : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default CitationPanel;
