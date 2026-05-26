/**
 * Citation Coverage Checker
 * 
 * Verifies that all references have at least one linkage (no orphans).
 * Ensures 100% citation coverage as per contract requirements.
 */

import { CitationLinker } from '../adapters/citation-linker';

// ============================================================================
// Coverage Check Result
// ============================================================================

export interface CoverageCheckResult {
  passed: boolean;
  totalReferences: number;
  totalCitations: number;
  orphanCount: number;
  orphanPercentage: number;
  orphanReferences: string[];
  coverageByCategory: Record<string, {
    total: number;
    cited: number;
    coveragePct: number;
  }>;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Citation Checker Class
// ============================================================================

export class CitationChecker {
  private linker: CitationLinker;

  constructor(linker: CitationLinker) {
    this.linker = linker;
  }

  /**
   * Run comprehensive citation coverage check
   */
  check(): CoverageCheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get coverage from linker
    const coverage = this.linker.calculateCoverage();

    // Validate counts
    const totalRefs = coverage.totalCitations;
    const orphanCount = coverage.orphanReferences.length;
    const orphanPercentage = totalRefs > 0 ? (orphanCount / totalRefs) * 100 : 0;

    // Check for orphans (critical)
    if (orphanCount > 0) {
      errors.push(
        `Found ${orphanCount} orphan references (${orphanPercentage.toFixed(1)}%): ` +
        coverage.orphanReferences.slice(0, 10).join(', ') +
        (orphanCount > 10 ? ` and ${orphanCount - 10} more...` : '')
      );
    }

    // Check for unreferenced metrics (warning)
    if (coverage.unreferencedMetrics.length > 0) {
      warnings.push(
        `Unreferenced metric types: ${coverage.unreferencedMetrics.join(', ')}`
      );
    }

    // Check for unreferenced observations (warning)
    if (coverage.unreferencedObservations.length > 0) {
      warnings.push(
        `Unreferenced observation types: ${coverage.unreferencedObservations.join(', ')}`
      );
    }

    // Validate coverage by category
    for (const [category, s] of Object.entries(coverage.coverageByCategory)) {
      const c: any = s;
      if (c?.coveragePct < 50) {
        warnings.push(
          `Low citation coverage for ${category}: ${c?.coveragePct}% (${c?.cited}/${c?.total})`
        );
      }
    }

    // Overall pass/fail
    // Contract requirement: 100% coverage, zero orphans
    const passed = orphanCount === 0;

    return {
      passed,
      totalReferences: coverage.totalFacts,
      totalCitations: totalRefs,
      orphanCount,
      orphanPercentage,
      orphanReferences: coverage.orphanReferences,
      coverageByCategory: coverage.coverageByCategory,
      errors,
      warnings
    };
  }

  /**
   * Validate specific reference exists and is linked
   */
  validateReference(displayId: string): {
    exists: boolean;
    linked: boolean;
    linkCount: number;
  } {
    const ref = this.linker.lookup(displayId);
    
    if (!ref) {
      return { exists: false, linked: false, linkCount: 0 };
    }

    // Count links for this reference
    const links = this.linker['links'] as any[];
    const linkCount = links.filter(l => l.displayId === displayId).length;

    return {
      exists: true,
      linked: linkCount > 0,
      linkCount
    };
  }

  /**
   * Get detailed coverage report
   */
  generateReport(): string {
    const result = this.check();
    
    const lines: string[] = [];
    lines.push('=== Citation Coverage Report ===');
    lines.push('');
    lines.push(`Total References: ${result.totalCitations}`);
    lines.push(`Linked Facts: ${result.totalReferences}`);
    lines.push(`Orphan References: ${result.orphanCount} (${result.orphanPercentage.toFixed(2)}%)`);
    lines.push('');

    if (result.orphanReferences.length > 0) {
      lines.push('⚠️ Orphan References:');
      for (const orphan of result.orphanReferences.slice(0, 20)) {
        const ref = this.linker.lookup(orphan);
        lines.push(`  - ${orphan}: ${ref?.fact?.substring(0, 60) || 'N/A'}...`);
      }
      if (result.orphanReferences.length > 20) {
        lines.push(`  ... and ${result.orphanReferences.length - 20} more`);
      }
      lines.push('');
    }

    lines.push('Coverage by Source Category:');
    for (const [category, s] of Object.entries(result.coverageByCategory)) {
      const c: any = s;
      const status = c?.coveragePct === 100 ? '✅' : c?.coveragePct >= 90 ? '⚠️' : '❌';
      lines.push(`  ${status} ${category}: ${c?.cited}/${c?.total} (${c?.coveragePct}%)`);
    }
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('❌ Errors:');
      for (const error of result.errors) {
        lines.push(`  - ${error}`);
      }
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('⚠️ Warnings:');
      for (const warning of result.warnings) {
        lines.push(`  - ${warning}`);
      }
      lines.push('');
    }

    lines.push(result.passed ? '✅ Coverage check PASSED' : '❌ Coverage check FAILED');

    return lines.join('\n');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createCitationChecker(linker: CitationLinker): CitationChecker {
  return new CitationChecker(linker);
}

export function checkCoverage(linker: CitationLinker): CoverageCheckResult {
  const checker = new CitationChecker(linker);
  return checker.check();
}

// ============================================================================
// CLI Support
// ============================================================================

if (require.main === module) {
  // This would need to be run with a populated CitationLinker
  // For now, provide usage instructions
  console.log('Citation Coverage Checker');
  console.log('');
  console.log('Usage:');
  console.log('  1. Create a CitationLinker instance');
  console.log('  2. Register all references');
  console.log('  3. Build metrics/observations/risk factors (which creates links)');
  console.log('  4. Run check() to verify 100% coverage');
  console.log('');
  console.log('Contract Requirement: 100% citation coverage for registered references, zero orphans');
  console.log('');
  console.log('Example:');
  console.log('  const linker = createCitationLinker();');
  console.log('  const checker = createCitationChecker(linker);');
  console.log('  const result = checker.check();');
  console.log('  console.log(result.passed); // Should be true');
}
