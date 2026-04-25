// Shared entity colors for consistent comparison visualizations
export const entityColors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0891b2'];

// Generate grid template for comparison tables
export function getCompareGridTemplate(entityCount: number): string {
  return `200px repeat(${entityCount}, minmax(120px, 1fr))`;
}
