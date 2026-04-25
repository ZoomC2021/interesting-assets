import EntityDetailClient from './client';
import { AVAILABLE_ENTITIES } from '@/lib/available-entities';
import { loadEntityAnalysisMarkdown } from '@/lib/entity-analysis';

/** `output: export` requires all visited `/entity/*` paths at build time. */
export function generateStaticParams() {
  return AVAILABLE_ENTITIES.map((e) => ({ id: e.code }));
}

export default async function EntityDetailPage({ params }: { params: { id: string } }) {
  const analysisMarkdown = await loadEntityAnalysisMarkdown(params.id);

  return <EntityDetailClient entityId={params.id} analysisMarkdown={analysisMarkdown} />;
}
