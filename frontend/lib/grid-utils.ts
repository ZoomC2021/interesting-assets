// Shared entity colors for consistent comparison visualizations
export const entityColors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0891b2'];

export const compareMetricColumnWidth = 240;
export const compareEntityColumnWidth = 176;

// Generate grid template for comparison tables
export function getCompareGridTemplate(
  entityCount: number,
  options?: {
    metricColumnWidth?: number;
    entityColumnWidth?: number;
  }
): string {
  const metricColumnWidth = options?.metricColumnWidth ?? compareMetricColumnWidth;
  const entityColumnWidth = options?.entityColumnWidth ?? compareEntityColumnWidth;

  return `${metricColumnWidth}px repeat(${entityCount}, ${entityColumnWidth}px)`;
}

export function getCompareTableMinWidth(
  entityCount: number,
  options?: {
    metricColumnWidth?: number;
    entityColumnWidth?: number;
  }
): number {
  const metricColumnWidth = options?.metricColumnWidth ?? compareMetricColumnWidth;
  const entityColumnWidth = options?.entityColumnWidth ?? compareEntityColumnWidth;

  return metricColumnWidth + entityCount * entityColumnWidth;
}
