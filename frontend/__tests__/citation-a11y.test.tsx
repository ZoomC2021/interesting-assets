/**
 * @jest-environment jsdom
 */

/**
 * citation-a11y.test.tsx - Accessibility tests for citation components
 *
 * Tests keyboard navigation, screen reader support, and focus management
 * for citation links in markdown content.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoMarkdown } from '../components/reit-research/MemoMarkdown';
import { AnalysisMarkdown } from '../components/AnalysisMarkdown';
import type { ResearchCitation } from '../data/reits';
import type { Reference } from '../types/frontend';

// ============================================================================
// Mock Data
// ============================================================================

const mockResearchCitations: ResearchCitation[] = [
  {
    id: 'T:001',
    type: 'Annual Report',
    title: 'Annual Report 2025',
    date: '2025-03-31',
    url: 'https://example.com/ar2025',
    fact: 'Total assets RM 500M',
  },
  {
    id: 'A:042',
    type: 'Bursa Announcement',
    title: 'Quarterly Report Q4 2025',
    date: '2025-02-28',
    fact: 'Share price RM 1.52',
  },
];

const mockReferences: Reference[] = [
  {
    id: 'ref-1',
    displayId: 'T:001',
    fact: 'Total assets RM 500M',
    source: 'Annual Report 2025',
    citation: 'Company Annual Report, p. 45',
    url: 'https://example.com/ar2025',
    dateAccessed: '2025-04-20',
    timeSensitive: false,
    entityId: 'entity-1',
  },
  {
    id: 'ref-2',
    displayId: 'A:042',
    fact: 'Share price RM 1.52',
    source: 'Bursa Malaysia',
    citation: 'Bursa Announcement dated 2025-04-15',
    url: 'https://bursa.com/announcement',
    dateAccessed: '2025-04-20',
    timeSensitive: true,
    entityId: 'entity-1',
  },
];

// ============================================================================
// MemoMarkdown Accessibility Tests
// ============================================================================

describe('MemoMarkdown Citation Accessibility', () => {
  it('renders citation buttons with proper accessible names', () => {
    render(
      <MemoMarkdown
        markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
        citations={mockResearchCitations}
        onCitationClick={jest.fn()}
      />,
    );

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    expect(citationButton).toHaveAttribute('title', 'View source T:001');
    expect(citationButton).toHaveAttribute('type', 'button');
  });

  it('supports keyboard navigation to citation buttons', async () => {
    const user = userEvent.setup();

    render(
      <MemoMarkdown
        markdown={`## Executive Summary

Paragraph with citation [T:001] and more text.
`}
        citations={mockResearchCitations}
        onCitationClick={jest.fn()}
      />,
    );

    // Tab to the citation button
    await user.tab();

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    expect(citationButton).toHaveFocus();
  });

  it('allows activation via keyboard Enter key', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <MemoMarkdown
        markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
        citations={mockResearchCitations}
        onCitationClick={handleClick}
      />,
    );

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    citationButton.focus();

    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('T:001');
  });

  it('allows activation via keyboard Space key', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <MemoMarkdown
        markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
        citations={mockResearchCitations}
        onCitationClick={handleClick}
      />,
    );

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    citationButton.focus();

    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('T:001');
  });

  it('preserves content structure for screen readers', () => {
    render(
      <MemoMarkdown
        markdown={`## Executive Summary

First paragraph [T:001] with citation.

- List item [A:042] with citation
- Another item without citation
`}
        citations={mockResearchCitations}
        onCitationClick={jest.fn()}
      />,
    );

    // Paragraph should be readable
    const paragraph = screen.getByText((content) =>
      content.includes('First paragraph') && content.includes('with citation'),
    );
    expect(paragraph).toBeInTheDocument();

    // List structure should be preserved
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(2);
  });

  it('does not interfere with link navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoMarkdown
        markdown={`## Executive Summary

Visit [our website](https://example.com) or see citation [T:001].
`}
        citations={mockResearchCitations}
        onCitationClick={jest.fn()}
      />,
    );

    // External link should be separate from citation button
    const externalLink = screen.getByRole('link', { name: /our website/i });
    expect(externalLink).toHaveAttribute('href', 'https://example.com');

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    expect(citationButton).toBeInTheDocument();

    // Should be able to tab between them
    await user.tab();

    // Depending on DOM order, one of them should have focus
    const focusedElement = document.activeElement;
    expect(
      focusedElement === externalLink || focusedElement === citationButton,
    ).toBe(true);
  });
});

// ============================================================================
// AnalysisMarkdown Accessibility Tests
// ============================================================================

describe('AnalysisMarkdown Citation Accessibility', () => {
  it('renders citation buttons with proper accessible names', () => {
    render(
      <AnalysisMarkdown
        markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
        references={mockReferences}
        onCitationClick={jest.fn()}
      />,
    );

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    expect(citationButton).toHaveAttribute('title', 'View source T:001');
    expect(citationButton).toHaveAttribute('type', 'button');
  });

  it('supports keyboard navigation to citation buttons', async () => {
    const user = userEvent.setup();

    render(
      <AnalysisMarkdown
        markdown={`## Executive Summary

Paragraph with citation [T:001] and more text.
`}
        references={mockReferences}
        onCitationClick={jest.fn()}
      />,
    );

    // Tab to the citation button
    await user.tab();

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });
    expect(citationButton).toHaveFocus();
  });

  it('has visible focus indicators on citation buttons', async () => {
    const user = userEvent.setup();

    render(
      <AnalysisMarkdown
        markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
        references={mockReferences}
        onCitationClick={jest.fn()}
      />,
    );

    const citationButton = screen.getByRole('button', { name: /View source T:001/i });

    // Check that focus-visible styles are applied (focus ring classes)
    expect(citationButton.className).toContain('focus-visible:ring');
  });

  it('renders unknown citations as plain text (no button)', () => {
    render(
      <AnalysisMarkdown
        markdown={`## Executive Summary

Unknown citation [U:999] should be plain text.
`}
        references={mockReferences}
        onCitationClick={jest.fn()}
      />,
    );

    // Should NOT be a button
    const unknownButton = screen.queryByRole('button', { name: /U:999/i });
    expect(unknownButton).not.toBeInTheDocument();

    // But the text content should be present
    expect(screen.getByText(/\[U:999\]/)).toBeInTheDocument();
  });

  it('handles citations in strong and emphasized text', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <AnalysisMarkdown
        markdown={`## Executive Summary

**Bold text with citation [T:001]** and *italic with [A:042]*.
`}
        references={mockReferences}
        onCitationClick={handleClick}
      />,
    );

    // Both citations should be clickable
    const citation1 = screen.getByRole('button', { name: /View source T:001/i });
    const citation2 = screen.getByRole('button', { name: /View source A:042/i });

    expect(citation1).toBeInTheDocument();
    expect(citation2).toBeInTheDocument();

    // Click should work from within strong/em
    await user.click(citation1);
    expect(handleClick).toHaveBeenCalledWith('ref-1');
  });
});

// ============================================================================
// Citation Pattern Tests
// ============================================================================

describe('Citation Pattern Recognition', () => {
  it('recognizes valid citation patterns including multi-letter prefixes', () => {
    const extensiveCitations: ResearchCitation[] = [
      { id: 'T:001', type: 'Test', title: 'Test 1', date: '2025-01-01', fact: 'Fact 1' },
      { id: 'T:999', type: 'Test', title: 'Test 999', date: '2025-01-01', fact: 'Fact 999' },
      { id: 'A:042', type: 'Test', title: 'Test A42', date: '2025-01-01', fact: 'Fact A42' },
      { id: 'Z:001', type: 'Test', title: 'Test Z1', date: '2025-01-01', fact: 'Fact Z1' },
      { id: 'SE:001', type: 'Test', title: 'Test SE1', date: '2025-01-01', fact: 'Fact SE1' },
      { id: 'KIP:42', type: 'Test', title: 'Test KIP42', date: '2025-01-01', fact: 'Fact KIP42' },
      { id: 'TT:001', type: 'Test', title: 'Test TT1', date: '2025-01-01', fact: 'Fact TT1' },
    ];

    render(
      <MemoMarkdown
        markdown={`## Test

Citations: [T:001], [T:999], [A:042], [Z:001], [SE:001], [KIP:42], [TT:001].
`}
        citations={extensiveCitations}
        onCitationClick={jest.fn()}
      />,
    );

    // All should be rendered as buttons (use exact name matching to avoid substring overlap)
    expect(screen.getByRole('button', { name: 'View source T:001' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source T:999' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source A:042' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source Z:001' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source SE:001' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source KIP:42' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View source TT:001' })).toBeInTheDocument();
  });

  it('treats invalid patterns as plain text', () => {
    // Use empty citations so that no citation will match
    render(
      <MemoMarkdown
        markdown={`## Test

Invalid patterns: [001], [T:], [:001], [T:1a]

Valid pattern but unknown citation: [Z:999], [TT:001], [SE:999], [KIP:999]

Embedded in text: check[T:001]noBrackets.
`}
        citations={[]} // Empty citations - no citation IDs will be recognized
        onCitationClick={jest.fn()}
      />,
    );

    // None of these should be buttons since no citations are provided
    const buttons = screen.queryAllByRole('button');
    const citationButtons = buttons.filter((btn) =>
      btn.textContent?.includes('['),
    );
    expect(citationButtons.length).toBe(0);

    // But the text should be visible as plain text
    expect(screen.getByText(/\[001\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[Z:999\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[TT:001\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[SE:999\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[KIP:999\]/)).toBeInTheDocument();
  });
});
