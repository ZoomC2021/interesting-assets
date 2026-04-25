'use client';

import { useState, useCallback } from 'react';
import type { ResearchCitation } from '@/data/reits';
import { Copy, ExternalLink, Filter, X, Check, FileText } from './icons';

interface CitationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCitationId?: string | null;
  citations?: ResearchCitation[];
}

interface CopiedState {
  id: string;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

function formatCitationText(citation: ResearchCitation): string {
  return `${citation.id} - ${citation.title} (${citation.type}, ${citation.date})`;
}

export function CitationPanel({ isOpen, onClose, activeCitationId, citations }: CitationPanelProps) {
  const [copiedState, setCopiedState] = useState<CopiedState | null>(null);

  const displayedCitations = citations ?? [];
  const hasCitations = displayedCitations.length > 0;

  const handleCopyCitation = useCallback(async (citation: ResearchCitation) => {
    // Clear any existing timeout
    if (copiedState?.timeoutId) {
      clearTimeout(copiedState.timeoutId);
    }

    try {
      await navigator.clipboard.writeText(formatCitationText(citation));
      
      // Set new copied state with auto-clear timeout
      const timeoutId = setTimeout(() => {
        setCopiedState(null);
      }, 2000);
      
      setCopiedState({ id: citation.id, timeoutId });
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  }, [copiedState]);

  const handleViewSource = useCallback((url: string | undefined) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <>
      {isOpen && <button type="button" className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />}

      <aside
        className={`fixed bottom-0 right-0 top-12 z-50 flex w-full max-w-[400px] flex-col border-l border-stroke bg-surface shadow-popover transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="shrink-0 border-b border-stroke p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Citations &amp; Sources</h3>
              <p className="mt-0.5 text-xs text-ink-muted">{displayedCitations.length} references in this document</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
              aria-label="Close citation panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-stroke p-3">
          <Filter className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
          <button className="whitespace-nowrap rounded-sm border border-stroke bg-surface-alt px-2 py-1 text-xs font-medium text-ink">
            All Sources
          </button>
          <button className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1 text-xs text-ink-muted hover:bg-surface-alt">
            Annual Reports
          </button>
          <button className="whitespace-nowrap rounded-sm border border-transparent px-2 py-1 text-xs text-ink-muted hover:bg-surface-alt">
            Filings
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!hasCitations ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-ink-muted/50" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">No citations available</p>
              <p className="mt-1 text-xs text-ink-muted">
                This document does not have any reference citations.
              </p>
            </div>
          ) : (
            displayedCitations.map((citation) => {
              const isActive = activeCitationId === citation.id;
              const isCopied = copiedState?.id === citation.id;
              const hasUrl = Boolean(citation.url);

              return (
                <div
                  key={citation.id}
                  className={`rounded-sm border p-3 transition-colors ${
                    isActive ? 'border-accent bg-accent/5' : 'border-stroke hover:border-stroke-strong'
                  }`}
                  data-citation-id={citation.id}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-sm border border-stroke bg-surface px-1 font-data text-xs font-medium text-accent">
                        {citation.id}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                        {citation.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyCitation(citation)}
                        className={`rounded p-1 transition-colors ${
                          isCopied
                            ? 'bg-green-100 text-green-600'
                            : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                        }`}
                        title={isCopied ? 'Copied!' : 'Copy citation'}
                        aria-label={isCopied ? `Citation ${citation.id} copied` : `Copy citation ${citation.id}`}
                      >
                        {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewSource(citation.url)}
                        disabled={!hasUrl}
                        className={`rounded p-1 transition-colors ${
                          hasUrl
                            ? 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                            : 'cursor-not-allowed text-ink-muted/30'
                        }`}
                        title={hasUrl ? 'View source' : 'No source URL available'}
                        aria-label={hasUrl ? `View source for citation ${citation.id}` : `No source URL for citation ${citation.id}`}
                        aria-disabled={!hasUrl}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <h4 className="mb-1 text-sm font-medium leading-snug text-ink">{citation.title}</h4>

                  <div className="flex items-center gap-3 font-data text-xs text-ink-muted">
                    <span>{citation.date}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
