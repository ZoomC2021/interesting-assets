import EntityDetailClient from './client';

// Generate static params for entity pages
export function generateStaticParams() {
  return [
    { id: '5130.KL' },
    { id: '5106.KL' },
  ];
}

export default function EntityDetailPage({ params }: { params: { id: string } }) {
  return <EntityDetailClient entityId={params.id} />;
}
