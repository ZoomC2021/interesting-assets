import EntityDetailClient from './client';
import { AVAILABLE_ENTITIES } from '@/lib/available-entities';

/** `output: export` requires all visited `/entity/*` paths at build time. */
export function generateStaticParams() {
  return AVAILABLE_ENTITIES.map((e) => ({ id: e.code }));
}

export default function EntityDetailPage({ params }: { params: { id: string } }) {
  return <EntityDetailClient entityId={params.id} />;
}
