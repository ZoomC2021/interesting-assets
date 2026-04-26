# PDF Research Skill

Reliable PDF extraction from web links and local files for research workflows.

## Purpose

This skill provides a robust, auditable pipeline for extracting text content from PDF documents hosted at URLs or stored locally. It addresses common reliability issues when reading PDFs by implementing:

- URL safety validation
- Local file path safety validation
- Network resilience (timeout + retry)
- Content verification (PDF magic bytes, size limits)
- Structured extraction output with page references
- Explicit unverified status for all extracted content

## Two Workflows

### 1. URL-based Extraction (Remote PDFs)
For PDFs hosted on the web (Bursa Malaysia, investor relations sites, etc.):
- Fetches PDF via HTTPS with retry logic
- Full URL safety validation
- Best for: Publicly hosted documents

### 2. Local File Ingestion (Downloaded PDFs)
For PDFs already downloaded to the local filesystem:
- Reads from `research/` directory only
- Path traversal protection
- Optional source URL for citation metadata
- Best for: Manual downloads from Bursa/IR sites before processing

## When to Use

Use this skill when you need to:
- Extract text from a PDF hosted at a public URL
- Extract text from a local PDF file (manual download workflow)
- Obtain structured content with page-level references
- Ensure citation metadata for audit trails
- Handle unreliable network conditions gracefully

### URL Extraction vs Local Ingest

**Use URL extraction when:**
- The PDF is reliably hosted at a public HTTPS URL
- You want automated fetching with retry logic
- The source maintains stable URLs

**Use local ingest when:**
- The PDF was manually downloaded from Bursa/IR site
- The URL requires authentication or session tokens
- You need to process files ahead of time
- Network conditions are unstable for large downloads

## When NOT to Use

Do NOT use this skill for:
- PDFs requiring authentication (not supported in MVP)
- Scanned/image PDFs requiring OCR (not supported in MVP)
- Batch processing of multiple PDFs (process sequentially)
- PDFs exceeding 50MB size limit
- Local files outside the `research/` directory

## Workflows

### URL-based Workflow

1. **Validate URL** → Ensure HTTPS, no localhost/private IPs
2. **Fetch with retry** → 3 attempts with exponential backoff
3. **Verify content** → Check PDF magic bytes, size < 50MB
4. **Extract text** → Parse pages with text extraction
5. **Structure output** → Return pages array with metadata
6. **Mark unverified** → All content has `verificationStatus: 'unverified'`

### Local File Workflow

1. **Validate path** → Ensure under `research/`, no traversal sequences
2. **Check existence** → Verify file exists and is readable
3. **Check size** → Verify file size < limit (default 50MB)
4. **Verify content** → Check PDF magic bytes
5. **Extract text** → Parse pages with text extraction
6. **Structure output** → Return pages array with metadata
7. **Mark unverified** → All content has `verificationStatus: 'unverified'`

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

### URL Extraction
- URLs must use HTTPS protocol
- Private IP ranges (10.x, 192.168.x, 127.x) are blocked
- Maximum file size: 50MB
- Request timeout: 30 seconds per attempt
- Maximum 3 retry attempts

### Local File Ingestion
- File path must be within the `research/` directory
- No path traversal sequences (`..`) allowed
- No absolute paths (`/etc/passwd`, `C:\Windows`)
- No environment variable expansion (`$HOME`, `%TEMP%`)
- File must have `.pdf` extension
- Maximum file size: 50MB (configurable)

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

## Manual Download + Local Ingest Workflow

For Bursa Malaysia and Investor Relations PDFs that may have session-based or time-limited URLs:

### Step 1: Manual Download
1. Navigate to the Bursa/IR website
2. Locate the desired document (annual report, quarterly results, etc.)
3. Download the PDF to your local `research/` directory
4. Note the original source URL for citation metadata

### Step 2: Local Ingest

**Option A: Using Make**
```bash
# Basic ingest
make ingest-pdf FILE=research/annual-report-2024.pdf

# With source URL for proper citation
make ingest-pdf FILE=research/annual-report-2024.pdf SOURCE_URL=https://bursamalaysia.com/.../report.pdf

# Save output to file
make ingest-pdf FILE=research/annual-report-2024.pdf OUTPUT=reports/annual-2024.json
```

**Option B: Using CLI directly**
```bash
npx ts-node scripts/ingest-local-pdf.ts \
  --file research/annual-report-2024.pdf \
  --source-url https://bursamalaysia.com/.../report.pdf \
  --output extraction.json
```

### Step 3: Process Output
The extraction produces a JSON result with:
- Full text content organized by page
- Word and character counts
- PDF metadata (title, author, etc.)
- Citation metadata with access timestamp
- Verification status (always `unverified`)

### Best Practices
- Always preserve the original source URL in the `sourceUrl` parameter
- Use descriptive filenames in the `research/` directory
- Process one document at a time for clarity
- Verify the extraction succeeded before downstream use
