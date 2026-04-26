---
skill: pdf-research
version: 1.0.0
status: mvp
---

# PDF Research Skill

MVP implementation for reliable PDF text extraction from web URLs.

## Capabilities

- URL safety validation (HTTPS only, no private IPs)
- Network resilience with timeout and retry logic
- PDF content verification (magic bytes, size limits)
- Structured text extraction with page-level granularity
- Citation metadata generation (access time, verification status)
- Graceful error handling with specific error codes

## Limitations (MVP)

- No OCR support for scanned/image PDFs
- No authentication support for protected PDFs
- Single PDF per invocation (no batch processing)
- Maximum file size: 50MB
- Text extraction only (no tables, images, or formatting preservation)
- All extracted content marked as `unverified`

## Dependencies

- `pdf-parse` - PDF text extraction library
- Node.js built-in `https` for fetching

## Configuration

No configuration required. Behavior is controlled via function parameters:

```typescript
interface PdfExtractionOptions {
  url: string;
  maxRetries?: number;      // default: 3
  timeoutMs?: number;       // default: 30000
  maxSizeBytes?: number;    // default: 52428800 (50MB)
}
```

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `INVALID_URL` | URL fails safety validation | No |
| `NETWORK_ERROR` | Connection failed | Yes |
| `TIMEOUT` | Request exceeded timeout | Yes |
| `NOT_PDF` | Content-Type or magic bytes invalid | No |
| `OVERSIZE` | File exceeds size limit | No |
| `MALFORMED_PDF` | PDF parsing failed | No |
| `EMPTY_CONTENT` | PDF has no extractable text | No |

## Usage Example

```typescript
import { extractPdfFromUrl } from '@/utils/pdf-research';

const result = await extractPdfFromUrl({
  url: 'https://example.com/document.pdf'
});

if (result.success) {
  console.log(`Extracted ${result.extraction.totalPages} pages`);
  for (const page of result.extraction.pages) {
    console.log(`Page ${page.pageNumber}: ${page.wordCount} words`);
  }
}
```
