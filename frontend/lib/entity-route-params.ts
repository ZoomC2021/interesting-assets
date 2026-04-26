/**
 * Route-only entity params for static generation.
 * Keep this separate from the client-side entity registry so editing the
 * client data wiring doesn't force Fast Refresh to fall back to a full reload.
 */

export const ENTITY_STATIC_ROUTE_CODES = [
  '5130.KL',
  '5106.KL',
  '5176.KL',
  '5212.KL',
  '5204.KL',
  '5227.KL',
  '5235SS',
  '5235.KL',
  '5180.KL',
  '5269.KL',
  '5121.KL',
  '5110.KL',
  '5200.KL',
  '5338.KL',
  '5123.KL',
  '5120.KL',
] as const;

export const DEFAULT_COMPARE_ENTITY_CODES = [
  '5130.KL',
  '5106.KL',
  '5176.KL',
  '5212.KL',
] as const;
