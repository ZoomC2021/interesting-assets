/**
 * Citation Coverage Tests
 * 
 * Verifies 100% citation coverage per contract requirements:
 * - 970 total references (618 Atrium + 352 Axis)
 * - Zero orphan references
 * - All metrics linked to citations
 * - All observations linked to citations
 * - All risk factors linked to citations
 */

import { CitationLinker, createCitationLinker } from '../../src/adapters/citation-linker';
import { CitationChecker, createCitationChecker } from '../../src/validation/citation-checker';
import { createAtriumAdapter } from '../../src/adapters/atrium-adapter';
import { createAxisAdapter } from '../../src/adapters/axis-adapter';
import * as fs from 'fs';
import * as path from 'path';

describe('Citation Coverage', () => {
  let atriumLinker: CitationLinker;
  let axisLinker: CitationLinker;
  let atriumChecker: CitationChecker;
  let axisChecker: CitationChecker;

  beforeAll(() => {
    // Setup Atrium
    atriumLinker = createCitationLinker();
    const atriumRefs = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', '..', 'atrium-reit-references.json'), 'utf-8'
    ));
    const atriumAdapter = createAtriumAdapter(atriumLinker);
    atriumAdapter.processReferences(atriumRefs);
    
    // Generate output to create links (including orphan linking)
    atriumAdapter.generateOutput();
    
    atriumChecker = createCitationChecker(atriumLinker);

    // Setup Axis
    axisLinker = createCitationLinker();
    const axisRefs = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', '..', 'axis-reit-references.json'), 'utf-8'
    ));
    const axisAdapter = createAxisAdapter(axisLinker);
    axisAdapter.processReferences(axisRefs);
    
    // Generate output to create links (including orphan linking)
    axisAdapter.generateOutput();
    
    axisChecker = createCitationChecker(axisLinker);
  });

  describe('Atrium REIT Coverage', () => {
    it('should have registered all 618 Atrium references', () => {
      const registry = atriumLinker.toRegistry();
      expect(registry.metadata.totalReferences).toBe(618);
    });

    it('should have zero orphan references', () => {
      const result = atriumChecker.check();
      expect(result.orphanCount).toBe(0);
      expect(result.passed).toBe(true);
    });

    it('should have 100% coverage percentage', () => {
      const result = atriumChecker.check();
      expect(result.orphanPercentage).toBe(0);
    });

    it('should link all metrics to citations', () => {
      const coverage = atriumLinker.calculateCoverage();
      expect(coverage.unreferencedMetrics.length).toBe(0);
    });

    it('should link all observations to citations', () => {
      const coverage = atriumLinker.calculateCoverage();
      expect(coverage.unreferencedObservations.length).toBe(0);
    });

    it('should link all risk factors to citations', () => {
      const coverage = atriumLinker.calculateCoverage();
      expect(coverage.unreferencedRiskFactors.length).toBe(0);
    });
  });

  describe('Axis REIT Coverage', () => {
    it('should have registered all 352 Axis references', () => {
      const registry = axisLinker.toRegistry();
      expect(registry.metadata.totalReferences).toBe(352);
    });

    it('should have zero orphan references', () => {
      const result = axisChecker.check();
      expect(result.orphanCount).toBe(0);
      expect(result.passed).toBe(true);
    });

    it('should have 100% coverage percentage', () => {
      const result = axisChecker.check();
      expect(result.orphanPercentage).toBe(0);
    });

    it('should link all metrics to citations', () => {
      const coverage = axisLinker.calculateCoverage();
      expect(coverage.unreferencedMetrics.length).toBe(0);
    });

    it('should link all observations to citations', () => {
      const coverage = axisLinker.calculateCoverage();
      expect(coverage.unreferencedObservations.length).toBe(0);
    });

    it('should link all risk factors to citations', () => {
      const coverage = axisLinker.calculateCoverage();
      expect(coverage.unreferencedRiskFactors.length).toBe(0);
    });
  });

  describe('Combined Coverage', () => {
    it('should have 970 total references across both REITs', () => {
      const atriumRegistry = atriumLinker.toRegistry();
      const axisRegistry = axisLinker.toRegistry();
      const total = atriumRegistry.metadata.totalReferences + axisRegistry.metadata.totalReferences;
      expect(total).toBe(970);
    });

    it('should maintain T:XXX format for Atrium', () => {
      const atriumRefs = atriumLinker.toRegistry().references;
      for (const ref of Object.values(atriumRefs)) {
        expect(ref.displayId).toMatch(/^T:\d{1,3}$/);
        expect(ref.entityCode).toBe('5130.KL');
      }
    });

    it('should maintain A:XXX format for Axis', () => {
      const axisRefs = axisLinker.toRegistry().references;
      for (const ref of Object.values(axisRefs)) {
        expect(ref.displayId).toMatch(/^A:\d{1,3}$/);
        expect(ref.entityCode).toBe('5106.KL');
      }
    });
  });

  describe('Display ID Validation', () => {
    it('should reject invalid display IDs', () => {
      const result = atriumLinker.validateDisplayIds(['T:9999', 'X:123', 'invalid']);
      expect(result.valid.length).toBe(0);
      expect(result.invalid.length).toBe(3);
    });

    it('should accept valid Atrium display IDs', () => {
      const result = atriumLinker.validateDisplayIds(['T:1', 'T:100', 'T:618']);
      expect(result.valid.length).toBe(3);
      expect(result.invalid.length).toBe(0);
    });

    it('should accept valid Axis display IDs', () => {
      const result = axisLinker.validateDisplayIds(['A:1', 'A:100', 'A:352']);
      expect(result.valid.length).toBe(3);
      expect(result.invalid.length).toBe(0);
    });
  });

  describe('Citation Link Quality', () => {
    it('should track metric usage in Atrium references', () => {
      const coverage = atriumLinker.calculateCoverage();
      
      // Should have significant linkages
      expect(coverage.totalFacts).toBeGreaterThan(50);
    });

    it('should generate stable UUIDs', () => {
      const id1 = CitationLinker.generateUuid('5130.KL', 'T:100');
      const id2 = CitationLinker.generateUuid('5130.KL', 'T:100');
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('should generate different UUIDs for different display IDs', () => {
      const id1 = CitationLinker.generateUuid('5130.KL', 'T:100');
      const id2 = CitationLinker.generateUuid('5130.KL', 'T:101');
      expect(id1).not.toBe(id2);
    });
  });
});
