import ComparePageContent from './page';
import { Suspense } from 'react';

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>}>
      <ComparePageContent />
    </Suspense>
  );
}
