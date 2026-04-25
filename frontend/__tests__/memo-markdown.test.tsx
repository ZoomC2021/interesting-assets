import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoMarkdown } from '../components/reit-research/MemoMarkdown';

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
});
