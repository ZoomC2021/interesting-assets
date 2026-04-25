/**
 * REITs available in the app (public/data + comparison-model loaders).
 * Single source of truth for static export, alias handling, and UI display labels.
 */
export const AVAILABLE_ENTITIES = [
  {
    code: '5130.KL' as const,
    name: 'Atrium REIT',
    sector: 'Industrial',
    aliases: ['atrium'],
  },
  {
    code: '5106.KL' as const,
    name: 'Axis REIT',
    sector: 'Industrial',
    aliases: ['axis'],
  },
  {
    code: '5176.KL' as const,
    name: 'Sunway REIT',
    sector: 'Diversified',
    aliases: ['sunway'],
  },
  {
    code: '5212.KL' as const,
    name: 'Pavilion REIT',
    sector: 'Retail',
    aliases: ['5204.KL', 'pavilion'],
    routeAliases: ['5204.KL'],
  },
  {
    code: '5227.KL' as const,
    name: 'IGB REIT',
    sector: 'Retail',
    aliases: ['igb'],
  },
  {
    code: '5235SS' as const,
    name: 'KLCC REIT',
    sector: 'Diversified',
    aliases: ['5235.KL', 'klcc'],
    routeAliases: ['5235.KL'],
  },
  {
    code: '5180.KL' as const,
    name: 'CMMT',
    sector: 'Retail',
    aliases: ['cmmt'],
  },
  {
    code: '5114.KL' as const,
    name: 'Al-Salam REIT',
    sector: 'Industrial',
    aliases: ['5142.KL', 'alsalam', 'al-salam'],
    routeAliases: ['5142.KL'],
  },
  {
    code: '5121.KL' as const,
    name: 'Hektar REIT',
    sector: 'Retail',
    aliases: ['hektar'],
  },
  {
    code: '5110.KL' as const,
    name: 'UOA REIT',
    sector: 'Commercial',
    aliases: ['5200.KL', 'uoa'],
    routeAliases: ['5200.KL'],
  },
] as const;

export type AvailableEntity = (typeof AVAILABLE_ENTITIES)[number];
export type AvailableEntityCode = AvailableEntity['code'];

const ENTITY_LOOKUP = new Map<string, AvailableEntityCode>();

for (const entity of AVAILABLE_ENTITIES) {
  ENTITY_LOOKUP.set(entity.code.toLowerCase(), entity.code);

  for (const alias of entity.aliases ?? []) {
    ENTITY_LOOKUP.set(alias.toLowerCase(), entity.code);
  }
}

export const DEFAULT_COMPARE_ENTITY_CODES = AVAILABLE_ENTITIES.slice(0, 4).map(({ code }) => code);

export const ENTITY_STATIC_ROUTE_CODES = AVAILABLE_ENTITIES.flatMap((entity) => [
  entity.code,
  ...(('routeAliases' in entity && entity.routeAliases) ? entity.routeAliases : []),
]);

export function normalizeEntityCode(code?: string | null): AvailableEntityCode | null {
  if (!code) {
    return null;
  }

  return ENTITY_LOOKUP.get(code.trim().toLowerCase()) ?? null;
}

export function normalizeEntityCodes(codes: string[]): AvailableEntityCode[] {
  const normalizedCodes: AvailableEntityCode[] = [];
  const seenCodes = new Set<AvailableEntityCode>();

  for (const code of codes) {
    const normalizedCode = normalizeEntityCode(code);
    if (!normalizedCode || seenCodes.has(normalizedCode)) {
      continue;
    }

    seenCodes.add(normalizedCode);
    normalizedCodes.push(normalizedCode);
  }

  return normalizedCodes;
}

export function getEntityDefinition(code?: string | null): AvailableEntity | undefined {
  const normalizedCode = normalizeEntityCode(code);
  return AVAILABLE_ENTITIES.find((entity) => entity.code === normalizedCode);
}
