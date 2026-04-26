#!/usr/bin/env ts-node
/**
 * Local PDF Ingestion CLI
 *
 * Command-line interface for extracting content from local PDF files.
 * Enforces path safety constraints and outputs structured extraction results.
 *
 * Usage:
 *   npx ts-node scripts/ingest-local-pdf.ts --file research/document.pdf
 *   npx ts-node scripts/ingest-local-pdf.ts --file research/document.pdf --source-url https://example.com/source.pdf
 *   npx ts-node scripts/ingest-local-pdf.ts --file research/document.pdf --output extraction.json
 */

import * as fs from 'fs';
import { extractPdfFromFile } from '../src/utils/pdf-research';
import type { PdfExtractionResult } from '../src/types/pdf-research';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
  filePath: string | null;
  sourceUrl: string | null;
  outputPath: string | null;
  maxSizeMB: number;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    filePath: null,
    sourceUrl: null,
    outputPath: null,
    maxSizeMB: 50,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--file':
      case '-f':
        result.filePath = args[++i] || null;
        break;
      case '--source-url':
      case '-s':
        result.sourceUrl = args[++i] || null;
        break;
      case '--output':
      case '-o':
        result.outputPath = args[++i] || null;
        break;
      case '--max-size':
      case '-m':
        const size = parseInt(args[++i], 10);
        if (!isNaN(size) && size > 0) {
          result.maxSizeMB = size;
        }
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Local PDF Ingestion CLI

Extract text content from local PDF files with safety validation.

Usage:
  npx ts-node scripts/ingest-local-pdf.ts [options]

Options:
  --file, -f <path>       Path to local PDF file (required, must be under research/)
  --source-url, -s <url>  Optional original source URL for citation metadata
  --output, -o <path>     Optional output JSON file path (defaults to stdout)
  --max-size, -m <mb>     Maximum file size in MB (default: 50)
  --help, -h              Show this help message

Examples:
  npx ts-node scripts/ingest-local-pdf.ts --file research/document.pdf
  npx ts-node scripts/ingest-local-pdf.ts -f research/document.pdf -s https://bursa.com/report.pdf
  npx ts-node scripts/ingest-local-pdf.ts -f research/document.pdf -o extraction.json

Safety Constraints:
  - File path must be within the research/ directory
  - No path traversal (..) allowed
  - No absolute paths or environment variables
  - File must have .pdf extension
  - File size must be under limit (default 50MB)

Exit Codes:
  0  Success (extraction completed)
  1  Invalid arguments or validation failure
  2  Extraction failed
`);
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatOutput(result: PdfExtractionResult): string {
  return JSON.stringify(result, null, 2);
}

function formatSummary(result: PdfExtractionResult): string {
  if (result.success) {
    return `
Extraction Summary:
  Status: SUCCESS
  File: ${result.url}
  Pages: ${result.extraction.totalPages}
  Words: ${result.extraction.totalWordCount}
  Characters: ${result.extraction.totalCharCount}
  Metadata: ${result.metadata.title ? `Title: ${result.metadata.title}` : 'No title'}
  Citation: ${result.citation.sourceUrl}
  Accessed: ${result.citation.accessedAt}
  Verification: ${result.citation.verificationStatus} (${result.citation.confidence} confidence)
`;
  } else {
    return `
Extraction Summary:
  Status: FAILED
  File: ${result.url}
  Error: ${result.error}
  Error Code: ${result.errorCode}
  Retryable: ${result.retryable}
  Attempts: ${result.attempts}
`;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<number> {
  const args = parseArgs();

  // Show help
  if (args.help) {
    printHelp();
    return 0;
  }

  // Validate required arguments
  if (!args.filePath) {
    console.error('Error: --file is required');
    console.error('Run with --help for usage information');
    return 1;
  }

  // Perform extraction
  console.error(`Extracting: ${args.filePath}`);
  if (args.sourceUrl) {
    console.error(`Source URL: ${args.sourceUrl}`);
  }

  const result = await extractPdfFromFile({
    filePath: args.filePath,
    maxSizeBytes: args.maxSizeMB * 1024 * 1024,
    sourceUrl: args.sourceUrl || undefined
  });

  // Print summary to stderr
  console.error(formatSummary(result));

  // Output JSON
  const output = formatOutput(result);

  if (args.outputPath) {
    // Write to file
    try {
      fs.writeFileSync(args.outputPath, output, 'utf-8');
      console.error(`Output written to: ${args.outputPath}`);
    } catch (error) {
      console.error(`Error writing output file: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  } else {
    // Write to stdout
    console.log(output);
  }

  // Return appropriate exit code
  return result.success ? 0 : 2;
}

// Run main
main()
  .then(code => process.exit(code))
  .catch(error => {
    console.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
