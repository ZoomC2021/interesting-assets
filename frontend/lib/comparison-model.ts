/**
 * Comparison model for merging and comparing multiple REIT entities
 */

import type {
  NormalizedReitData,
  EntityExtended,
  EntityComparison,
  Metric,
  MetricType,
  TimeSeries,
  RiskAssessment,
  RiskSeverity,
} from '@/types/frontend';
import { normalizeEntityCode } from '@/lib/available-entities';

// ============================================================================
// Entity Comparison Types
// ============================================================================

export interface MetricComparison {
  metricType: MetricType;
  values: Array<{
    entityId: string;
    entityCode: string;
    entityName: string;
    value: number | string | boolean | null;
    unit: string;
    isHigherBetter: boolean | null;
  }>;
  winner?: {
    entityId: string;
    entityCode: string;
    reason: string;
  };
}

export interface SideBySideComparison {
  entities: EntityComparison[];
  metricCategories: Array<{
    category: string;
    metrics: MetricComparison[];
  }>;
  riskComparison: Array<{
    category: string;
    severities: Array<{
      entityId: string;
      entityCode: string;
      severity: RiskSeverity;
    }>;
  }>;
  overallSummary: {
    totalMetrics: number;
    entitiesWithData: number;
    lastUpdated: string;
  };
}

// ============================================================================
// Entity Data Loading
// ============================================================================

export async function loadEntityData(entityCode: string): Promise<NormalizedReitData | null> {
  try {
    // Map canonical entity codes to data files using dynamic imports.
    // Alias handling lives in available-entities so routes and loaders agree.
    const fileMap: Record<string, () => Promise<unknown>> = {
      '5130.KL': () => import('@/public/data/atrium.json'),
      '5106.KL': () => import('@/public/data/axis.json'),
      '5176.KL': () => import('@/public/data/sunway.json'),
      '5212.KL': () => import('@/public/data/pavilion.json'),
      '5227.KL': () => import('@/public/data/igb.json'),
      '5235SS': () => import('@/public/data/klcc.json'),
      '5180.KL': () => import('@/public/data/cmmt.json'),
      '5280.KL': () => import('@/public/data/kip.json'),
      '5269.KL': () => import('@/public/data/alsalam.json'),
      '5121.KL': () => import('@/public/data/hektar.json'),
      '5110.KL': () => import('@/public/data/uoa.json'),
      '5338.KL': () => import('@/public/data/paradigm.json'),
      '5123.KL': () => import('@/public/data/sentral.json'),
      '5120.KL': () => import('@/public/data/amfirst.json'),
      '5111.KL': () => import('@/public/data/tower.json'),
    };

    const normalizedCode = normalizeEntityCode(entityCode);
    const importFn = normalizedCode ? fileMap[normalizedCode] : undefined;
    if (!importFn) {
      console.error(`Unknown entity code: ${entityCode}`);
      return null;
    }

    const loadedModule = await importFn();
    // Dynamic imports return the module with a 'default' property for JSON files
    return (loadedModule as { default: NormalizedReitData }).default || loadedModule as NormalizedReitData;
  } catch (error) {
    console.error(`Error loading entity data for ${entityCode}:`, error);
    return null;
  }
}

export async function loadMultipleEntities(entityCodes: string[]): Promise<NormalizedReitData[]> {
  const promises = entityCodes.map(code => loadEntityData(code));
  const results = await Promise.all(promises);
  return results.filter((data): data is NormalizedReitData => data !== null);
}

// ============================================================================
// Entity Extension
// ============================================================================

export function extendEntity(entity: NormalizedReitData['entity'], data: NormalizedReitData): EntityExtended {
  // Calculate portfolio metrics from available data
  const totalAssets = data.metrics.find(m => m.metricType === 'total_assets')?.value as number || 0;
  const investmentProperties = data.metrics.find(m => m.metricType === 'investment_properties')?.value as number || 0;
  const propertyCount = data.metrics.find(m => m.metricType === 'property_count')?.value as number || 0;
  const netLettableArea = data.metrics.find(m => m.metricType === 'net_lettable_area')?.value as number || 0;
  
  // Extract geographic distribution from observations or calculate default
  const geoObservation = data.observations.find(o => 
    o.content.toLowerCase().includes('klang valley') || 
    o.observationType === 'portfolio_analysis'
  );
  
  const geographicDistribution = [
    {
      region: 'Klang Valley',
      propertyCount: Math.round(propertyCount * 0.78), // Default assumption
      percentageOfPortfolio: 78,
    },
    {
      region: 'Other',
      propertyCount: Math.round(propertyCount * 0.22),
      percentageOfPortfolio: 22,
    },
  ];
  
  return {
    ...entity,
    portfolio: {
      totalProperties: propertyCount,
      totalAssetsRM: totalAssets,
      investmentPropertiesRM: investmentProperties,
      netLettableAreaSqFt: netLettableArea,
      geographicDistribution,
    },
  };
}

// ============================================================================
// Comparison Building
// ============================================================================

export function buildEntityComparison(data: NormalizedReitData): EntityComparison {
  return {
    entity: extendEntity(data.entity, data),
    metrics: data.metrics,
    timeSeries: data.timeSeries,
    riskAssessment: data.riskAssessment,
  };
}

export function buildSideBySideComparison(datasets: NormalizedReitData[]): SideBySideComparison {
  const entityComparisons = datasets.map(buildEntityComparison);
  
  // Get all unique metric types across entities
  const allMetricTypes = new Set<MetricType>();
  datasets.forEach(data => {
    data.metrics.forEach(m => allMetricTypes.add(m.metricType));
  });
  
  // Build metric comparisons
  const metricComparisons: MetricComparison[] = [];
  allMetricTypes.forEach(metricType => {
    const values = entityComparisons.map(ec => {
      const metric = ec.metrics.find(m => m.metricType === metricType);
      return {
        entityId: ec.entity.id,
        entityCode: ec.entity.code,
        entityName: ec.entity.name,
        value: metric?.value ?? null,
        unit: metric?.unit || '',
        isHigherBetter: null, // Would need metric definition
      };
    });
    
    // Determine winner for numeric metrics
    let winner: MetricComparison['winner'] = undefined;
    const numericValues = values.filter(v => typeof v.value === 'number' && v.value !== null);
    if (numericValues.length >= 2) {
      // For metrics where higher is typically better
      const isHigherBetter = !['gearing_ratio', 'floating_rate_debt_pct', 'top_tenant_concentration'].includes(metricType);
      
      const sorted = [...numericValues].sort((a, b) => 
        isHigherBetter 
          ? (b.value as number) - (a.value as number)
          : (a.value as number) - (b.value as number)
      );
      
      if (sorted[0].value !== sorted[sorted.length - 1]?.value) {
        winner = {
          entityId: sorted[0].entityId,
          entityCode: sorted[0].entityCode,
          reason: isHigherBetter ? 'Highest value' : 'Lowest value (better)',
        };
      }
    }
    
    metricComparisons.push({
      metricType,
      values,
      winner,
    });
  });
  
  // Group by category
  const categories: Record<string, MetricComparison[]> = {};
  metricComparisons.forEach(mc => {
    // Simple category mapping based on metric type prefix
    let category = 'Other';
    if (mc.metricType.includes('dpu') || mc.metricType.includes('yield') || mc.metricType.includes('payout')) {
      category = 'Distributions';
    } else if (mc.metricType.includes('revenue') || mc.metricType.includes('income') || mc.metricType.includes('profit')) {
      category = 'Financial Performance';
    } else if (mc.metricType.includes('gearing') || mc.metricType.includes('debt') || mc.metricType.includes('interest')) {
      category = 'Leverage & Debt';
    } else if (mc.metricType.includes('occupancy') || mc.metricType.includes('wale') || mc.metricType.includes('tenant')) {
      category = 'Operational';
    } else if (mc.metricType.includes('nav') || mc.metricType.includes('price') || mc.metricType.includes('market')) {
      category = 'Valuation';
    } else if (mc.metricType.includes('portfolio') || mc.metricType.includes('property') || mc.metricType.includes('asset')) {
      category = 'Portfolio';
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(mc);
  });
  
  const metricCategories = Object.entries(categories).map(([category, metrics]) => ({
    category,
    metrics,
  }));
  
  // Build risk comparison
  const riskCategories = ['concentration', 'gearing', 'interest_rate', 'tenant_rollover', 'liquidity', 'governance'] as const;
  const riskComparison = riskCategories.map(category => {
    const severities = entityComparisons.map(ec => {
      const riskFactor = ec.riskAssessment.riskFactors.find(rf => rf.category === category);
      return {
        entityId: ec.entity.id,
        entityCode: ec.entity.code,
        severity: riskFactor?.severity || 'low',
      };
    });
    
    return {
      category,
      severities,
    };
  });
  
  return {
    entities: entityComparisons,
    metricCategories,
    riskComparison,
    overallSummary: {
      totalMetrics: metricComparisons.length,
      entitiesWithData: datasets.length,
      lastUpdated: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Risk Helpers
// ============================================================================

export function getRiskSeverityColor(severity: RiskSeverity): string {
  switch (severity) {
    case 'low':
      return '#22c55e'; // green-500
    case 'medium':
      return '#eab308'; // yellow-500
    case 'high':
      return '#f97316'; // orange-500
    case 'critical':
      return '#ef4444'; // red-500
    default:
      return '#94a3b8'; // slate-400
  }
}

export function getRiskSeverityEmoji(severity: RiskSeverity): string {
  switch (severity) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🟠';
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}

export function getRiskSeverityLabel(severity: RiskSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
