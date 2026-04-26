/**
 * PDF Research Unit Tests
 *
 * Tests for URL validation, content verification, extraction logic,
 * and validation of PDF research pipeline.
 */

import {
  validateUrl,
  verifyContentHeaders,
  verifyPdfMagicBytes,
  isRetryableError,
  estimateReadingTime,
  formatCitation
} from '../../src/utils/pdf-research';

import {
  validateExtractionResult,
  validateSuccessResult,
  validateFailureResult,
  isSuccessResult,
  isFailureResult,
  PdfExtractionSuccessSchema,
  PdfExtractionFailureSchema
} from '../../src/validation/pdf-extraction-validator';

import type {
  PdfExtractionSuccess,
  PdfExtractionFailure,
  PdfErrorCode
} from '../../src/types/pdf-research';

// ============================================================================
// URL Validation Tests
// ============================================================================

describe('URL Validation', () => {
  it('should accept valid HTTPS URLs', () => {
    const result = validateUrl('https://example.com/document.pdf');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe('https://example.com/document.pdf');
  });

  it('should accept HTTPS URLs with query parameters', () => {
    const result = validateUrl('https://example.com/doc.pdf?token=abc123');
    expect(result.valid).toBe(true);
  });

  it('should accept HTTPS URLs with paths', () => {
    const result = validateUrl('https://example.com/path/to/file.pdf');
    expect(result.valid).toBe(true);
  });

  it('should reject HTTP URLs (must be HTTPS)', () => {
    const result = validateUrl('http://example.com/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
    expect(result.error).toContain('HTTPS');
  });

  it('should reject FTP URLs', () => {
    const result = validateUrl('ftp://example.com/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject file:// URLs', () => {
    const result = validateUrl('file:///etc/passwd');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject localhost URLs', () => {
    const result = validateUrl('https://localhost/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('localhost');
  });

  it('should reject 127.0.0.1 URLs', () => {
    const result = validateUrl('https://127.0.0.1/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject 10.x.x.x private IP URLs', () => {
    const result = validateUrl('https://10.0.0.1/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject 192.168.x.x private IP URLs', () => {
    const result = validateUrl('https://192.168.1.1/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject 172.16.x.x - 172.31.x.x private IP URLs', () => {
    const result = validateUrl('https://172.16.0.1/document.pdf');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject empty URLs', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject whitespace-only URLs', () => {
    const result = validateUrl('   ');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should trim whitespace from URLs', () => {
    const result = validateUrl('  https://example.com/doc.pdf  ');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe('https://example.com/doc.pdf');
  });

  it('should reject non-string inputs', () => {
    const result = validateUrl(null as unknown as string);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });

  it('should reject malformed URLs', () => {
    const result = validateUrl('not a valid url');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('INVALID_URL');
  });
});

// ============================================================================
// Content Verification Tests
// ============================================================================

describe('Content Verification', () => {
  const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

  it('should accept valid PDF Content-Type', () => {
    const result = verifyContentHeaders('application/pdf', '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should accept PDF with charset', () => {
    const result = verifyContentHeaders('application/pdf; charset=utf-8', '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should accept octet-stream as PDF', () => {
    const result = verifyContentHeaders('application/octet-stream', '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should reject non-PDF Content-Type', () => {
    const result = verifyContentHeaders('text/html', '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('NOT_PDF');
  });

  it('should reject image Content-Type', () => {
    const result = verifyContentHeaders('image/png', '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('NOT_PDF');
  });

  it('should reject oversized content by Content-Length', () => {
    const oversized = (60 * 1024 * 1024).toString(); // 60MB
    const result = verifyContentHeaders('application/pdf', oversized, DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('OVERSIZE');
  });

  it('should accept content at exact size limit', () => {
    const atLimit = (50 * 1024 * 1024).toString();
    const result = verifyContentHeaders('application/pdf', atLimit, DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should accept content without Content-Length (unknown size)', () => {
    const result = verifyContentHeaders('application/pdf', undefined, DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should accept content without Content-Type (will be checked by magic bytes)', () => {
    const result = verifyContentHeaders(undefined, '1000', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should handle numeric content length', () => {
    const result = verifyContentHeaders('application/pdf', 1000, DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should handle invalid string content length', () => {
    const result = verifyContentHeaders('application/pdf', 'not-a-number', DEFAULT_MAX_SIZE);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// PDF Magic Bytes Tests
// ============================================================================

describe('PDF Magic Bytes Verification', () => {
  it('should verify valid PDF header', () => {
    const buffer = Buffer.from('%PDF-1.4 some content');
    expect(verifyPdfMagicBytes(buffer)).toBe(true);
  });

  it('should verify PDF 1.7 header', () => {
    const buffer = Buffer.from('%PDF-1.7');
    expect(verifyPdfMagicBytes(buffer)).toBe(true);
  });

  it('should reject non-PDF content', () => {
    const buffer = Buffer.from('This is not a PDF');
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });

  it('should reject HTML content', () => {
    const buffer = Buffer.from('<html><body>PDF</body></html>');
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });

  it('should reject image content', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG magic
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });

  it('should reject too-short buffer', () => {
    const buffer = Buffer.from('%PD');
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });

  it('should reject empty buffer', () => {
    const buffer = Buffer.from('');
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });

  it('should be case-sensitive', () => {
    const buffer = Buffer.from('%pdf-1.4');
    expect(verifyPdfMagicBytes(buffer)).toBe(false);
  });
});

// ============================================================================
// Error Code Tests
// ============================================================================

describe('Error Code Classification', () => {
  it('should mark NETWORK_ERROR as retryable', () => {
    expect(isRetryableError('NETWORK_ERROR')).toBe(true);
  });

  it('should mark TIMEOUT as retryable', () => {
    expect(isRetryableError('TIMEOUT')).toBe(true);
  });

  it('should mark FETCH_FAILED as retryable', () => {
    expect(isRetryableError('FETCH_FAILED')).toBe(true);
  });

  it('should NOT mark INVALID_URL as retryable', () => {
    expect(isRetryableError('INVALID_URL')).toBe(false);
  });

  it('should NOT mark NOT_PDF as retryable', () => {
    expect(isRetryableError('NOT_PDF')).toBe(false);
  });

  it('should NOT mark OVERSIZE as retryable', () => {
    expect(isRetryableError('OVERSIZE')).toBe(false);
  });

  it('should NOT mark MALFORMED_PDF as retryable', () => {
    expect(isRetryableError('MALFORMED_PDF')).toBe(false);
  });

  it('should NOT mark EMPTY_CONTENT as retryable', () => {
    expect(isRetryableError('EMPTY_CONTENT')).toBe(false);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('estimateReadingTime', () => {
    it('should estimate 1 minute for 200 words at 200 WPM', () => {
      expect(estimateReadingTime(200, 200)).toBe(1);
    });

    it('should estimate 2 minutes for 400 words at 200 WPM', () => {
      expect(estimateReadingTime(400, 200)).toBe(2);
    });

    it('should round up partial minutes', () => {
      expect(estimateReadingTime(201, 200)).toBe(2);
    });

    it('should handle zero words', () => {
      expect(estimateReadingTime(0, 200)).toBe(0);
    });

    it('should use custom WPM', () => {
      expect(estimateReadingTime(300, 150)).toBe(2);
    });
  });

  describe('formatCitation', () => {
    it('should format citation with all fields', () => {
      const result: PdfExtractionSuccess = {
        success: true,
        url: 'https://example.com/doc.pdf',
        extraction: {
          pages: [],
          totalPages: 1,
          totalWordCount: 100,
          totalCharCount: 500
        },
        metadata: {
          title: 'Annual Report',
          author: 'Acme Corp',
          pdfVersion: '1.4'
        },
        citation: {
          accessedAt: '2024-01-15T10:30:00Z',
          verificationStatus: 'unverified',
          confidence: 'medium',
          sourceUrl: 'https://example.com/doc.pdf'
        }
      };

      const citation = formatCitation(result);
      expect(citation).toContain('Source: https://example.com/doc.pdf');
      expect(citation).toContain('Accessed: 2024-01-15T10:30:00Z');
      expect(citation).toContain('Status: unverified (medium confidence)');
      expect(citation).toContain('Title: Annual Report');
      expect(citation).toContain('Author: Acme Corp');
    });

    it('should format citation without optional metadata', () => {
      const result: PdfExtractionSuccess = {
        success: true,
        url: 'https://example.com/doc.pdf',
        extraction: {
          pages: [],
          totalPages: 1,
          totalWordCount: 100,
          totalCharCount: 500
        },
        metadata: {},
        citation: {
          accessedAt: '2024-01-15T10:30:00Z',
          verificationStatus: 'unverified',
          confidence: 'medium',
          sourceUrl: 'https://example.com/doc.pdf'
        }
      };

      const citation = formatCitation(result);
      expect(citation).toContain('Source: https://example.com/doc.pdf');
      expect(citation).not.toContain('Title:');
      expect(citation).not.toContain('Author:');
    });
  });
});

// ============================================================================
// Extraction Result Validation Tests
// ============================================================================

describe('Extraction Result Validation', () => {
  const validSuccessResult: PdfExtractionSuccess = {
    success: true,
    url: 'https://example.com/doc.pdf',
    extraction: {
      pages: [
        { pageNumber: 1, text: 'Page one content', wordCount: 3, charCount: 16 },
        { pageNumber: 2, text: 'Page two content', wordCount: 3, charCount: 16 }
      ],
      totalPages: 2,
      totalWordCount: 6,
      totalCharCount: 32
    },
    metadata: {
      pdfVersion: '1.4',
      title: 'Test Document',
      author: 'Test Author'
    },
    citation: {
      accessedAt: '2024-01-15T10:30:00Z',
      verificationStatus: 'unverified',
      confidence: 'medium',
      sourceUrl: 'https://example.com/doc.pdf'
    }
  };

  const validFailureResult: PdfExtractionFailure = {
    success: false,
    url: 'https://example.com/doc.pdf',
    error: 'Network timeout',
    errorCode: 'TIMEOUT',
    retryable: true,
    attempts: 3,
    attemptedAt: '2024-01-15T10:30:00Z'
  };

  describe('validateSuccessResult', () => {
    it('should validate correct success result', () => {
      const result = validateSuccessResult(validSuccessResult);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject success with wrong page count', () => {
      const badResult = {
        ...validSuccessResult,
        extraction: {
          ...validSuccessResult.extraction,
          totalPages: 5 // Doesn't match pages array length
        }
      };
      const result = validateSuccessResult(badResult);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'extraction.pages.length (2) does not match totalPages (5)'
      );
    });

    it('should reject success with wrong word count', () => {
      const badResult = {
        ...validSuccessResult,
        extraction: {
          ...validSuccessResult.extraction,
          totalWordCount: 100 // Doesn't match sum of page word counts
        }
      };
      const result = validateSuccessResult(badResult);
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('totalWordCount'))).toBe(true);
    });

    it('should reject success with non-sequential page numbers', () => {
      const badResult = {
        ...validSuccessResult,
        extraction: {
          ...validSuccessResult.extraction,
          pages: [
            { pageNumber: 1, text: 'Page one', wordCount: 2, charCount: 8 },
            { pageNumber: 3, text: 'Page three', wordCount: 2, charCount: 10 } // Skipped 2
          ]
        }
      };
      const result = validateSuccessResult(badResult);
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('sequential'))).toBe(true);
    });

    it('should reject success without unverified status', () => {
      const badResult = {
        ...validSuccessResult,
        citation: {
          ...validSuccessResult.citation,
          verificationStatus: 'verified' as const
        }
      };
      const result = validateSuccessResult(badResult);
      expect(result.valid).toBe(false);
    });

    it('should reject success without medium confidence', () => {
      const badResult = {
        ...validSuccessResult,
        citation: {
          ...validSuccessResult.citation,
          confidence: 'high' as const
        }
      };
      const result = validateSuccessResult(badResult);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFailureResult', () => {
    it('should validate correct failure result', () => {
      const result = validateFailureResult(validFailureResult);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject failure with invalid error code', () => {
      const badResult = {
        ...validFailureResult,
        errorCode: 'UNKNOWN_ERROR' as PdfErrorCode
      };
      const result = validateFailureResult(badResult);
      expect(result.valid).toBe(false);
    });

    it('should reject failure with empty error message', () => {
      const badResult = {
        ...validFailureResult,
        error: ''
      };
      const result = validateFailureResult(badResult);
      expect(result.valid).toBe(false);
    });

    it('should reject failure with negative attempts', () => {
      const badResult = {
        ...validFailureResult,
        attempts: -1
      };
      const result = validateFailureResult(badResult);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateExtractionResult', () => {
    it('should validate success result', () => {
      const result = validateExtractionResult(validSuccessResult);
      expect(result.valid).toBe(true);
      expect(result.isSuccess).toBe(true);
    });

    it('should validate failure result', () => {
      const result = validateExtractionResult(validFailureResult);
      expect(result.valid).toBe(true);
      expect(result.isSuccess).toBe(false);
    });

    it('should reject invalid result structure', () => {
      const invalid = { notAValidResult: true };
      const result = validateExtractionResult(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Type Guards', () => {
    it('isSuccessResult should return true for valid success', () => {
      expect(isSuccessResult(validSuccessResult)).toBe(true);
    });

    it('isSuccessResult should return false for failure', () => {
      expect(isSuccessResult(validFailureResult)).toBe(false);
    });

    it('isFailureResult should return true for valid failure', () => {
      expect(isFailureResult(validFailureResult)).toBe(true);
    });

    it('isFailureResult should return false for success', () => {
      expect(isFailureResult(validSuccessResult)).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(isSuccessResult(null)).toBe(false);
      expect(isSuccessResult(undefined)).toBe(false);
      expect(isFailureResult(null)).toBe(false);
      expect(isFailureResult(undefined)).toBe(false);
    });
  });
});

// ============================================================================
// Schema Export Tests
// ============================================================================

describe('Schema Exports', () => {
  it('should export success schema', () => {
    expect(PdfExtractionSuccessSchema).toBeDefined();
    expect(typeof PdfExtractionSuccessSchema.parse).toBe('function');
  });

  it('should export failure schema', () => {
    expect(PdfExtractionFailureSchema).toBeDefined();
    expect(typeof PdfExtractionFailureSchema.parse).toBe('function');
  });

  it('success schema should validate correct structure', () => {
    const valid = {
      success: true,
      url: 'https://example.com/doc.pdf',
      extraction: {
        pages: [{ pageNumber: 1, text: 'Hello', wordCount: 1, charCount: 5 }],
        totalPages: 1,
        totalWordCount: 1,
        totalCharCount: 5
      },
      metadata: {},
      citation: {
        accessedAt: '2024-01-15T10:30:00Z',
        verificationStatus: 'unverified',
        confidence: 'medium',
        sourceUrl: 'https://example.com/doc.pdf'
      }
    };
    expect(() => PdfExtractionSuccessSchema.parse(valid)).not.toThrow();
  });

  it('failure schema should validate correct structure', () => {
    const valid = {
      success: false,
      url: 'https://example.com/doc.pdf',
      error: 'Failed',
      errorCode: 'NETWORK_ERROR',
      retryable: true,
      attempts: 1,
      attemptedAt: '2024-01-15T10:30:00Z'
    };
    expect(() => PdfExtractionFailureSchema.parse(valid)).not.toThrow();
  });
});
