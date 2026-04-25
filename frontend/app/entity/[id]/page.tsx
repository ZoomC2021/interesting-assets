import { EntityPage } from '@/components/reit-research/pages/EntityPage';
import { loadEntityAnalysisMarkdown } from '@/lib/entity-analysis';
import { ENTITY_STATIC_ROUTE_CODES } from '@/lib/entity-route-params';

export function generateStaticParams() {
  return ENTITY_STATIC_ROUTE_CODES.map((id) => ({ id }));
}

export default async function EntityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const analysisMarkdown = await loadEntityAnalysisMarkdown(params.id);

  return <EntityPage ticker={params.id} analysisMarkdown={analysisMarkdown} />;
}
