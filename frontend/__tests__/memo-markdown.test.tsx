import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoMarkdown } from '../components/reit-research/MemoMarkdown';
import type { ResearchCitation } from '../data/reits';

const mockCitations: ResearchCitation[] = [
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
    url: 'https://bursa.com/announcement',
    fact: 'Share price RM 1.52',
  },
];

describe('MemoMarkdown', () => {
  it('renders body content and strips the leading H1', () => {
    render(
      <MemoMarkdown
        markdown={`# Memo Title That Should Be Stripped

## Executive Summary

This is a **strong** setup with *italic* emphasis.
`}
      />,
    );

    expect(screen.queryByText('Memo Title That Should Be Stripped')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Executive Summary' })).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(screen.getByText('strong')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('assigns slug IDs to H2 headings so outline scroll-to works', () => {
    render(
      <MemoMarkdown
        markdown={`## 1. Company Overview

Some text.

## Outlook & Thesis

More text.
`}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '1. Company Overview' }),
    ).toHaveAttribute('id', 'company-overview');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Outlook & Thesis' }),
    ).toHaveAttribute('id', 'outlook-thesis');
  });

  it('renders GFM tables with the expected structure', () => {
    render(
      <MemoMarkdown
        markdown={`## Metrics

| Metric | Value |
|--------|-------|
| Yield  | 5.2%  |
| DPU    | 8.1 sen |
`}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Yield')).toBeInTheDocument();
    expect(screen.getByText('5.2%')).toBeInTheDocument();
    expect(screen.getByText('DPU')).toBeInTheDocument();
    expect(screen.getByText('8.1 sen')).toBeInTheDocument();
  });

  it('renders unordered lists with each item visible', () => {
    render(
      <MemoMarkdown
        markdown={`## Risks

- Refinancing risk
- Tenant concentration
- FX exposure
`}
      />,
    );

    expect(screen.getByText('Refinancing risk')).toBeInTheDocument();
    expect(screen.getByText('Tenant concentration')).toBeInTheDocument();
    expect(screen.getByText('FX exposure')).toBeInTheDocument();
  });

  it('marks external links as target=_blank and keeps internal anchors bare', () => {
    render(
      <MemoMarkdown
        markdown={`## Links

[External](https://example.com) and [internal](#thesis).
`}
      />,
    );

    const external = screen.getByRole('link', { name: 'External' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    const internal = screen.getByRole('link', { name: 'internal' });
    expect(internal).not.toHaveAttribute('target');
  });

  describe('Citation Linking', () => {
    it('renders valid citation references as clickable buttons', () => {
      render(
        <MemoMarkdown
          markdown={`## Executive Summary

The REIT trades at a discount [T:001] with strong occupancy [A:042].
`}
          citations={mockCitations}
          onCitationClick={jest.fn()}
        />,
      );

      // Should render citation buttons
      const citation1 = screen.getByRole('button', { name: /View source T:001/i });
      const citation2 = screen.getByRole('button', { name: /View source A:042/i });

      expect(citation1).toBeInTheDocument();
      expect(citation2).toBeInTheDocument();

      // Check button styling
      expect(citation1).toHaveTextContent('[T:001]');
      expect(citation2).toHaveTextContent('[A:042]');
    });

    it('renders unknown citation references as plain text', () => {
      render(
        <MemoMarkdown
          markdown={`## Executive Summary

Unknown citation [U:999] should remain as plain text.
`}
          citations={mockCitations}
          onCitationClick={jest.fn()}
        />,
      );

      // Unknown citation should NOT be rendered as a button
      const unknownButton = screen.queryByRole('button', { name: /U:999/i });
      expect(unknownButton).not.toBeInTheDocument();

      // But the text should be visible
      expect(screen.getByText(/\[U:999\]/)).toBeInTheDocument();
    });

    it('calls onCitationClick when citation is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <MemoMarkdown
          markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
          citations={mockCitations}
          onCitationClick={handleClick}
        />,
      );

      const citationButton = screen.getByRole('button', { name: /View source T:001/i });
      await user.click(citationButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith('T:001');
    });

    it('renders citations in various markdown contexts (lists, blockquotes, tables)', () => {
      const handleClick = jest.fn();

      render(
        <MemoMarkdown
          markdown={`## Test

- List item with citation [T:001]

> Blockquote with citation [A:042]

| Metric | Value |
|--------|-------|
| Yield  | 5.2% [T:001] |
`}
          citations={mockCitations}
          onCitationClick={handleClick}
        />,
      );

      // Get all citation buttons
      const citationButtons = screen.getAllByRole('button', { name: /View source/i });

      // Should have T:001 (appears twice: in list and table) and A:042 (in blockquote)
      expect(citationButtons.length).toBe(3);

      // Count specific citations
      const t001Buttons = screen.getAllByRole('button', { name: /View source T:001/i });
      const a042Buttons = screen.getAllByRole('button', { name: /View source A:042/i });

      expect(t001Buttons.length).toBe(2);
      expect(a042Buttons.length).toBe(1);
    });

    it('handles keyboard focus on citation buttons', async () => {
      const user = userEvent.setup();

      render(
        <MemoMarkdown
          markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
          citations={mockCitations}
          onCitationClick={jest.fn()}
        />,
      );

      const citationButton = screen.getByRole('button', { name: /View source T:001/i });

      // Should be focusable
      await user.tab();
      expect(citationButton).toHaveFocus();
    });

    it('does not render citations as clickable when onCitationClick is not provided', () => {
      render(
        <MemoMarkdown
          markdown={`## Executive Summary

The REIT trades at a discount [T:001].
`}
          citations={mockCitations}
        />,
      );

      // Even though citation exists in the list, without onCitationClick it should be plain text
      const citationButton = screen.queryByRole('button', { name: /T:001/i });
      expect(citationButton).not.toBeInTheDocument();

      // Should show as plain text
      expect(screen.getByText(/\[T:001\]/)).toBeInTheDocument();
    });
  });
});
