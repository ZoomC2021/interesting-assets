/**
 * Entity Type Definitions
 * 
 * Specialized types for REIT entities including:
 * - Property portfolio composition
 * - Management structure
 * - Geographic distribution
 * - Vintage analysis
 */

import { z } from 'zod';

// ============================================================================
// Property Types
// ============================================================================

export const PropertyTypeSchema = z.enum([
  'industrial_warehouse',
  'manufacturing_facility',
  'logistics_hub',
  'office_industrial_mixed',
  'pure_office',
  'hypermarket',
  'distribution_center'
]);

export const PropertySchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  name: z.string().min(1),
  shortCode: z.string().optional(),
  location: z.object({
    city: z.string().min(1),
    state: z.string().min(1),
    region: z.enum(['klang_valley', 'johor', 'penang', 'kedah', 'pahang', 'other'])
  }),
  propertyType: PropertyTypeSchema,
  netLettableAreaSqFt: z.number().positive().optional(),
  landAreaSqFt: z.number().positive().optional(),
  valuationRM: z.number().positive().optional(),
  acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  acquisitionPriceRM: z.number().positive().optional(),
  yearBuilt: z.number().int().min(1900).max(2100).optional(),
  effectiveAge: z.number().int().min(0).optional(),
  majorTenant: z.string().optional(),
  leaseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasUndergoneAEI: z.boolean().default(false),
  aeiDetails: z.object({
    year: z.number().int(),
    investmentRM: z.number().positive(),
    description: z.string()
  }).optional()
});

// ============================================================================
// Geographic Distribution
// ============================================================================

export const GeographicDistributionSchema = z.object({
  region: z.string().min(1),
  propertyCount: z.number().int().nonnegative(),
  percentageOfPortfolio: z.number().min(0).max(100),
  totalValuationRM: z.number().positive().optional(),
  totalNlaSqFt: z.number().positive().optional()
});

// ============================================================================
// Management Structure
// ============================================================================

export const BoardCommitteeSchema = z.object({
  name: z.string().min(1),
  chair: z.string().min(1),
  exists: z.boolean()
});

export const ExecutiveSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  qualifications: z.array(z.string()),
  tenureSince: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
  isActing: z.boolean().default(false)
});

export const FeeStructureSchema = z.object({
  baseManagementFeePct: z.number().min(0).max(100),
  acquisitionFeePct: z.number().min(0).max(100),
  disposalFeePct: z.number().min(0).max(100),
  performanceFeeExists: z.boolean(),
  performanceFeeStructure: z.string().optional(),
  feeIncreaseProtection: z.boolean()
});

// ============================================================================
// Entity Extended
// ============================================================================

export const EntityExtendedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  exchange: z.string().min(1),
  sector: z.string().min(1),
  currency: z.string().default('MYR'),
  isShariahCompliant: z.boolean(),
  listingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  yearsListed: z.number().int().min(0).optional(),
  
  // Management
  manager: z.object({
    name: z.string().min(1),
    ownershipStructure: z.string().optional(),
    controllingShareholder: z.string().optional(),
    controllingOwnershipPct: z.number().min(0).max(100).optional(),
    executives: z.array(ExecutiveSchema),
    boardSize: z.number().int().positive(),
    independentDirectors: z.number().int().nonnegative(),
    independentDirectorPct: z.number().min(0).max(100),
    committees: z.array(BoardCommitteeSchema),
    feeStructure: FeeStructureSchema
  }),
  
  trustee: z.string().min(1),
  
  // Fiscal
  fiscalYearEnd: z.object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31)
  }),
  
  // Portfolio
  portfolio: z.object({
    totalProperties: z.number().int().nonnegative(),
    totalAssetsRM: z.number().positive(),
    investmentPropertiesRM: z.number().positive(),
    netLettableAreaSqFt: z.number().positive().optional(),
    geographicDistribution: z.array(GeographicDistributionSchema),
    properties: z.array(PropertySchema)
  }),
  
  references: z.array(z.string().uuid())
});

// ============================================================================
// Type Exports
// ============================================================================

export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type GeographicDistribution = z.infer<typeof GeographicDistributionSchema>;
export type BoardCommittee = z.infer<typeof BoardCommitteeSchema>;
export type Executive = z.infer<typeof ExecutiveSchema>;
export type FeeStructure = z.infer<typeof FeeStructureSchema>;
export type EntityExtended = z.infer<typeof EntityExtendedSchema>;
