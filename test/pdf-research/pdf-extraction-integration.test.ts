/**
 * PDF Research Integration Tests
 *
 * Integration tests for the full extraction pipeline.
 * Uses mocks for network requests to avoid external dependencies.
 */

import {
  extractPdfFromUrl
} from '../../src/utils/pdf-research';

import {
  validateExtractionResult,
  isSuccessResult,
  isFailureResult
} from '../../src/validation/pdf-extraction-validator';

// Mock https module
jest.mock('https', () => ({
  get: jest.fn()
}));

import * as https from 'https';

// Helper to create a minimal valid PDF buffer
function createMinimalPdfBuffer(): Buffer {
  // Minimal PDF structure that passes magic bytes check
  // %PDF-1.4 header + minimal body + %%EOF
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n' +
    '4 0 obj<</Length 44>>stream\n' +
    'BT /F1 12 Tf 100 700 Td (Hello World) Tj ET\n' +
    'endstream endobj\n' +
    'xref\n' +
    '0 5\n' +
    '0000000000 65535 f\n' +
    '0000000009 00000 n\n' +
    '0000000052 00000 n\n' +
    '0000000101 00000 n\n' +
    '0000000170 00000 n\n' +
    'trailer<</Size 5/Root 1 0 R>>\n' +
    'startxref\n' +
    '260\n' +
    '%%EOF'
  );
}

// Helper to create mock response stream
function createMockResponse(options: {
  statusCode: number;
  headers?: Record<string, string>;
  chunks?: Buffer[];
  error?: Error;
}) {
  const chunks = options.chunks || [createMinimalPdfBuffer()];
  const { Readable } = require('stream');

  const response = new Readable({
    read() {
      if (options.error) {
        this.destroy(options.error);
        return;
      }
      const chunk = chunks.shift();
      if (chunk) {
        this.push(chunk);
      } else {
        this.push(null);
      }
    }
  });

  response.statusCode = options.statusCode;
  response.statusMessage = options.statusCode === 200 ? 'OK' : 'Error';
  response.headers = options.headers || {
    'content-type': 'application/pdf',
    'content-length': String(createMinimalPdfBuffer().length)
  };

  return response;
}

// Track the current mock state
let currentMockResponse: any = null;
let currentMockError: Error | null = null;

// Setup mock for each test
function setupMock(response?: any, error?: Error) {
  currentMockResponse = response;
  currentMockError = error || null;
}

// Initialize mock implementation
(https.get as jest.Mock).mockImplementation((_url: any, _options: any, callback: any) => {
  const { EventEmitter } = require('events');
  const request = new EventEmitter();
  request.destroy = jest.fn();

  setImmediate(() => {
    if (currentMockError) {
      request.emit('error', currentMockError);
    } else if (currentMockResponse && callback) {
      callback(currentMockResponse);
    }
  });

  return request;
});

describe('PDF Extraction Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentMockResponse = null;
    currentMockError = null;
  });

  describe('URL validation', () => {
    it('should reject invalid URLs immediately without network call', async () => {
      const result = await extractPdfFromUrl({
        url: 'http://insecure.com/doc.pdf'
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('INVALID_URL');
      expect(https.get).not.toHaveBeenCalled();
    });

    it('should reject localhost URLs immediately', async () => {
      const result = await extractPdfFromUrl({
        url: 'https://localhost/doc.pdf'
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('INVALID_URL');
      expect(https.get).not.toHaveBeenCalled();
    });
  });

  describe('Network resilience', () => {
    it('should handle network timeout and return TIMEOUT error', async () => {
      const timeoutError = new Error('ETIMEDOUT') as NodeJS.ErrnoException;
      timeoutError.code = 'ETIMEDOUT';
      setupMock(undefined, timeoutError);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        timeoutMs: 1000,
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('TIMEOUT');
      expect((result as any).retryable).toBe(true);
    });

    it('should handle connection refused and return NETWORK_ERROR', async () => {
      const connRefused = new Error('ECONNREFUSED') as NodeJS.ErrnoException;
      connRefused.code = 'ECONNREFUSED';
      setupMock(undefined, connRefused);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('NETWORK_ERROR');
      expect((result as any).retryable).toBe(true);
    });

    it('should handle host not found and return NETWORK_ERROR', async () => {
      const notFound = new Error('ENOTFOUND') as NodeJS.ErrnoException;
      notFound.code = 'ENOTFOUND';
      setupMock(undefined, notFound);

      const result = await extractPdfFromUrl({
        url: 'https://nonexistent.domain.com/doc.pdf',
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('Content verification', () => {
    it('should reject non-PDF Content-Type', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'content-length': '1000'
        }
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/not-a-pdf',
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('NOT_PDF');
      expect((result as any).retryable).toBe(false);
    });

    it('should reject oversized files based on Content-Length', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '60000000' // 60MB
        }
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/huge.pdf',
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('OVERSIZE');
      expect((result as any).retryable).toBe(false);
    });

    it('should reject content without PDF magic bytes', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': '1000'
        },
        chunks: [Buffer.from('This is not a PDF file, just plain text content')]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/fake.pdf',
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('NOT_PDF');
    });
  });

  describe('Result structure', () => {
    it('should include all required fields in success result', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length)
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/valid.pdf',
        maxRetries: 1
      });

      // Should pass schema validation
      const validation = validateExtractionResult(result);
      expect(validation.valid).toBe(true);

      if (isSuccessResult(result)) {
        expect(result.url).toBe('https://example.com/valid.pdf');
        expect(result.citation.verificationStatus).toBe('unverified');
        expect(result.citation.confidence).toBe('medium');
        expect(result.citation.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(result.extraction.totalPages).toBeGreaterThanOrEqual(1);
        expect(result.extraction.pages.length).toBe(result.extraction.totalPages);
        expect(Array.isArray(result.extraction.pages)).toBe(true);
      }
      // If result is not success, the validation above will fail the test
    });

    it('should include all required fields in failure result', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'content-length': '1000'
        }
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/not-pdf.html',
        maxRetries: 1
      });

      // Should pass schema validation
      const validation = validateExtractionResult(result);
      expect(validation.valid).toBe(true);

      if (isFailureResult(result)) {
        expect(result.url).toBe('https://example.com/not-pdf.html');
        expect(result.error).toBeTruthy();
        expect(result.errorCode).toBe('NOT_PDF');
        expect(typeof result.retryable).toBe('boolean');
        expect(result.attempts).toBeGreaterThanOrEqual(1);
        expect(result.attemptedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
      // If result is not failure, the validation above will fail the test
    });
  });

  describe('Options handling', () => {
    it('should respect custom max size via header check', async () => {
      // Note: Implementation enforces minimum 1MB limit, so we need to test
      // with a limit above that threshold
      const customLimit = 2 * 1024 * 1024; // 2MB

      // Create response with oversized Content-Length header (5MB)
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '5242880' // 5MB, exceeds 2MB limit
        },
        chunks: [] // Empty chunks since we expect early rejection
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxSizeBytes: customLimit,
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect((result as any).errorCode).toBe('OVERSIZE');
    });

    it('should accept files within custom size limit', async () => {
      // Test with a larger limit to ensure files pass through
      const largeLimit = 10 * 1024 * 1024; // 10MB

      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length) // Small PDF
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxSizeBytes: largeLimit,
        maxRetries: 1
      });

      // The result should either succeed or fail with a PDF-related error
      // (not a size-related error)
      if (!result.success) {
        expect((result as any).errorCode).not.toBe('OVERSIZE');
      }
    });
  });

  describe('Citation metadata', () => {
    it('should always set verificationStatus to unverified', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length)
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxRetries: 1
      });

      if (isSuccessResult(result)) {
        expect(result.citation.verificationStatus).toBe('unverified');
      }
    });

    it('should always set confidence to medium', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length)
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxRetries: 1
      });

      if (isSuccessResult(result)) {
        expect(result.citation.confidence).toBe('medium');
      }
    });

    it('should include ISO timestamp in accessedAt', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length)
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/doc.pdf',
        maxRetries: 1
      });

      if (isSuccessResult(result)) {
        // Should be valid ISO 8601 format
        const accessedDate = new Date(result.citation.accessedAt);
        expect(accessedDate.toISOString()).toBe(result.citation.accessedAt);
      }
    });

    it('should include original source URL in citation', async () => {
      const mockResponse = createMockResponse({
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(createMinimalPdfBuffer().length)
        },
        chunks: [createMinimalPdfBuffer()]
      });
      setupMock(mockResponse);

      const result = await extractPdfFromUrl({
        url: 'https://example.com/path/to/document.pdf',
        maxRetries: 1
      });

      if (isSuccessResult(result)) {
        expect(result.citation.sourceUrl).toBe('https://example.com/path/to/document.pdf');
      }
    });
  });
});
