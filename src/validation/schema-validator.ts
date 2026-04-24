/**
 * Zod Runtime Validators
 * 
 * Validates normalized data against schemas using Zod.
 * Provides detailed error reporting for schema conformance.
 */

import { z, ZodError } from 'zod';
import {
  NormalizedReitDataSchema,
  NormalizedReitData,
  Metric
} from '../types/schema';

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationWarning {
  path: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationStats {
  totalReferences: number;
  totalMetrics: number;
  totalTimeSeries: number;
  totalObservations: number;
  coverageByCategory: Record<string, number>;
}

// ============================================================================
// Schema Validator Class
// ============================================================================

export class SchemaValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  /**
   * Validate complete normalized data structure
   */
  validate(data: unknown): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Type check
    if (!data || typeof data !== 'object') {
      return this.createResult({
        totalReferences: 0,
        totalMetrics: 0,
        totalTimeSeries: 0,
        totalObservations: 0,
        coverageByCategory: {}
      });
    }

    const typedData = data as NormalizedReitData;

    // Validate with Zod
    const zodResult = this.validateWithZod(NormalizedReitDataSchema, data, 'root');
    if (!zodResult.valid) {
      this.errors.push(...zodResult.errors);
    }

    // Additional semantic validations
    if (typedData.entity) {
      this.validateEntitySemantics(typedData.entity);
    }

    if (typedData.metrics) {
      this.validateMetricsSemantics(typedData.metrics);
    }

    if (typedData.references) {
      this.validateReferencesSemantics(typedData.references);
    }

    // Calculate stats
    const stats: ValidationStats = {
      totalReferences: typedData.references?.length || 0,
      totalMetrics: typedData.metrics?.length || 0,
      totalTimeSeries: typedData.timeSeries?.length || 0,
      totalObservations: typedData.observations?.length || 0,
      coverageByCategory: this.calculateCategoryCoverage(typedData.metrics || [])
    };

    return this.createResult(stats);
  }

  /**
   * Validate a specific schema
   */
  validateWithZod<T>(
    schema: z.ZodType<T>,
    data: unknown,
    path: string
  ): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
      schema.parse(data);
      return { valid: true, errors };
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          errors.push({
            path: `${path}.${issue.path.join('.')}`,
            message: issue.message,
            code: issue.code,
            value: issue.path.length > 0 ? (data as any)?.[issue.path[0]] : undefined
          });
        }
      } else {
        errors.push({
          path,
          message: String(error),
          code: 'unknown_error'
        });
      }
      return { valid: false, errors };
    }
  }

  /**
   * Quick validation - returns boolean only
   */
  isValid(data: unknown): boolean {
    const result = NormalizedReitDataSchema.safeParse(data);
    return result.success;
  }

  // --------------------------------------------------------------------------
  // Semantic Validations
  // --------------------------------------------------------------------------

  private validateEntitySemantics(entity: any): void {
    // Check code format
    if (entity.code && !/^\d{4}\.KL$/.test(entity.code)) {
      this.warnings.push({
        path: 'entity.code',
        message: `Unusual stock code format: ${entity.code}. Expected XXXX.KL`,
        severity: 'low'
      });
    }

    // Check NAV consistency with share price and P/B
    // This would need access to metrics
  }

  private validateMetricsSemantics(metrics: Metric[]): void {
    const metricTypes = new Set<string>();
    const duplicates: string[] = [];

    for (const metric of metrics) {
      const key = `${metric.metricType}-${metric.period?.type}-${metric.period?.fiscalYear}`;
      if (metricTypes.has(key)) {
        duplicates.push(metric.metricType);
      }
      metricTypes.add(key);

      // Validate metric values against known ranges
      this.validateMetricRange(metric);
    }

    if (duplicates.length > 0) {
      this.warnings.push({
        path: 'metrics',
        message: `Duplicate metric types found: ${[...new Set(duplicates)].join(', ')}`,
        severity: 'medium'
      });
    }

    // Check for critical metrics presence
    const requiredMetrics = [
      'dpu', 'gearing_ratio', 'occupancy_rate', 'nav_per_unit'
    ];
    const presentTypes = new Set(metrics.map(m => m.metricType));
    const missing = requiredMetrics.filter(m => !presentTypes.has(m as any));

    if (missing.length > 0) {
      this.warnings.push({
        path: 'metrics',
        message: `Missing recommended metrics: ${missing.join(', ')}`,
        severity: 'medium'
      });
    }
  }

  private validateMetricRange(metric: Metric): void {
    const { metricType, value } = metric;

    if (typeof value !== 'number') return;

    // Range checks for specific metrics
    const ranges: Record<string, { min: number; max: number }> = {
      'gearing_ratio': { min: 0, max: 100 },
      'occupancy_rate': { min: 0, max: 100 },
      'fixed_rate_debt_pct': { min: 0, max: 100 },
      'floating_rate_debt_pct': { min: 0, max: 100 },
      'interest_coverage': { min: 0, max: 50 },
      'price_to_book': { min: 0, max: 5 }
    };

    const range = ranges[metricType];
    if (range && (value < range.min || value > range.max)) {
      this.warnings.push({
        path: `metrics.${metricType}`,
        message: `Value ${value} outside expected range [${range.min}, ${range.max}]`,
        severity: 'medium'
      });
    }
  }

  private validateReferencesSemantics(references: any[]): void {
    const displayIds = new Set<string>();
    const duplicates: string[] = [];

    for (const ref of references) {
      if (displayIds.has(ref.displayId)) {
        duplicates.push(ref.displayId);
      }
      displayIds.add(ref.displayId);
    }

    if (duplicates.length > 0) {
      this.errors.push({
        path: 'references',
        message: `Duplicate display IDs: ${[...new Set(duplicates)].join(', ')}`,
        code: 'duplicate_reference'
      });
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private calculateCategoryCoverage(metrics: Metric[]): Record<string, number> {
    const categories: Record<string, number> = {
      portfolio: 0,
      financial_performance: 0,
      per_share: 0,
      leverage: 0,
      operational: 0,
      risk: 0,
      market: 0
    };

    for (const metric of metrics) {
      const type = metric.metricType;
      // Categorize based on metric type prefix/pattern
      if (type.includes('portfolio') || type.includes('property') || type.includes('asset')) {
        categories.portfolio++;
      } else if (type.includes('revenue') || type.includes('income') || type.includes('profit')) {
        categories.financial_performance++;
      } else if (type.includes('dpu') || type.includes('dividend') || type.includes('yield') || type.includes('payout')) {
        categories.per_share++;
      } else if (type.includes('gearing') || type.includes('borrow') || type.includes('debt') || type.includes('interest') || type.includes('wacd')) {
        categories.leverage++;
      } else if (type.includes('occupancy') || type.includes('wale') || type.includes('tenant') || type.includes('lease') || type.includes('renewal') || type.includes('margin')) {
        categories.operational++;
      } else if (type.includes('risk') || type.includes('sensitivity')) {
        categories.risk++;
      } else if (type.includes('price') || type.includes('premium') || type.includes('discount')) {
        categories.market++;
      }
    }

    return categories;
  }

  private createResult(stats: ValidationStats): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      stats
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createValidator(): SchemaValidator {
  return new SchemaValidator();
}

export function validateData(data: unknown): ValidationResult {
  const validator = new SchemaValidator();
  return validator.validate(data);
}

export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ Validation passed';
  }

  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push(`❌ ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      lines.push(`  - ${err.path}: ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠️ ${result.warnings.length} warning(s):`);
    for (const warn of result.warnings) {
      lines.push(`  - [${warn.severity}] ${warn.path}: ${warn.message}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// CLI Support
// ============================================================================

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node schema-validator.ts <path-to-json-file>');
    process.exit(1);
  }

  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    const validator = new SchemaValidator();
    const result = validator.validate(data);

    console.log(formatValidationErrors(result));
    console.log('\nStats:', JSON.stringify(result.stats, null, 2));

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error('Error reading or parsing file:', error);
    process.exit(1);
  }
}
