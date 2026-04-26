/**
 * PDF Research Utilities
 *
 * Core implementation for reliable PDF extraction from web URLs.
 * Provides URL validation, network resilience, content verification,
 * and structured text extraction with citation metadata.
 */

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import type {
  PdfExtractionOptions,
  PdfExtractionResult,
  PdfExtractionSuccess,
  PdfExtractionFailure,
  LocalPdfExtractionOptions,
  UrlValidationResult,
  PathValidationResult,
  ContentVerificationResult,
  PdfBufferResult,
  FetchConfig,
  ExtractedPage,
  PdfMetadata,
  CitationMetadata,
  PdfErrorCode
} from '../types/pdf-research';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// PDF magic bytes: %PDF- followed by version
const PDF_MAGIC_BYTES = Buffer.from('%PDF-');

// Allowed base directories for local file access (path traversal protection)
const ALLOWED_BASE_DIRS = ['research'];

// Path traversal patterns to block
const BLOCKED_PATH_PATTERNS = [
  /\.\./,                    // Parent directory references
  /^\//,                     // Absolute Unix paths (must use relative)
  /^[a-zA-Z]:/i,              // Windows drive letters
  /~/,                       // Home directory expansion
  /\$/,                      // Environment variable expansion
  /[\/]etc[\/]/i,            // System directories
  /[\/]proc[\/]/i,
  /[\/]sys[\/]/i,
  /[\/]dev[\/]/i,
  /[\/]home[\/]/i,
  /[\/]root[\/]/i,
  /[\/]var[\/]/i,
  /\.env/i,                   // Environment files
  /\.git/i,                   // Git directories
  /\.ssh/i                    // SSH keys
];

// Blocked URL patterns (private IPs, localhost)
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i
];

// ============================================================================
// URL Safety Validation
// ============================================================================

/**
 * Validate URL for safety constraints
 * - Must use HTTPS protocol
 * - Must not be private IP or localhost
 * - Must be a valid URL format
 */
export function validateUrl(url: string): UrlValidationResult {
  try {
    // Check for non-string input
    if (typeof url !== 'string') {
      return {
        valid: false,
        error: 'URL must be a string',
        errorCode: 'INVALID_URL'
      };
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Empty check
    if (!trimmedUrl) {
      return {
        valid: false,
        error: 'URL cannot be empty',
        errorCode: 'INVALID_URL'
      };
    }

    // Parse URL
    const parsedUrl = new URL(trimmedUrl);

    // Enforce HTTPS only
    if (parsedUrl.protocol !== 'https:') {
      return {
        valid: false,
        error: `URL must use HTTPS protocol, got: ${parsedUrl.protocol}`,
        errorCode: 'INVALID_URL'
      };
    }

    // Check for blocked hosts (private IPs, localhost)
    const hostname = parsedUrl.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          error: `Access to ${hostname} is not allowed`,
          errorCode: 'INVALID_URL'
        };
      }
    }

    // Reconstruct sanitized URL
    const sanitizedUrl = parsedUrl.toString();

    return {
      valid: true,
      sanitizedUrl
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`,
      errorCode: 'INVALID_URL'
    };
  }
}

// ============================================================================
// Local File Path Safety Validation
// ============================================================================

/**
 * Resolve project root by looking for package.json
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();

  // Walk up to find project root (where package.json exists)
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to cwd if no package.json found
  return process.cwd();
}

/**
 * Validate local file path for safety constraints
 * - Must be under allowed base directories (research/)
 * - Must not contain path traversal sequences
 * - Must not be absolute path
 * - Must have .pdf extension
 * - Must exist and be readable
 */
export function validateLocalFilePath(filePath: string): PathValidationResult {
  try {
    // Check for non-string input
    if (typeof filePath !== 'string') {
      return {
        valid: false,
        error: 'File path must be a string',
        errorCode: 'INVALID_PATH'
      };
    }

    // Trim whitespace
    const trimmedPath = filePath.trim();

    // Empty check
    if (!trimmedPath) {
      return {
        valid: false,
        error: 'File path cannot be empty',
        errorCode: 'INVALID_PATH'
      };
    }

    // Check for blocked patterns (path traversal, system paths, etc.)
    for (const pattern of BLOCKED_PATH_PATTERNS) {
      if (pattern.test(trimmedPath)) {
        return {
          valid: false,
          error: `Path contains unsafe pattern: ${pattern.source}`,
          errorCode: 'INVALID_PATH'
        };
      }
    }

    // Must have .pdf extension (case insensitive)
    if (!trimmedPath.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: 'File must have .pdf extension',
        errorCode: 'NOT_PDF'
      };
    }

    // Find project root
    const projectRoot = findProjectRoot();

    // Resolve to absolute path
    const absolutePath = path.resolve(projectRoot, trimmedPath);

    // Ensure resolved path is within allowed base directories
    const relativeFromRoot = path.relative(projectRoot, absolutePath);
    const pathComponents = relativeFromRoot.split(path.sep);

    // Must start with allowed base directory
    const baseDir = pathComponents[0];
    if (!ALLOWED_BASE_DIRS.includes(baseDir)) {
      return {
        valid: false,
        error: `Path must be within one of: ${ALLOWED_BASE_DIRS.join(', ')}. Got: ${baseDir || '(none)'}`,
        errorCode: 'INVALID_PATH'
      };
    }

    // Verify path doesn't escape the allowed directory after resolution
    const allowedBasePath = path.join(projectRoot, baseDir);
    const resolvedRelative = path.relative(allowedBasePath, absolutePath);
    if (resolvedRelative.startsWith('..') || resolvedRelative === '..') {
      return {
        valid: false,
        error: 'Path escapes allowed directory after resolution',
        errorCode: 'INVALID_PATH'
      };
    }

    // Check file exists
    if (!fs.existsSync(absolutePath)) {
      return {
        valid: false,
        error: `File not found: ${trimmedPath}`,
        errorCode: 'PATH_NOT_FOUND'
      };
    }

    // Check it's a file (not directory)
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      return {
        valid: false,
        error: 'Path exists but is not a file',
        errorCode: 'INVALID_PATH'
      };
    }

    return {
      valid: true,
      normalizedPath: absolutePath
    };

  } catch (error) {
    return {
      valid: false,
      error: `Path validation failed: ${error instanceof Error ? error.message : String(error)}`,
      errorCode: 'INVALID_PATH'
    };
  }
}

// ============================================================================
// Content Verification
// ============================================================================

/**
 * Verify content headers for PDF validity
 * - Check Content-Type indicates PDF
 * - Check Content-Length within limits
 */
export function verifyContentHeaders(
  contentType: string | undefined,
  contentLength: string | number | undefined,
  maxSizeBytes: number
): ContentVerificationResult {
  // Check content type
  if (contentType) {
    const normalizedType = contentType.toLowerCase().trim();
    const isPdfType =
      normalizedType === 'application/pdf' ||
      normalizedType.startsWith('application/pdf;') ||
      normalizedType === 'application/octet-stream' || // Some servers use this
      normalizedType.endsWith('/pdf');

    if (!isPdfType) {
      return {
        valid: false,
        contentType,
        error: `Content-Type '${contentType}' does not indicate a PDF`,
        errorCode: 'NOT_PDF'
      };
    }
  }

  // Check content length
  if (contentLength !== undefined) {
    const length = typeof contentLength === 'string'
      ? parseInt(contentLength, 10)
      : contentLength;

    if (!isNaN(length) && length > maxSizeBytes) {
      return {
        valid: false,
        contentType,
        contentLength: length,
        error: `File size (${(length / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB)`,
        errorCode: 'OVERSIZE'
      };
    }
  }

  return {
    valid: true,
    contentType,
    contentLength: typeof contentLength === 'string' ? parseInt(contentLength, 10) || undefined : contentLength
  };
}

/**
 * Verify PDF magic bytes in buffer
 */
export function verifyPdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC_BYTES.length) {
    return false;
  }

  return buffer.slice(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES);
}

// ============================================================================
// Network Fetch with Retry
// ============================================================================

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(attempt: number, baseDelay = 1000): number {
  // Exponential backoff: 1s, 2s, 4s
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch PDF from URL with timeout and retry logic
 */
async function fetchPdfWithRetry(
  config: FetchConfig
): Promise<PdfBufferResult> {
  const { url, timeoutMs, maxSizeBytes } = config;

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const request = client.get(
      parsedUrl,
      {
        timeout: timeoutMs,
        headers: {
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; PDF-Research-Bot/1.0)'
        }
      },
      (response) => {
        // Handle redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          // Validate redirect URL
          const validation = validateUrl(redirectUrl);
          if (!validation.valid) {
            reject(new Error(`Redirect to unsafe URL: ${validation.error}`));
            return;
          }
          // Recursively fetch from redirect URL
          fetchPdfWithRetry({
            ...config,
            url: validation.sanitizedUrl!
          }).then(resolve).catch(reject);
          return;
        }

        // Check status code
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage || 'Unknown error'}`));
          return;
        }

        // Verify headers before downloading body
        const contentType = response.headers['content-type'];
        const contentLength = response.headers['content-length'];

        const headerVerification = verifyContentHeaders(
          contentType,
          contentLength,
          maxSizeBytes
        );

        if (!headerVerification.valid) {
          reject(new Error(`[${headerVerification.errorCode}] ${headerVerification.error}`));
          return;
        }

        // Collect data
        const chunks: Buffer[] = [];
        let receivedBytes = 0;

        response.on('data', (chunk: Buffer) => {
          receivedBytes += chunk.length;

          // Check size limit during streaming
          if (receivedBytes > maxSizeBytes) {
            response.destroy();
            reject(new Error('[OVERSIZE] File exceeded size limit during download'));
            return;
          }

          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);

          // Verify PDF magic bytes
          if (!verifyPdfMagicBytes(buffer)) {
            reject(new Error('[NOT_PDF] Content does not have valid PDF header'));
            return;
          }

          resolve({
            buffer,
            contentType: contentType || 'application/pdf',
            contentLength: receivedBytes,
            finalUrl: url
          });
        });

        response.on('error', (error) => {
          reject(error);
        });
      }
    );

    // Timeout handling
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('[TIMEOUT] Request exceeded timeout'));
    });

    request.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOTFOUND') {
        reject(new Error(`[NETWORK_ERROR] Host not found: ${parsedUrl.hostname}`));
      } else if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        reject(new Error(`[NETWORK_ERROR] Connection refused: ${parsedUrl.hostname}`));
      } else if ((error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
        reject(new Error('[TIMEOUT] Connection timed out'));
      } else {
        reject(new Error(`[NETWORK_ERROR] ${error.message}`));
      }
    });
  });
}

/**
 * Fetch PDF with retry logic
 */
async function fetchPdfWithRetryLogic(
  config: FetchConfig
): Promise<PdfBufferResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fetchPdfWithRetry({
        ...config,
        currentAttempt: attempt
      });
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if error is not retryable
      if (lastError.message.includes('[NOT_PDF]') ||
          lastError.message.includes('[OVERSIZE]') ||
          lastError.message.includes('[INVALID_URL]')) {
        throw lastError;
      }

      // Don't sleep after final attempt
      if (attempt < config.maxRetries) {
        const delay = calculateBackoff(attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

// ============================================================================
// PDF Text Extraction
// ============================================================================

/**
 * Lazy-load pdf-parse to avoid issues when not needed
 */
async function getPdfParse(): Promise<typeof import('pdf-parse')> {
  // Dynamic import to handle potential ESM/CJS issues
  const pdfParse = await import('pdf-parse');
  return pdfParse.default || pdfParse;
}

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPdf(
  buffer: Buffer
): Promise<{
  pages: ExtractedPage[];
  metadata: PdfMetadata;
  totalPages: number;
}> {
  try {
    const pdfParse = await getPdfParse();
    const result = await pdfParse(buffer, {
      // Don't use max: 0 to avoid test file issues
      pagerender: undefined
    });

    // pdf-parse provides text but not per-page breakdown in default mode
    // We'll estimate pages from the info
    const totalPages = result.numpages || 1;

    // Parse the text to estimate per-page content
    // Since pdf-parse returns all text, we try to split by page markers if available
    const fullText = result.text || '';

    let pages: ExtractedPage[];

    if (!fullText.trim()) {
      // Empty PDF - return single empty page
      pages = [{
        pageNumber: 1,
        text: '',
        wordCount: 0,
        charCount: 0
      }];
    } else if (totalPages === 1) {
      // Single page PDF
      const trimmedText = fullText.trim();
      pages = [{
        pageNumber: 1,
        text: trimmedText,
        wordCount: trimmedText.split(/\s+/).filter(w => w.length > 0).length,
        charCount: trimmedText.length
      }];
    } else {
      // Multi-page: attempt to split by common page break indicators
      // This is heuristic since pdf-parse doesn't preserve page boundaries
      const lines = fullText.split('\n');
      const estimatedLinesPerPage = Math.ceil(lines.length / totalPages);

      pages = [];
      for (let i = 0; i < totalPages; i++) {
        const startLine = i * estimatedLinesPerPage;
        const endLine = Math.min((i + 1) * estimatedLinesPerPage, lines.length);
        const pageLines = lines.slice(startLine, endLine);
        const pageText = pageLines.join('\n').trim();

        pages.push({
          pageNumber: i + 1,
          text: pageText,
          wordCount: pageText.split(/\s+/).filter(w => w.length > 0).length,
          charCount: pageText.length
        });
      }
    }

    // Extract metadata
    const info = result.info || {};
    const metadata: PdfMetadata = {
      pdfVersion: result.version,
      title: info.Title,
      author: info.Author,
      subject: info.Subject,
      creationDate: info.CreationDate,
      modificationDate: info.ModDate,
      producer: info.Producer
    };

    return { pages, metadata, totalPages };
  } catch (error) {
    // Check for specific parsing errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Invalid PDF') ||
        errorMessage.includes('Malformed') ||
        errorMessage.includes('unexpected')) {
      throw new Error('[MALFORMED_PDF] PDF parsing failed: ' + errorMessage);
    }

    throw new Error('[MALFORMED_PDF] Failed to extract text: ' + errorMessage);
  }
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract PDF content from a URL with full safety checks and retry logic.
 *
 * This is the primary entry point for the PDF research skill.
 * All extracted content is marked as `verificationStatus: 'unverified'`
 * and `confidence: 'medium'` to ensure proper handling downstream.
 *
 * @param options - Extraction options including URL and optional configuration
 * @returns Promise resolving to extraction result (success or failure)
 */
export async function extractPdfFromUrl(
  options: PdfExtractionOptions
): Promise<PdfExtractionResult> {
  const startTime = new Date().toISOString();

  // Normalize options
  const maxRetries = Math.max(1, Math.min(options.maxRetries || DEFAULT_MAX_RETRIES, 5));
  const timeoutMs = Math.max(5000, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const maxSizeBytes = Math.max(
    1024 * 1024, // Minimum 1MB
    Math.min(options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES, 100 * 1024 * 1024) // Max 100MB
  );

  // Step 1: Validate URL
  const urlValidation = validateUrl(options.url);
  if (!urlValidation.valid) {
    return createFailureResult({
      url: options.url,
      error: urlValidation.error!,
      errorCode: 'INVALID_URL',
      retryable: false,
      attempts: 0,
      attemptedAt: startTime
    });
  }

  const sanitizedUrl = urlValidation.sanitizedUrl!;

  try {
    // Step 2: Fetch with retry logic
    const fetchResult = await fetchPdfWithRetryLogic({
      url: sanitizedUrl,
      timeoutMs,
      maxSizeBytes,
      currentAttempt: 1,
      maxRetries
    });

    // Step 3: Extract text
    const extraction = await extractTextFromPdf(fetchResult.buffer);

    // Check for empty content
    const totalWordCount = extraction.pages.reduce((sum, p) => sum + p.wordCount, 0);
    if (totalWordCount === 0) {
      return createFailureResult({
        url: sanitizedUrl,
        error: 'PDF contains no extractable text (may be scanned/image-based)',
        errorCode: 'EMPTY_CONTENT',
        retryable: false,
        attempts: 1,
        attemptedAt: new Date().toISOString()
      });
    }

    // Step 4: Build citation metadata
    const citation: CitationMetadata = {
      accessedAt: new Date().toISOString(),
      verificationStatus: 'unverified',
      confidence: 'medium',
      sourceUrl: sanitizedUrl
    };

    // Step 5: Return success
    return createSuccessResult({
      url: sanitizedUrl,
      extraction: {
        pages: extraction.pages,
        totalPages: extraction.totalPages,
        totalWordCount,
        totalCharCount: extraction.pages.reduce((sum, p) => sum + p.charCount, 0)
      },
      metadata: extraction.metadata,
      citation
    });

  } catch (error) {
    // Parse error to determine code and retryability
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { code, retryable } = parseErrorCode(errorMessage);

    return createFailureResult({
      url: sanitizedUrl,
      error: errorMessage.replace(/^\[[A-Z_]+\]\s*/, ''), // Strip error code prefix
      errorCode: code,
      retryable,
      attempts: maxRetries,
      attemptedAt: new Date().toISOString()
    });
  }
}

// ============================================================================
// Local File Extraction
// ============================================================================

/**
 * Extract PDF content from a local file with full safety checks.
 *
 * This is the primary entry point for the local PDF ingestion workflow.
 * All extracted content is marked as `verificationStatus: 'unverified'`
 * and `confidence: 'medium'` to ensure proper handling downstream.
 *
 * @param options - Extraction options including file path and optional configuration
 * @returns Promise resolving to extraction result (success or failure)
 */
export async function extractPdfFromFile(
  options: LocalPdfExtractionOptions
): Promise<PdfExtractionResult> {
  const startTime = new Date().toISOString();

  // Normalize options
  const maxSizeBytes = Math.max(
    1024 * 1024, // Minimum 1MB
    options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES
  );

  // Step 1: Validate file path
  const pathValidation = validateLocalFilePath(options.filePath);
  if (!pathValidation.valid) {
    return createFailureResult({
      url: options.filePath, // Use file path as identifier
      error: pathValidation.error!,
      errorCode: pathValidation.errorCode!,
      retryable: false,
      attempts: 0,
      attemptedAt: startTime
    });
  }

  const normalizedPath = pathValidation.normalizedPath!;

  try {
    // Step 2: Check file size
    const stats = fs.statSync(normalizedPath);
    if (stats.size > maxSizeBytes) {
      return createFailureResult({
        url: options.filePath,
        error: `File size (${(stats.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB)`,
        errorCode: 'OVERSIZE',
        retryable: false,
        attempts: 1,
        attemptedAt: new Date().toISOString()
      });
    }

    // Step 3: Read file
    const buffer = fs.readFileSync(normalizedPath);

    // Step 4: Verify PDF magic bytes
    if (!verifyPdfMagicBytes(buffer)) {
      return createFailureResult({
        url: options.filePath,
        error: 'Content does not have valid PDF header',
        errorCode: 'NOT_PDF',
        retryable: false,
        attempts: 1,
        attemptedAt: new Date().toISOString()
      });
    }

    // Step 5: Extract text
    const extraction = await extractTextFromPdf(buffer);

    // Check for empty content
    const totalWordCount = extraction.pages.reduce((sum, p) => sum + p.wordCount, 0);
    if (totalWordCount === 0) {
      return createFailureResult({
        url: options.filePath,
        error: 'PDF contains no extractable text (may be scanned/image-based)',
        errorCode: 'EMPTY_CONTENT',
        retryable: false,
        attempts: 1,
        attemptedAt: new Date().toISOString()
      });
    }

    // Step 6: Build citation metadata
    // Use provided sourceUrl if available, otherwise use local file reference
    const sourceReference = options.sourceUrl || `file://${normalizedPath}`;
    const citation: CitationMetadata = {
      accessedAt: new Date().toISOString(),
      verificationStatus: 'unverified',
      confidence: 'medium',
      sourceUrl: sourceReference
    };

    // Step 7: Return success
    return createSuccessResult({
      url: options.filePath,
      extraction: {
        pages: extraction.pages,
        totalPages: extraction.totalPages,
        totalWordCount,
        totalCharCount: extraction.pages.reduce((sum, p) => sum + p.charCount, 0)
      },
      metadata: extraction.metadata,
      citation
    });

  } catch (error) {
    // Parse error to determine code and retryability
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { code, retryable } = parseErrorCode(errorMessage);

    return createFailureResult({
      url: options.filePath,
      error: errorMessage.replace(/^\[[A-Z_]+\]\s*/, ''), // Strip error code prefix
      errorCode: code,
      retryable,
      attempts: 1,
      attemptedAt: new Date().toISOString()
    });
  }
}

/**
 * Parse error message to extract code and determine retryability
 */
function parseErrorCode(message: string): { code: PdfErrorCode; retryable: boolean } {
  const codeMatch = message.match(/^\[([A-Z_]+)\]/);
  const code = (codeMatch?.[1] || 'FETCH_FAILED') as PdfErrorCode;

  const retryableCodes: PdfErrorCode[] = ['NETWORK_ERROR', 'TIMEOUT', 'FETCH_FAILED'];
  const retryable = retryableCodes.includes(code);

  return { code, retryable };
}

// ============================================================================
// Result Builders
// ============================================================================

interface FailureParams {
  url: string;
  error: string;
  errorCode: PdfErrorCode;
  retryable: boolean;
  attempts: number;
  attemptedAt: string;
}

function createFailureResult(params: FailureParams): PdfExtractionFailure {
  return {
    success: false,
    url: params.url,
    error: params.error,
    errorCode: params.errorCode,
    retryable: params.retryable,
    attempts: params.attempts,
    attemptedAt: params.attemptedAt
  };
}

interface SuccessParams {
  url: string;
  extraction: {
    pages: ExtractedPage[];
    totalPages: number;
    totalWordCount: number;
    totalCharCount: number;
  };
  metadata: PdfMetadata;
  citation: CitationMetadata;
}

function createSuccessResult(params: SuccessParams): PdfExtractionSuccess {
  return {
    success: true,
    url: params.url,
    extraction: params.extraction,
    metadata: params.metadata,
    citation: params.citation
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Check if an error code is retryable
 */
export function isRetryableError(code: PdfErrorCode): boolean {
  const retryableCodes: PdfErrorCode[] = ['NETWORK_ERROR', 'TIMEOUT', 'FETCH_FAILED'];
  return retryableCodes.includes(code);
}

/**
 * Calculate estimated reading time in minutes
 */
export function estimateReadingTime(wordCount: number, wpm = 200): number {
  return Math.ceil(wordCount / wpm);
}

/**
 * Format extraction result as markdown citation
 */
export function formatCitation(result: PdfExtractionSuccess): string {
  const { citation, metadata } = result;
  const lines: string[] = [
    `Source: ${citation.sourceUrl}`,
    `Accessed: ${citation.accessedAt}`,
    `Status: ${citation.verificationStatus} (${citation.confidence} confidence)`
  ];

  if (metadata.title) {
    lines.push(`Title: ${metadata.title}`);
  }

  if (metadata.author) {
    lines.push(`Author: ${metadata.author}`);
  }

  return lines.join('\n');
}
