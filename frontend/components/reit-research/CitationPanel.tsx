'use client';

import type { ResearchCitation } from '@/data/reits';
import { Copy, ExternalLink, Filter, X } from './icons';

interface CitationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCitationId?: string | null;
  citations?: ResearchCitation[];
}

const fallbackCitations = [
  {
    id: 'T:127',
    type: 'Annual Report',
    title: 'Atrium REIT Annual Report 2023',
    date: '28 Feb 2024',
  },
  {
    id: 'T:89',
    type: 'Company Filing',
    title: 'Q4 2023 Financial Results Presentation',
    date: '25 Jan 2024',
  },
  {
    id: 'T:142',
    type: 'Press Release',
    title: 'Extension of Medium Term Note Programme',
    date: '15 Mar 2024',
  },
];

export function CitationPanel({ isOpen, onClose, activeCitationId, citations }: CitationPanelProps) {
  const displayedCitations = citations && citations.length > 0 ? citations : fallbackCitations;

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
          {displayedCitations.map((citation) => {
            const isActive = activeCitationId === citation.id;

            return (
              <div
                key={citation.id}
                className={`rounded-sm border p-3 transition-colors ${
                  isActive ? 'border-accent bg-accent/5' : 'border-stroke hover:border-stroke-strong'
                }`}
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
                      className="p-1 text-ink-muted transition-colors hover:text-ink"
                      title="Copy citation"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-ink-muted transition-colors hover:text-ink"
                      title="View source"
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
          })}
        </div>
      </aside>
    </>
  );
}
