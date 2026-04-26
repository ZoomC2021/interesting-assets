/**
 * PDF Research Type Definitions
 *
 * TypeScript interfaces for PDF extraction pipeline.
 * Provides structured types for URL-based PDF processing with
 * citation metadata and confidence tracking.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Options for PDF extraction from URL
 */
export interface PdfExtractionOptions {
  /** URL of the PDF document (must be HTTPS) */
  url: string;
  /** Maximum retry attempts for network failures (default: 3) */
  maxRetries?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Maximum file size in bytes (default: 52428800 = 50MB) */
  maxSizeBytes?: number;
}

/**
 * Options for local PDF file extraction
 */
export interface LocalPdfExtractionOptions {
  /** Absolute or relative path to the local PDF file */
  filePath: string;
  /** Maximum file size in bytes (default: 52428800 = 50MB) */
  maxSizeBytes?: number;
  /** Optional source URL reference for citation metadata */
  sourceUrl?: string;
}

/**
 * Internal fetch configuration
 */
export interface FetchConfig {
  url: string;
  timeoutMs: number;
  maxSizeBytes: number;
  currentAttempt: number;
  maxRetries: number;
}

// ============================================================================
// Extraction Output Types
// ============================================================================

/**
 * Single page extraction result
 */
export interface ExtractedPage {
  /** 1-based page number */
  pageNumber: number;
  /** Extracted text content (trimmed) */
  text: string;
  /** Word count for this page */
  wordCount: number;
  /** Character count for this page */
  charCount: number;
}

/**
 * Aggregated extraction results
 */
export interface PdfExtraction {
  /** Array of extracted pages in order */
  pages: ExtractedPage[];
  /** Total number of pages */
  totalPages: number;
  /** Total word count across all pages */
  totalWordCount: number;
  /** Total character count across all pages */
  totalCharCount: number;
}

/**
 * PDF document metadata (when available)
 */
export interface PdfMetadata {
  /** PDF version string (e.g., "1.4") */
  pdfVersion?: string;
  /** Document title from metadata */
  title?: string;
  /** Document author from metadata */
  author?: string;
  /** Document subject from metadata */
  subject?: string;
  /** Document creation date from metadata */
  creationDate?: string;
  /** Document modification date from metadata */
  modificationDate?: string;
  /** Producer software from metadata */
  producer?: string;
}

/**
 * Citation metadata for audit trail
 */
export interface CitationMetadata {
  /** ISO 8601 timestamp of when the PDF was accessed */
  accessedAt: string;
  /**
   * Verification status - always 'unverified' for MVP
   * Content has been automatically extracted but not human-verified
   */
  verificationStatus: 'unverified';
  /**
   * Confidence level for extraction quality
   * - 'medium' for automated extraction with structural validation
   */
  confidence: 'medium';
  /** URL that was accessed */
  sourceUrl: string;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Successful extraction result
 */
export interface PdfExtractionSuccess {
  success: true;
  /** The URL that was processed */
  url: string;
  /** Extracted content with page breakdown */
  extraction: PdfExtraction;
  /** PDF metadata (if available) */
  metadata: PdfMetadata;
  /** Citation metadata for referencing */
  citation: CitationMetadata;
}

/**
 * Error codes for extraction failures
 */
export type PdfErrorCode =
  | 'INVALID_URL'      // URL fails safety validation
  | 'INVALID_PATH'     // Local file path fails safety validation
  | 'PATH_NOT_FOUND'   // Local file does not exist
  | 'NETWORK_ERROR'    // Connection failed
  | 'TIMEOUT'          // Request exceeded timeout
  | 'NOT_PDF'          // Content-Type or magic bytes invalid
  | 'OVERSIZE'         // File exceeds size limit
  | 'MALFORMED_PDF'    // PDF parsing failed
  | 'EMPTY_CONTENT'    // PDF has no extractable text
  | 'FETCH_FAILED';    // All retry attempts exhausted

/**
 * Failed extraction result
 */
export interface PdfExtractionFailure {
  success: false;
  /** The URL that was attempted */
  url: string;
  /** Human-readable error description */
  error: string;
  /** Machine-readable error code */
  errorCode: PdfErrorCode;
  /** Whether the error is potentially retryable */
  retryable: boolean;
  /** Number of attempts made before failure */
  attempts: number;
  /** Timestamp of final attempt */
  attemptedAt: string;
}

/**
 * Union type for extraction results
 */
export type PdfExtractionResult = PdfExtractionSuccess | PdfExtractionFailure;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * URL safety validation result
 */
export interface UrlValidationResult {
  /** Whether the URL passed safety checks */
  valid: boolean;
  /** Sanitized/normalized URL if valid */
  sanitizedUrl?: string;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: Extract<PdfErrorCode, 'INVALID_URL'>;
}

/**
 * Local file path validation result
 */
export interface PathValidationResult {
  /** Whether the path passed safety checks */
  valid: boolean;
  /** Normalized absolute path if valid */
  normalizedPath?: string;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: Extract<PdfErrorCode, 'INVALID_PATH' | 'PATH_NOT_FOUND' | 'NOT_PDF'>;
}

/**
 * Content verification result from initial fetch
 */
export interface ContentVerificationResult {
  /** Whether content passed verification */
  valid: boolean;
  /** Content-Type header value */
  contentType?: string;
  /** Content-Length in bytes */
  contentLength?: number;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: Extract<PdfErrorCode, 'NOT_PDF' | 'OVERSIZE'>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Retry state tracking
 */
export interface RetryState {
  /** Current attempt number (1-based) */
  attempt: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Milliseconds to wait before next attempt */
  delayMs: number;
  /** Whether retry is still possible */
  canRetry: boolean;
}

/**
 * PDF buffer with metadata from fetch
 */
export interface PdfBufferResult {
  /** PDF content as Buffer */
  buffer: Buffer;
  /** Response content type */
  contentType: string;
  /** Response content length */
  contentLength: number;
  /** Final URL after redirects */
  finalUrl: string;
}
