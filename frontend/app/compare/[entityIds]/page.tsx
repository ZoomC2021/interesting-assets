import ComparePageContent from '../page';
import { Suspense } from 'react';

// Generate static params for common entity combinations
export function generateStaticParams() {
  return [
    { entityIds: '5130.KL' },
    { entityIds: '5106.KL' },
    { entityIds: '5130.KL,5106.KL' },
  ];
}

export default function EntityIdsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>}>
      <ComparePageContent />
    </Suspense>
  );
}
