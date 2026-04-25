import ComparePageContent from '../page';
import { Suspense } from 'react';
import { AVAILABLE_ENTITIES } from '@/lib/available-entities';

/**
 * `output: export` — one static page per single-entity path (e.g. /compare/5227.KL).
 * The main table uses /compare?entities=…; this covers path-based URLs and bookmarks.
 */
export function generateStaticParams() {
  return [
    ...AVAILABLE_ENTITIES.map((e) => ({ entityIds: e.code })),
    { entityIds: '5130.KL,5106.KL' },
  ];
}

export default function EntityIdsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>}>
      <ComparePageContent />
    </Suspense>
  );
}
