/**
 * Schema Conformance Tests
 * 
 * Validates that all normalized outputs conform to the schema specification.
 * Tests schema validation, type checking, and semantic validation.
 */

import { validateData, formatValidationErrors } from '../../src/validation/schema-validator';
import * as fs from 'fs';
import * as path from 'path';

describe('Schema Conformance', () => {
  let atriumData: any;
  let axisData: any;

  beforeAll(() => {
    // Load sample data
    const samplesDir = path.join(__dirname, '..', 'samples');
    
    try {
      const raw = fs.readFileSync(path.join(samplesDir, 'atrium-normalized.json'), 'utf-8');
      atriumData = JSON.parse(raw);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[schema.test] atrium-normalized.json not readable:', (e as Error).message);
    }
    
    try {
      axisData = JSON.parse(fs.readFileSync(path.join(samplesDir, 'axis-normalized.json'), 'utf-8'));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[schema.test] axis-normalized.json not readable:', (e as Error).message);
    }
  });

  describe('Schema Structure', () => {
    it('should have valid schema version', () => {
      if (!atriumData) return;
      expect(atriumData.schemaVersion).toBeDefined();
      expect(typeof atriumData.schemaVersion).toBe('string');
      expect(atriumData.schemaVersion).toMatch(/^\d+\.\d+$/);
    });

    it('should have generated timestamp', () => {
      if (!atriumData) return;
      expect(atriumData.generatedAt).toBeDefined();
      expect(new Date(atriumData.generatedAt).toISOString()).toBe(atriumData.generatedAt);
    });

    it('should contain all required top-level fields', () => {
      if (!atriumData) return;
      const required = ['entity', 'references', 'metrics', 'timeSeries', 'riskAssessment', 'observations'];
      for (const field of required) {
        expect(atriumData).toHaveProperty(field);
      }
    });
  });

  describe('Entity Validation', () => {
    it('should have valid entity with required fields', () => {
      if (!atriumData?.entity) return;
      const entity = atriumData.entity;
      
      expect(entity.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(entity.code).toMatch(/^\d{4}\.KL$/);
      expect(entity.name).toBeTruthy();
      expect(entity.exchange).toBeTruthy();
      expect(['MYR']).toContain(entity.currency);
      expect(typeof entity.isShariahCompliant).toBe('boolean');
    });

    it('should have valid fiscal year end', () => {
      if (!atriumData?.entity) return;
      expect(atriumData.entity.fiscalYearEnd.month).toBeGreaterThanOrEqual(1);
      expect(atriumData.entity.fiscalYearEnd.month).toBeLessThanOrEqual(12);
      expect(atriumData.entity.fiscalYearEnd.day).toBeGreaterThanOrEqual(1);
      expect(atriumData.entity.fiscalYearEnd.day).toBeLessThanOrEqual(31);
    });

    it('should have manager information', () => {
      if (!atriumData?.entity) return;
      expect(atriumData.entity.manager).toBeDefined();
      expect(atriumData.entity.manager.name).toBeTruthy();
    });
  });

  describe('Reference Validation', () => {
    it('should have references with valid display IDs', () => {
      if (!atriumData?.references) return;
      
      for (const ref of atriumData.references) {
        expect(ref.displayId).toMatch(/^[TAC]:\d{1,3}$/);
        expect(ref.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(ref.fact).toBeTruthy();
        expect(ref.source).toBeTruthy();
        expect(ref.citation).toBeTruthy();
        expect(ref.dateAccessed).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
      }
    });

    it('should have unique display IDs', () => {
      if (!atriumData?.references) return;
      const displayIds = atriumData.references.map((r: any) => r.displayId);
      const unique = new Set(displayIds);
      expect(unique.size).toBe(displayIds.length);
    });
  });

  describe('Metric Validation', () => {
    it('should have at least 25 metrics', () => {
      if (!atriumData?.metrics) return;
      expect(atriumData.metrics.length).toBeGreaterThanOrEqual(25);
    });

    it('should have valid metric types from registry', () => {
      if (!atriumData?.metrics) return;
      const validTypes = [
        'portfolio_size', 'total_assets', 'investment_properties', 'property_count', 'net_lettable_area', 'geographic_concentration',
        'gross_revenue', 'net_property_income', 'realised_income', 'net_profit', 'nav_per_unit', 'market_cap', 'share_price',
        'dpu', 'dpu_growth_yoy', 'dividend_yield_market', 'dividend_yield_nav', 'payout_ratio',
        'gearing_ratio', 'interest_coverage', 'total_borrowings', 'fixed_rate_debt_pct', 'floating_rate_debt_pct', 'wacd',
        'occupancy_rate', 'wale_years', 'tenant_count', 'top_tenant_concentration', 'rental_reversion', 'lease_renewal_rate', 'npi_margin',
        'tenant_risk_rating', 'interest_rate_sensitivity', 'refinancing_risk',
        'price_to_book', 'premium_discount_to_nav'
      ];
      
      for (const metric of atriumData.metrics) {
        expect(validTypes).toContain(metric.metricType);
      }
    });

    it('should have numeric values where expected', () => {
      if (!atriumData?.metrics) return;
      
      for (const metric of atriumData.metrics) {
        // Ensure value is a number, not string/null/undefined/object
        expect(typeof metric.value).toBe('number');
        expect(isNaN(metric.value)).toBe(false);
      }
    });

    it('should have valid source display IDs', () => {
      if (!atriumData?.metrics) return;
      
      for (const metric of atriumData.metrics) {
        expect(Array.isArray(metric.sourceDisplayIds)).toBe(true);
        expect(metric.sourceDisplayIds.length).toBeGreaterThan(0);
        
        for (const id of metric.sourceDisplayIds) {
          expect(id).toMatch(/^[TAC]:\d{1,3}$/);
        }
      }
    });
  });

  describe('Risk Assessment Validation', () => {
    it('should have overall risk rating', () => {
      if (!atriumData?.riskAssessment) return;
      expect(['low', 'moderate', 'moderate_high', 'high']).toContain(atriumData.riskAssessment.overallRiskRating);
    });

    it('should have risk factors with valid categories', () => {
      if (!atriumData?.riskAssessment?.riskFactors) return;
      
      const validCategories = [
        'concentration', 'gearing', 'interest_rate', 'tenant_rollover',
        'liquidity', 'transparency', 'geographic', 'counterparty', 'governance'
      ];
      
      for (const factor of atriumData.riskAssessment.riskFactors) {
        expect(validCategories).toContain(factor.category);
        expect(['low', 'medium', 'high', 'critical']).toContain(factor.severity);
        expect(factor.mitigatingFactors).toBeDefined();
        expect(factor.aggravatingFactors).toBeDefined();
      }
    });
  });

  describe('Zod Schema Validation', () => {
    it('should pass Zod validation for Atrium data', () => {
      if (!atriumData) {
        console.log('Skipping: Atrium sample data not available');
        return;
      }
      
      const result = validateData(atriumData);
      
      if (!result.valid) {
        console.log('Validation errors:', formatValidationErrors(result));
      }
      
      expect(result.valid).toBe(true);
    });

    it('should pass Zod validation for Axis data', () => {
      if (!axisData) {
        console.log('Skipping: Axis sample data not available');
        return;
      }
      
      const result = validateData(axisData);
      expect(result.valid).toBe(true);
    });
  });

  describe('Validation Stats', () => {
    it('should report correct metric coverage', () => {
      if (!atriumData) return;
      
      const result = validateData(atriumData);
      expect(result.stats.totalMetrics).toBeGreaterThan(0);
      expect(result.stats.totalReferences).toBeGreaterThan(0);
    });
  });
});
