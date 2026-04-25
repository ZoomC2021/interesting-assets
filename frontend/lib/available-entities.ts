/**
 * REITs available in the app (public/data + comparison-model loaders).
 * Single source of truth for static export (generateStaticParams) and the UI.
 */
export const AVAILABLE_ENTITIES = [
  { code: '5130.KL' as const, name: 'Atrium REIT' },
  { code: '5106.KL' as const, name: 'Axis REIT' },
  { code: '5176.KL' as const, name: 'Sunway REIT' },
  { code: '5204.KL' as const, name: 'Pavilion REIT' },
  { code: '5227.KL' as const, name: 'IGB REIT' },
  { code: '5235.KL' as const, name: 'KLCC REIT' },
  { code: '5180.KL' as const, name: 'CMMT' },
  { code: '5114.KL' as const, name: 'Al-Salam REIT' },
  { code: '5121.KL' as const, name: 'Hektar REIT' },
  { code: '5200.KL' as const, name: 'UOA REIT' },
] as const;

export type AvailableEntityCode = (typeof AVAILABLE_ENTITIES)[number]['code'];
