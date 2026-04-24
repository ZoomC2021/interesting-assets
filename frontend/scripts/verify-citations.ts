#!/usr/bin/env ts-node

/**
 * verify-citations.ts - Build-time citation coverage verification script
 * 
 * This script verifies that all surfaced metrics have citations and reports
 * any coverage gaps. It runs as part of the build process to ensure data quality.
 * 
 * Usage:
 *   npx ts-node scripts/verify-citations.ts [--strict]
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Coverage issues found
 *   2 - Configuration error
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// Path to the actual data files in frontend/public/data/
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const MIN_COVERAGE_PERCENTAGE = 100;
const STRICT_MODE = process.argv.includes('--strict');
const IS_RELEASE_BUILD = process.env.NODE_ENV === 'production' || process.argv.includes('--release');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Types (subset needed for verification)
interface Metric {
  metricType: string;
  sourceDisplayIds?: string[];
  isEstimated?: boolean;
}

interface Reference {
  id: string;
  displayId: string;
}

interface NormalizedData {
  entity: { id: string; code: string; name: string };
  metrics: Metric[];
  references: Reference[];
}

// Statistics tracking
interface VerificationStats {
  totalEntities: number;
  totalMetrics: number;
  citedMetrics: number;
  uncitedMetrics: string[];
  orphanCitations: string[];
  entityStats: Map<string, {
    name: string;
    totalMetrics: number;
    citedMetrics: number;
    uncitedMetrics: string[];
  }>;
}

/**
 * Load normalized data files from the data directory
 */
async function loadData(): Promise<NormalizedData[]> {
  const entities: NormalizedData[] = [];
  
  try {
    const files = fs.readdirSync(DATA_DIR);
    // Look for regular .json files (e.g., atrium.json, axis.json)
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('.normalized'));
    
    if (jsonFiles.length === 0) {
      const msg = `${colors.yellow}Warning: No data files found in ${DATA_DIR}${colors.reset}`;
      console.warn(msg);
      
      // Fail on no-data for release/strict gate
      if (STRICT_MODE || IS_RELEASE_BUILD) {
        console.error(`${colors.red}✗ Failing: Data directory is empty or files not found (release/strict mode)${colors.reset}`);
        throw new Error('Citation verification failed: No data files found in ' + DATA_DIR);
      }
      return [];
    }
    
    console.log(`${colors.blue}Found ${jsonFiles.length} data files: ${jsonFiles.join(', ')}${colors.reset}`);
    
    for (const file of jsonFiles) {
      const filePath = path.join(DATA_DIR, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content) as NormalizedData;
        entities.push(data);
        console.log(`${colors.green}✓ Loaded ${file} - ${data.entity?.name || 'unknown entity'}${colors.reset}`);
      } catch (err) {
        console.error(`${colors.red}Error parsing ${file}:${colors.reset}`, err);
        if (STRICT_MODE || IS_RELEASE_BUILD) {
          throw err;
        }
      }
    }
    
    return entities;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      const msg = `${colors.yellow}Warning: Data directory not found: ${DATA_DIR}${colors.reset}`;
      console.warn(msg);
      
      // Fail on no-data for release/strict gate
      if (STRICT_MODE || IS_RELEASE_BUILD) {
        console.error(`${colors.red}✗ Failing: Data directory not found (release/strict mode)${colors.reset}`);
        throw new Error('Citation verification failed: Data directory not found at ' + DATA_DIR);
      }
      return [];
    }
    throw err;
  }
}

/**
 * Verify citation coverage for all entities
 */
function verifyCoverage(entities: NormalizedData[]): VerificationStats {
  const stats: VerificationStats = {
    totalEntities: entities.length,
    totalMetrics: 0,
    citedMetrics: 0,
    uncitedMetrics: [],
    orphanCitations: [],
    entityStats: new Map(),
  };
  
  for (const entity of entities) {
    // Build set of valid reference IDs
    const validReferenceIds = new Set<string>();
    entity.references?.forEach(ref => {
      validReferenceIds.add(ref.id);
      validReferenceIds.add(ref.displayId);
    });
    
    const entityStat = {
      name: entity.entity.name,
      totalMetrics: 0,
      citedMetrics: 0,
      uncitedMetrics: [] as string[],
    };
    
    // Check each metric
    for (const metric of entity.metrics || []) {
      // Skip estimated metrics (they may not have citations yet)
      if (metric.isEstimated) continue;
      
      entityStat.totalMetrics++;
      stats.totalMetrics++;
      
      const citationIds = metric.sourceDisplayIds || [];
      const hasValidCitation = citationIds.some(id => validReferenceIds.has(id));
      
      if (hasValidCitation) {
        entityStat.citedMetrics++;
        stats.citedMetrics++;
      } else {
        const uncitedKey = `${entity.entity.code}:${metric.metricType}`;
        entityStat.uncitedMetrics.push(uncitedKey);
        stats.uncitedMetrics.push(uncitedKey);
      }
      
      // Check for orphan citations
      for (const id of citationIds) {
        if (!validReferenceIds.has(id)) {
          stats.orphanCitations.push(`${entity.entity.code}:${metric.metricType}:${id}`);
        }
      }
    }
    
    stats.entityStats.set(entity.entity.id, entityStat);
  }
  
  return stats;
}

/**
 * Print verification results
 */
function printResults(stats: VerificationStats): void {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║       Citation Coverage Verification Report           ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Entities analyzed: ${stats.totalEntities}`);
  console.log(`  Total metrics: ${stats.totalMetrics}`);
  console.log(`  Cited metrics: ${stats.citedMetrics}`);
  
  const coverage = stats.totalMetrics > 0 
    ? ((stats.citedMetrics / stats.totalMetrics) * 100).toFixed(1) 
    : '0.0';
  
  const coverageColor = parseFloat(coverage) >= MIN_COVERAGE_PERCENTAGE 
    ? colors.green 
    : colors.yellow;
  
  console.log(`  Coverage: ${coverageColor}${coverage}%${colors.reset} (target: ${MIN_COVERAGE_PERCENTAGE}%)\n`);
  
  // Entity details
  if (stats.entityStats.size > 0) {
    console.log(`${colors.blue}Per-Entity Breakdown:${colors.reset}`);
    stats.entityStats.forEach((entityStat, id) => {
      const entityCoverage = entityStat.totalMetrics > 0
        ? ((entityStat.citedMetrics / entityStat.totalMetrics) * 100).toFixed(1)
        : '0.0';
      
      const coverageColor = parseFloat(entityCoverage) >= MIN_COVERAGE_PERCENTAGE
        ? colors.green
        : colors.yellow;
      
      console.log(`  ${entityStat.name} (${id}):`);
      console.log(`    Metrics: ${entityStat.citedMetrics}/${entityStat.totalMetrics} (${coverageColor}${entityCoverage}%${colors.reset})`);
      
      if (entityStat.uncitedMetrics.length > 0) {
        console.log(`    ${colors.yellow}Uncited metrics:${colors.reset}`);
        entityStat.uncitedMetrics.forEach(m => console.log(`      - ${m}`));
      }
    });
    console.log('');
  }
  
  // Issues
  if (stats.uncitedMetrics.length > 0) {
    console.log(`${colors.yellow}⚠ Uncited Metrics (${stats.uncitedMetrics.length}):${colors.reset}`);
    stats.uncitedMetrics.forEach(m => console.log(`  - ${m}`));
    console.log('');
  }
  
  if (stats.orphanCitations.length > 0) {
    console.log(`${colors.red}✗ Orphan Citations (${stats.orphanCitations.length}):${colors.reset}`);
    stats.orphanCitations.forEach(c => console.log(`  - ${c}`));
    console.log('');
  }
  
  // Final status
  const passed = parseFloat(coverage) >= MIN_COVERAGE_PERCENTAGE && stats.orphanCitations.length === 0;
  
  if (passed) {
    console.log(`${colors.green}✓ All citation checks passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Citation coverage issues found.${colors.reset}\n`);
  }
}

/**
 * Main verification function
 */
async function main(): Promise<number> {
  console.log(`${colors.blue}Citation Coverage Verification${colors.reset}`);
  console.log(`${colors.gray}Mode: ${STRICT_MODE ? 'strict' : IS_RELEASE_BUILD ? 'release' : 'lenient'}${colors.reset}`);
  console.log(`${colors.gray}Data directory: ${DATA_DIR}${colors.reset}\n`);
  
  try {
    // Load data
    console.log('Loading data files...');
    const entities = await loadData();
    
    if (entities.length === 0) {
      // This should only happen in non-strict mode (strict mode would have thrown)
      console.warn(`${colors.yellow}No data found - skipping verification${colors.reset}`);
      return 0; // Soft failure in non-strict mode
    }
    
    console.log(`\nLoaded ${entities.length} entities\n`);
    
    // Verify coverage
    const stats = verifyCoverage(entities);
    
    // Print results
    printResults(stats);
    
    // Determine exit code
    const coverage = stats.totalMetrics > 0 
      ? (stats.citedMetrics / stats.totalMetrics) * 100 
      : 0;
    
    const isStrict = STRICT_MODE || IS_RELEASE_BUILD;
    
    if (isStrict) {
      if (coverage < MIN_COVERAGE_PERCENTAGE) {
        console.log(`${colors.red}✗ Strict mode: Coverage ${coverage.toFixed(1)}% below ${MIN_COVERAGE_PERCENTAGE}% threshold${colors.reset}`);
        return 1;
      }
      if (stats.orphanCitations.length > 0) {
        console.log(`${colors.red}✗ Strict mode: ${stats.orphanCitations.length} orphan citations found${colors.reset}`);
        return 1;
      }
      console.log(`${colors.green}✓ All strict checks passed${colors.reset}\n`);
    } else {
      // Warning in non-strict mode
      if (coverage < MIN_COVERAGE_PERCENTAGE) {
        console.log(`${colors.yellow}Warning: Coverage below ${MIN_COVERAGE_PERCENTAGE}% threshold${colors.reset}`);
      }
    }
    
    return 0;
  } catch (err) {
    console.error(`${colors.red}✗ Verification failed:${colors.reset}`, err);
    const isStrict = STRICT_MODE || IS_RELEASE_BUILD;
    return isStrict ? 1 : 0;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(code => process.exit(code));
}

export { verifyCoverage, loadData, type VerificationStats };
