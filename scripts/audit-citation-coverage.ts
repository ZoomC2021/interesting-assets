/**
 * Citation Coverage Audit Script
 *
 * Audits pre-orphan direct linkage coverage across all REITs.
 * Reports weakly linked references (those only linked via orphan-linker)
 * to make citation drift visible and enforceable in workflow.
 *
 * Run: npx ts-node scripts/audit-citation-coverage.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CitationLinker, createCitationLinker } from '../src/adapters/citation-linker';

// ============================================================================
// Entity Configuration
// ============================================================================

interface EntityConfig {
  name: string;
  slug: string;
  entityCode: string;
  prefix: string;
  adapterFactory: (linker: CitationLinker) => any;
}

// Dynamic imports for adapters
async function loadAdapters() {
  const { createAtriumAdapter } = await import('../src/adapters/atrium-adapter');
  const { createAxisAdapter } = await import('../src/adapters/axis-adapter');
  const { createSunwayAdapter } = await import('../src/adapters/sunway-adapter');
  const { createPavilionAdapter } = await import('../src/adapters/pavilion-adapter');
  const { createIgbAdapter } = await import('../src/adapters/igb-adapter');
  const { createUoaAdapter } = await import('../src/adapters/uoa-adapter');
  const { createCMMTAdapter } = await import('../src/adapters/cmmt-adapter');
  const { createAlSalamAdapter } = await import('../src/adapters/alsalam-adapter');
  const { createKIPAdapter } = await import('../src/adapters/kip-adapter');
  const { createParadigmAdapter } = await import('../src/adapters/paradigm-adapter');
  const { createKlccAdapter } = await import('../src/adapters/klcc-adapter');
  const { createHektarAdapter } = await import('../src/adapters/hektar-adapter');
  const { createSentralAdapter } = await import('../src/adapters/sentral-adapter');
  const { createAmFIRSTAdapter } = await import('../src/adapters/amfirst-adapter');
  const { createTowerAdapter } = await import('../src/adapters/tower-adapter');
  const { createYtlAdapter } = await import('../src/adapters/ytl-adapter');

  return [
    { name: 'Atrium REIT', slug: 'atrium', entityCode: '5130.KL', prefix: 'T', adapterFactory: createAtriumAdapter },
    { name: 'Axis REIT', slug: 'axis', entityCode: '5106.KL', prefix: 'A', adapterFactory: createAxisAdapter },
    { name: 'Sunway REIT', slug: 'sunway', entityCode: '5176.KL', prefix: 'S', adapterFactory: createSunwayAdapter },
    { name: 'Pavilion REIT', slug: 'pavilion', entityCode: '5212.KL', prefix: 'P', adapterFactory: createPavilionAdapter },
    { name: 'IGB REIT', slug: 'igb', entityCode: '5227.KL', prefix: 'I', adapterFactory: createIgbAdapter },
    { name: 'UOA REIT', slug: 'uoa', entityCode: '5118.KL', prefix: 'U', adapterFactory: createUoaAdapter },
    { name: 'CMMT', slug: 'cmmt', entityCode: '5180.KL', prefix: 'C', adapterFactory: createCMMTAdapter },
    { name: 'Al-Salam REIT', slug: 'alsalam', entityCode: '5119.KL', prefix: 'L', adapterFactory: createAlSalamAdapter },
    { name: 'KIP REIT', slug: 'kip', entityCode: '5280.KL', prefix: 'K', adapterFactory: createKIPAdapter },
    { name: 'Paradigm REIT', slug: 'paradigm', entityCode: '5125.KL', prefix: 'R', adapterFactory: createParadigmAdapter },
    { name: 'KLCC REIT', slug: 'klcc', entityCode: '5235.SS', prefix: 'M', adapterFactory: createKlccAdapter },
    { name: 'Hektar REIT', slug: 'hektar', entityCode: '5120.KL', prefix: 'H', adapterFactory: createHektarAdapter },
    { name: 'Sentral REIT', slug: 'sentral', entityCode: '5192.KL', prefix: 'N', adapterFactory: createSentralAdapter },
    { name: 'AmFIRST REIT', slug: 'amfirst', entityCode: '5120.KL', prefix: 'F', adapterFactory: createAmFIRSTAdapter },
    { name: 'Tower REIT', slug: 'tower', entityCode: '5119.KL', prefix: 'W', adapterFactory: createTowerAdapter },
    { name: 'YTL REIT', slug: 'ytl', entityCode: '5109.KL', prefix: 'Y', adapterFactory: createYtlAdapter },
  ];
}

// ============================================================================
// Linkage Analysis Types
// ============================================================================

interface LinkageDetail {
  displayId: string;
  fact: string;
  directLinks: Array<{
    linkType: string;
    linkedBy: string;
    context: string;
  }>;
  orphanLinks: Array<{
    linkType: string;
    linkedBy: string;
    context: string;
  }>;
  isWeaklyLinked: boolean;
}

interface EntityAuditResult {
  entityName: string;
  entityCode: string;
  totalReferences: number;
  directlyLinkedCount: number;
  orphanLinkedCount: number;
  weaklyLinkedCount: number;
  directLinkagePercentage: number;
  weaklyLinkedReferences: LinkageDetail[];
  linkageByBuilder: Record<string, number>;
}

interface AuditReport {
  timestamp: string;
  totalEntities: number;
  entities: EntityAuditResult[];
  summary: {
    totalReferences: number;
    totalDirectlyLinked: number;
    totalOrphanLinked: number;
    overallDirectLinkagePercentage: number;
    entitiesWithWeakLinks: number;
  };
}

// ============================================================================
// Audit Logic
// ============================================================================

/**
 * Determine if a link is an orphan link (from linkAllOrphans)
 */
function isOrphanLink(link: any): boolean {
  return link.linkedBy === 'orphan-linker';
}

/**
 * Analyze linkage for a single entity
 */
function analyzeEntityLinkage(
  linker: CitationLinker,
  entityConfig: EntityConfig,
  sourceData: Record<string, any>
): EntityAuditResult {
  const adapter = entityConfig.adapterFactory(linker);
  adapter.processReferences(sourceData);

  // Build all components to create direct links (before orphan linking)
  adapter.buildEntity?.();
  adapter.buildMetrics?.();
  adapter.buildRiskAssessment?.();
  adapter.buildObservations?.();
  adapter.buildTimeSeries?.();

  // Get pre-orphan linkage state
  const allRefs = Array.from(linker['references'].values()) as any[];
  const links = linker['links'] as any[];

  const linkMap = new Map<string, any[]>();
  for (const link of links) {
    const existing = linkMap.get(link.displayId) || [];
    existing.push(link);
    linkMap.set(link.displayId, existing);
  }

  // Track builder usage
  const linkageByBuilder: Record<string, number> = {};
  for (const link of links) {
    const builder = link.linkedBy || 'unknown';
    linkageByBuilder[builder] = (linkageByBuilder[builder] || 0) + 1;
  }

  const weaklyLinkedReferences: LinkageDetail[] = [];
  let directlyLinkedCount = 0;
  let orphanLinkedCount = 0;

  for (const ref of allRefs) {
    const refLinks = linkMap.get(ref.displayId) || [];
    const directLinks = refLinks.filter(l => !isOrphanLink(l));
    const orphanLinks = refLinks.filter(l => isOrphanLink(l));

    const hasDirectLink = directLinks.length > 0;
    const hasOrphanLink = orphanLinks.length > 0;

    if (hasDirectLink) {
      directlyLinkedCount++;
    } else if (hasOrphanLink) {
      orphanLinkedCount++;
    }

    // Weakly linked = only has orphan links (no direct links)
    const isWeaklyLinked = !hasDirectLink && hasOrphanLink;

    if (isWeaklyLinked) {
      weaklyLinkedReferences.push({
        displayId: ref.displayId,
        fact: ref.fact?.substring(0, 100) + (ref.fact?.length > 100 ? '...' : ''),
        directLinks: directLinks.map(l => ({
          linkType: l.linkType,
          linkedBy: l.linkedBy,
          context: l.context
        })),
        orphanLinks: orphanLinks.map(l => ({
          linkType: l.linkType,
          linkedBy: l.linkedBy,
          context: l.context
        })),
        isWeaklyLinked
      });
    }
  }

  const totalReferences = allRefs.length;
  const directLinkagePercentage = totalReferences > 0
    ? Math.round((directlyLinkedCount / totalReferences) * 100)
    : 0;

  return {
    entityName: entityConfig.name,
    entityCode: entityConfig.entityCode,
    totalReferences,
    directlyLinkedCount,
    orphanLinkedCount,
    weaklyLinkedCount: weaklyLinkedReferences.length,
    directLinkagePercentage,
    weaklyLinkedReferences,
    linkageByBuilder
  };
}

/**
 * Run full citation coverage audit
 */
async function runAudit(): Promise<AuditReport> {
  const entities = await loadAdapters();
  const results: EntityAuditResult[] = [];

  for (const entityConfig of entities) {
    const refFilePath = path.join(__dirname, '..', `${entityConfig.slug}-reit-references.json`);

    if (!fs.existsSync(refFilePath)) {
      console.log(`⚠️  Skipping ${entityConfig.name}: references file not found`);
      continue;
    }

    try {
      const sourceData = JSON.parse(fs.readFileSync(refFilePath, 'utf-8'));
      const linker = createCitationLinker();
      const result = analyzeEntityLinkage(linker, entityConfig, sourceData);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error auditing ${entityConfig.name}:`, (error as Error).message);
    }
  }

  const summary = {
    totalReferences: results.reduce((sum, r) => sum + r.totalReferences, 0),
    totalDirectlyLinked: results.reduce((sum, r) => sum + r.directlyLinkedCount, 0),
    totalOrphanLinked: results.reduce((sum, r) => sum + r.orphanLinkedCount, 0),
    overallDirectLinkagePercentage: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.directLinkagePercentage, 0) / results.length)
      : 0,
    entitiesWithWeakLinks: results.filter(r => r.weaklyLinkedCount > 0).length
  };

  return {
    timestamp: new Date().toISOString(),
    totalEntities: results.length,
    entities: results,
    summary
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate console report
 */
function generateConsoleReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════════════════════════════╗');
  lines.push('║           CITATION COVERAGE AUDIT REPORT                                     ║');
  lines.push('╚══════════════════════════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Entities Audited: ${report.totalEntities}`);
  lines.push('');

  // Summary section
  lines.push('┌──────────────────────────────────────────────────────────────────────────────┐');
  lines.push('│ SUMMARY                                                                      │');
  lines.push('├──────────────────────────────────────────────────────────────────────────────┤');
  lines.push(`│ Total References:        ${report.summary.totalReferences.toString().padStart(6)}                                       │`);
  lines.push(`│ Directly Linked:         ${report.summary.totalDirectlyLinked.toString().padStart(6)}  (${report.summary.overallDirectLinkagePercentage}% coverage)                      │`);
  lines.push(`│ Orphan-Linked Only:      ${report.summary.totalOrphanLinked.toString().padStart(6)}                                       │`);
  lines.push(`│ Entities with Weak Links:  ${report.summary.entitiesWithWeakLinks.toString().padStart(6)}                                       │`);
  lines.push('└──────────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Per-entity details
  for (const entity of report.entities) {
    const status = entity.weaklyLinkedCount === 0 ? '✅' : '⚠️ ';
    const linkageColor = entity.directLinkagePercentage >= 80 ? '' :
                         entity.directLinkagePercentage >= 50 ? '' : '';

    lines.push(`${status} ${entity.entityName} (${entity.entityCode})`);
    lines.push(`   References: ${entity.totalReferences} | Direct: ${entity.directlyLinkedCount} | Orphan-only: ${entity.weaklyLinkedCount}`);
    lines.push(`   Direct Linkage: ${entity.directLinkagePercentage}%`);

    // Show builder breakdown
    const builderEntries = Object.entries(entity.linkageByBuilder)
      .filter(([name]) => name !== 'orphan-linker')
      .sort((a, b) => b[1] - a[1]);

    if (builderEntries.length > 0) {
      lines.push(`   Builders: ${builderEntries.map(([name, count]) => `${name}(${count})`).join(', ')}`);
    }

    // Show weakly linked references
    if (entity.weaklyLinkedReferences.length > 0) {
      lines.push(`   Weakly Linked References (${entity.weaklyLinkedReferences.length}):`);
      for (const weak of entity.weaklyLinkedReferences.slice(0, 5)) {
        lines.push(`      - ${weak.displayId}: ${weak.fact.substring(0, 60)}...`);
      }
      if (entity.weaklyLinkedReferences.length > 5) {
        lines.push(`      ... and ${entity.weaklyLinkedReferences.length - 5} more`);
      }
    }

    lines.push('');
  }

  // Recommendations
  lines.push('┌──────────────────────────────────────────────────────────────────────────────┐');
  lines.push('│ RECOMMENDATIONS                                                              │');
  lines.push('├──────────────────────────────────────────────────────────────────────────────┤');

  if (report.summary.entitiesWithWeakLinks === 0) {
    lines.push('│ ✅ All references have direct linkage. No action required.                   │');
  } else {
    lines.push('│ ⚠️  Found weakly linked references (orphan-linked only).                      │');
    lines.push('│                                                                              │');
    lines.push('│ Action items:                                                                │');
    lines.push('│ 1. Review weakly linked references listed above                              │');
    lines.push('│ 2. Add explicit citation links in adapter builders for these references        │');
    lines.push('│ 3. Run audit again to verify improvement                                     │');
    lines.push('│                                                                              │');
    lines.push('│ To fix: Add sourceDisplayIds to metrics/risk factors/observations            │');
    lines.push('│         or add explicit linkCitation() calls in adapter builders             │');
  }

  lines.push('└──────────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate JSON report for programmatic use
 */
function generateJsonReport(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

// ============================================================================
// CLI Support
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'console';
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

  console.log('🔍 Running citation coverage audit...\n');

  const report = await runAudit();

  if (format === 'json') {
    const jsonOutput = generateJsonReport(report);
    if (outputFile) {
      fs.writeFileSync(outputFile, jsonOutput);
      console.log(`✅ JSON report written to: ${outputFile}`);
    } else {
      console.log(jsonOutput);
    }
  } else {
    const consoleOutput = generateConsoleReport(report);
    console.log(consoleOutput);

    if (outputFile) {
      fs.writeFileSync(outputFile, consoleOutput);
      console.log(`✅ Console report written to: ${outputFile}`);
    }
  }

  // Exit with error code if weak links found (for CI use)
  if (report.summary.entitiesWithWeakLinks > 0 && args.includes('--strict')) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { runAudit, generateConsoleReport, generateJsonReport };
export type { AuditReport, EntityAuditResult, LinkageDetail };
