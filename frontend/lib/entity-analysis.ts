import { readFile } from 'fs/promises';
import { join } from 'path';

const ANALYSIS_FILE_BY_ENTITY_CODE: Record<string, string> = {
  '5130.KL': 'Atrium_REIT_Malaysia_Analysis.md',
  '5106.KL': 'Axis_REIT_Malaysia_Analysis.md',
  '5176.KL': 'Sunway_REIT_Malaysia_Analysis.md',
  '5204.KL': 'Pavilion_REIT_Malaysia_Analysis.md',
  '5227.KL': 'IGB_REIT_Malaysia_Analysis.md',
  '5235.KL': 'KLCC_REIT_Malaysia_Analysis.md',
  '5180.KL': 'CMMT_REIT_Malaysia_Analysis.md',
  '5121.KL': 'Hektar_REIT_Malaysia_Analysis.md',
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
