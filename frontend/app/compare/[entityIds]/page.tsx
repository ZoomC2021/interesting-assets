import { ComparePage } from '@/components/reit-research/pages/ComparePage';
import { DEFAULT_COMPARE_ENTITY_CODES, ENTITY_STATIC_ROUTE_CODES } from '@/lib/entity-route-params';

export function generateStaticParams() {
  return [
    ...ENTITY_STATIC_ROUTE_CODES.map((entityIds) => ({ entityIds })),
    { entityIds: DEFAULT_COMPARE_ENTITY_CODES.join(',') },
  ];
}

export default function EntityIdsPage({
  params,
}: {
  params: { entityIds: string };
}) {
  const ids = params.entityIds
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return <ComparePage initialIds={ids} />;
}
