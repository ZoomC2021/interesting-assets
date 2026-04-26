# PDF Research Skill

Reliable PDF extraction from web links for research workflows.

## Purpose

This skill provides a robust, auditable pipeline for extracting text content from PDF documents hosted at URLs. It addresses common reliability issues when reading PDFs from web links by implementing:

- URL safety validation
- Network resilience (timeout + retry)
- Content verification (PDF magic bytes, size limits)
- Structured extraction output with page references
- Explicit unverified status for all extracted content

## When to Use

Use this skill when you need to:
- Extract text from a PDF hosted at a public URL
- Obtain structured content with page-level references
- Ensure citation metadata for audit trails
- Handle unreliable network conditions gracefully

## When NOT to Use

Do NOT use this skill for:
- PDFs requiring authentication (not supported in MVP)
- Scanned/image PDFs requiring OCR (not supported in MVP)
- Batch processing of multiple PDFs (process sequentially)
- PDFs exceeding 50MB size limit

## Workflow

1. **Validate URL** → Ensure HTTPS, no localhost/private IPs
2. **Fetch with retry** → 3 attempts with exponential backoff
3. **Verify content** → Check PDF magic bytes, size < 50MB
4. **Extract text** → Parse pages with text extraction
5. **Structure output** → Return pages array with metadata
6. **Mark unverified** → All content has `verificationStatus: 'unverified'`

## Output Format

```typescript
{
  success: boolean;
  url: string;
  extraction: {
    pages: Array<{
      pageNumber: number;
      text: string;
      wordCount: number;
    }>;
    totalPages: number;
    totalWordCount: number;
  };
  metadata: {
    pdfVersion?: string;
    title?: string;
    author?: string;
    creationDate?: string;
  };
  citation: {
    accessedAt: string;  // ISO timestamp
    verificationStatus: 'unverified';  // Always unverified for MVP
    confidence: 'medium';  // Always medium for automated extraction
  };
  error?: string;
  errorCode?: string;
}
```

## Safety Constraints

- URLs must use HTTPS protocol
- Private IP ranges (10.x, 192.168.x, 127.x) are blocked
- Maximum file size: 50MB
- Request timeout: 30 seconds per attempt
- Maximum 3 retry attempts

## Confidence Levels

- `high`: Manual verification with source document
- `medium`: Automated extraction with structural validation (this skill)
- `low`: Unvalidated parsing or heuristic extraction

This skill always returns `confidence: 'medium'` because extraction is automated but structurally validated.

## Verification Status

- `verified`: Human reviewed against source
- `sampled`: Spot-checked by human
- `unverified`: Automated extraction only (this skill)

This skill always returns `verificationStatus: 'unverified'` to ensure downstream consumers treat content as provisional.
