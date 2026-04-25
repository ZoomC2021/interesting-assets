import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Map every entity code *and* known route alias to the markdown memo file on
 * disk. Route aliases (e.g. `5204.KL` vs the canonical `5212.KL`) are both
 * valid entry points because `ENTITY_STATIC_ROUTE_CODES` statically generates
 * both paths, so we keep all of them keyed here instead of relying on the
 * client-side normalizer (which would require importing client code into a
 * server module).
 */
const ANALYSIS_FILE_BY_ENTITY_CODE: Record<string, string> = {
  // Atrium
  '5130.KL': 'Atrium_REIT_Malaysia_Analysis.md',
  // Axis
  '5106.KL': 'Axis_REIT_Malaysia_Analysis.md',
  // Sunway
  '5176.KL': 'Sunway_REIT_Malaysia_Analysis.md',
  // Pavilion (canonical 5212.KL, legacy route alias 5204.KL)
  '5212.KL': 'Pavilion_REIT_Malaysia_Analysis.md',
  '5204.KL': 'Pavilion_REIT_Malaysia_Analysis.md',
  // IGB
  '5227.KL': 'IGB_REIT_Malaysia_Analysis.md',
  // KLCC (canonical 5235SS, legacy route alias 5235.KL)
  '5235SS': 'KLCC_REIT_Malaysia_Analysis.md',
  '5235.KL': 'KLCC_REIT_Malaysia_Analysis.md',
  // CMMT
  '5180.KL': 'CMMT_REIT_Malaysia_Analysis.md',
  // Al-Salam: no markdown memo checked in yet (canonical 5114.KL, alias 5142.KL).
  // Hektar
  '5121.KL': 'Hektar_REIT_Malaysia_Analysis.md',
  // UOA (canonical 5110.KL, legacy route alias 5200.KL)
  '5110.KL': 'UOA_REIT_Malaysia_Analysis.md',
  '5200.KL': 'UOA_REIT_Malaysia_Analysis.md',
};

export async function loadEntityAnalysisMarkdown(entityCode: string): Promise<string | null> {
  const filename = ANALYSIS_FILE_BY_ENTITY_CODE[entityCode];

  if (!filename) {
    return null;
  }

  try {
    return await readFile(join(process.cwd(), '..', filename), 'utf8');
  } catch {
    return null;
  }
}
