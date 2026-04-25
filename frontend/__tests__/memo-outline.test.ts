import { extractMemoOutline, slugifyHeading } from '@/lib/memo-outline';

describe('slugifyHeading', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugifyHeading('Executive Summary')).toBe('executive-summary');
  });

  it('strips single-level numeric prefixes like "1."', () => {
    expect(slugifyHeading('1. Company Overview')).toBe('company-overview');
  });

  it('strips multi-level numeric prefixes like "1.2"', () => {
    expect(slugifyHeading('1.2 REIT Manager Deep Dive')).toBe('reit-manager-deep-dive');
  });

  it('strips deeply nested prefixes like "1.2.3"', () => {
    expect(slugifyHeading('1.2.3 Board Governance')).toBe('board-governance');
  });

  it('removes non-alphanumeric characters', () => {
    expect(slugifyHeading('Tenant & Concentration Risk')).toBe('tenant-concentration-risk');
  });

  it('collapses repeated whitespace into a single hyphen', () => {
    expect(slugifyHeading('Outlook    &    Thesis')).toBe('outlook-thesis');
  });

  it('returns an empty string for numeric-only headings', () => {
    // The regex consumes the numeric prefix and the body is now empty.
    expect(slugifyHeading('2024')).toBe('');
  });

  it('handles empty input gracefully', () => {
    expect(slugifyHeading('')).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(slugifyHeading('  Executive Summary  ')).toBe('executive-summary');
  });
});

describe('extractMemoOutline', () => {
  it('extracts H2 headings in document order', () => {
    const markdown = `# Memo Title

Some intro paragraph.

## Executive Summary

Body.

## Company Overview

Body.

## Outlook & Thesis

Body.
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'executive-summary', label: 'Executive Summary' },
      { id: 'company-overview', label: 'Company Overview' },
      { id: 'outlook-thesis', label: 'Outlook & Thesis' },
    ]);
  });

  it('ignores H1 and H3+ headings', () => {
    const markdown = `# Title

## Only Section

### Nested

#### Deeply Nested
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'only-section', label: 'Only Section' },
    ]);
  });

  it('preserves the original label while slugifying the id', () => {
    const markdown = `## 1. Company Overview

## 1.2 REIT Manager Deep Dive
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'company-overview', label: '1. Company Overview' },
      { id: 'reit-manager-deep-dive', label: '1.2 REIT Manager Deep Dive' },
    ]);
  });

  it('skips headings that appear inside fenced code blocks', () => {
    const markdown = `## Real Section

\`\`\`
## Not A Heading
\`\`\`

## Another Real Section
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'real-section', label: 'Real Section' },
      { id: 'another-real-section', label: 'Another Real Section' },
    ]);
  });

  it('de-duplicates entries that would collide on their slug', () => {
    const markdown = `## Financials

## Financials
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'financials', label: 'Financials' },
    ]);
  });

  it('de-duplicates entries that collide only after numeric-prefix stripping', () => {
    const markdown = `## 1. Risk

## 2. Risk
`;

    // Both slugify to "risk" after the numeric prefix is stripped; the second
    // occurrence should be dropped so the outline stays unambiguous.
    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'risk', label: '1. Risk' },
    ]);
  });

  it('drops headings whose slug is empty after normalization', () => {
    const markdown = `## 2024

## Executive Summary
`;

    expect(extractMemoOutline(markdown)).toEqual([
      { id: 'executive-summary', label: 'Executive Summary' },
    ]);
  });

  it('returns an empty array when the document has no H2s', () => {
    expect(extractMemoOutline('# Title only\n\nA paragraph.')).toEqual([]);
  });

  it('tolerates trailing ATX close markers (e.g. "## Heading ##")', () => {
    expect(extractMemoOutline('## Executive Summary ##\n')).toEqual([
      { id: 'executive-summary', label: 'Executive Summary' },
    ]);
  });
});
