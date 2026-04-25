jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => null,
}));

import { render, screen } from '@testing-library/react';
import React from 'react';
import { AnalysisMarkdown } from '../components/AnalysisMarkdown';

describe('AnalysisMarkdown', () => {
  it('renders thesis-style markdown with tables and lists', () => {
    render(
      <AnalysisMarkdown
        markdown={`# Demo Thesis

## Executive Summary

This is a **strong** setup.

- Point one
- Point two

| Metric | Value |
|--------|-------|
| Yield | 5.2% |
`}
      />,
    );

    expect(screen.getByText(/Executive Summary/)).toBeInTheDocument();
    expect(screen.getByText(/Point one/)).toBeInTheDocument();
    expect(screen.getByText(/Yield/)).toBeInTheDocument();
    expect(screen.getByText(/5.2%/)).toBeInTheDocument();
    expect(screen.queryByText(/Demo Thesis/)).not.toBeInTheDocument();
  });
});
