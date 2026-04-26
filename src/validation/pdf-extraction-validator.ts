/**
 * PDF Extraction Validator
 *
 * Runtime validation for PDF extraction results using Zod schemas.
 * Provides type-safe validation of extraction outputs.
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Schema for extracted page
 */
export const ExtractedPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: z.string(),
  wordCount: z.number().int().nonnegative(),
  charCount: z.number().int().nonnegative()
});

/**
 * Schema for PDF metadata
 */
export const PdfMetadataSchema = z.object({
  pdfVersion: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  subject: z.string().optional(),
  creationDate: z.string().optional(),
  modificationDate: z.string().optional(),
  producer: z.string().optional()
});

/**
 * Schema for citation metadata
 */
export const CitationMetadataSchema = z.object({
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/),
  verificationStatus: z.literal('unverified'),
  confidence: z.literal('medium'),
  sourceUrl: z.string().url()
});

/**
 * Schema for successful extraction
 */
export const PdfExtractionSuccessSchema = z.object({
  success: z.literal(true),
  url: z.string().url(),
  extraction: z.object({
    pages: z.array(ExtractedPageSchema),
    totalPages: z.number().int().positive(),
    totalWordCount: z.number().int().nonnegative(),
    totalCharCount: z.number().int().nonnegative()
  }),
  metadata: PdfMetadataSchema,
  citation: CitationMetadataSchema
});

/**
 * Schema for extraction failure
 */
export const PdfExtractionFailureSchema = z.object({
  success: z.literal(false),
  url: z.string().url(),
  error: z.string().min(1),
  errorCode: z.enum([
    'INVALID_URL',
    'NETWORK_ERROR',
    'TIMEOUT',
    'NOT_PDF',
    'OVERSIZE',
    'MALFORMED_PDF',
    'EMPTY_CONTENT',
    'FETCH_FAILED'
  ]),
  retryable: z.boolean(),
  attempts: z.number().int().nonnegative(),
  attemptedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)
});

/**
 * Union schema for any extraction result
 */
export const PdfExtractionResultSchema = z.union([
  PdfExtractionSuccessSchema,
  PdfExtractionFailureSchema
]);

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a successful extraction result
 */
export function validateSuccessResult(data: unknown): {
  valid: boolean;
  errors?: string[];
  data?: z.infer<typeof PdfExtractionSuccessSchema>;
} {
  const result = PdfExtractionSuccessSchema.safeParse(data);

  if (result.success) {
    // Additional semantic validation
    const semanticErrors = validateSemantics(result.data);

    if (semanticErrors.length > 0) {
      return { valid: false, errors: semanticErrors };
    }

    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  };
}

/**
 * Validate a failure extraction result
 */
export function validateFailureResult(data: unknown): {
  valid: boolean;
  errors?: string[];
  data?: z.infer<typeof PdfExtractionFailureSchema>;
} {
  const result = PdfExtractionFailureSchema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  };
}

/**
 * Validate any extraction result (success or failure)
 */
export function validateExtractionResult(data: unknown): {
  valid: boolean;
  errors?: string[];
  isSuccess?: boolean;
  data?: unknown;
} {
  const result = PdfExtractionResultSchema.safeParse(data);

  if (result.success) {
    const isSuccess = result.data.success;

    if (isSuccess) {
      const semanticErrors = validateSemantics(result.data);
      if (semanticErrors.length > 0) {
        return { valid: false, errors: semanticErrors };
      }
    }

    return { valid: true, isSuccess, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  };
}

/**
 * Semantic validation beyond schema checks
 */
function validateSemantics(
  data: z.infer<typeof PdfExtractionSuccessSchema>
): string[] {
  const errors: string[] = [];
  const { extraction } = data;

  // Check total pages matches pages array length
  if (extraction.pages.length !== extraction.totalPages) {
    errors.push(
      `extraction.pages.length (${extraction.pages.length}) ` +
      `does not match totalPages (${extraction.totalPages})`
    );
  }

  // Check page numbers are sequential
  const pageNumbers = extraction.pages.map(p => p.pageNumber);
  const expectedNumbers = Array.from(
    { length: extraction.totalPages },
    (_, i) => i + 1
  );

  if (JSON.stringify(pageNumbers) !== JSON.stringify(expectedNumbers)) {
    errors.push(
      `Page numbers [${pageNumbers.join(', ')}] are not sequential from 1 to ${extraction.totalPages}`
    );
  }

  // Check word count consistency
  const calculatedTotal = extraction.pages.reduce((sum, p) => sum + p.wordCount, 0);
  if (calculatedTotal !== extraction.totalWordCount) {
    errors.push(
      `Sum of page word counts (${calculatedTotal}) ` +
      `does not match totalWordCount (${extraction.totalWordCount})`
    );
  }

  // Check char count consistency
  const calculatedChars = extraction.pages.reduce((sum, p) => sum + p.charCount, 0);
  if (calculatedChars !== extraction.totalCharCount) {
    errors.push(
      `Sum of page char counts (${calculatedChars}) ` +
      `does not match totalCharCount (${extraction.totalCharCount})`
    );
  }

  // Warn if any page has suspicious word/char ratio
  for (const page of extraction.pages) {
    if (page.charCount > 0 && page.wordCount === 0) {
      errors.push(
        `Page ${page.pageNumber} has ${page.charCount} chars but 0 words (possible parsing issue)`
      );
    }
  }

  return errors;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for successful extraction
 */
export function isSuccessResult(
  result: unknown
): result is z.infer<typeof PdfExtractionSuccessSchema> {
  const validation = validateExtractionResult(result);
  return validation.valid && validation.isSuccess === true;
}

/**
 * Type guard for failed extraction
 */
export function isFailureResult(
  result: unknown
): result is z.infer<typeof PdfExtractionFailureSchema> {
  const validation = validateExtractionResult(result);
  return validation.valid && validation.isSuccess === false;
}

// ============================================================================
// CLI Support
// ============================================================================

if (require.main === module) {
  // Allow validating a JSON file from command line
  const fs = require('fs');
  const path = require('path');

  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node pdf-extraction-validator.ts <path-to-json-file>');
    process.exit(1);
  }

  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    const validation = validateExtractionResult(data);

    if (validation.valid) {
      console.log('✅ Validation passed');
      if (validation.isSuccess) {
        const successData = validation.data as z.infer<typeof PdfExtractionSuccessSchema>;
        console.log(`   URL: ${successData.url}`);
        console.log(`   Pages: ${successData.extraction.totalPages}`);
        console.log(`   Words: ${successData.extraction.totalWordCount}`);
        console.log(`   Status: ${successData.citation.verificationStatus}`);
      } else {
        const failData = validation.data as z.infer<typeof PdfExtractionFailureSchema>;
        console.log(`   URL: ${failData.url}`);
        console.log(`   Error: [${failData.errorCode}] ${failData.error}`);
        console.log(`   Retryable: ${failData.retryable}`);
      }
      process.exit(0);
    } else {
      console.error('❌ Validation failed:');
      for (const error of validation.errors || []) {
        console.error(`   - ${error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Error reading or parsing file:', error);
    process.exit(1);
  }
}
