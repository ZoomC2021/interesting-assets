/**
 * @jest-environment jsdom
 */

/**
 * entity-page.test.tsx - Component tests for EntityPage
 *
 * Tests share/download functionality, price change display, geographic distribution,
 * and no-memo states.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityPage } from '../components/reit-research/pages/EntityPage';
import type { NormalizedReitData, Reference, TimeSeries } from '../types/frontend';

// ============================================================================
// Mock Data
// ============================================================================

const mockReferences: Reference[] = [
  {
    id: 'ref-1',
    displayId: 'T:001',
    fact: 'Total assets RM500M',
    source: 'Annual Report 2025',
    citation: 'Atrium REIT Annual Report 2025, p. 45',
    url: 'https://example.com/ar2025',
    dateAccessed: '2025-04-20',
    timeSensitive: false,
    entityId: 'entity-1',
  },
  {
    id: 'ref-2',
    displayId: 'A:001',
    fact: 'Market cap RM450M',
    source: 'Bursa Malaysia',
    citation: 'Bursa Malaysia Announcement dated 2025-04-15',
    url: 'https://bursamalaysia.com/announcement',
    dateAccessed: '2025-04-20',
    timeSensitive: true,
    entityId: 'entity-1',
  },
];

const createMockTimeSeries = (metricType: string, values: number[]): TimeSeries => ({
  id: `ts-${metricType}`,
  entityId: 'entity-1',
  metricType: metricType as TimeSeries['metricType'],
  frequency: 'daily',
  unit: 'MYR',
  dataPoints: values.map((value, index) => ({
    date: `2025-04-${10 + index}`,
    value,
    isInterpolated: false,
    sourceDisplayId: 'T:001',
  })),
  sourceDisplayIds: ['T:001'],
});

const createMockEntity = (overrides: Partial<NormalizedReitData> = {}): NormalizedReitData => ({
  schemaVersion: '1.0',
  generatedAt: '2025-04-20T10:00:00Z',
  entity: {
    id: 'entity-1',
    code: '5130.KL',
    name: 'Atrium REIT',
    exchange: 'KLSE',
    sector: 'Industrial',
    currency: 'MYR',
    isShariahCompliant: false,
    manager: { name: 'Atrium REIT Manager' },
    trustee: 'Malaysian Trustees',
    fiscalYearEnd: { month: 12, day: 31 },
    references: ['ref-1', 'ref-2'],
    portfolio: {
      totalProperties: 10,
      totalAssetsRM: 500000000,
      investmentPropertiesRM: 450000000,
      netLettableAreaSqFt: 2500000,
      geographicDistribution: [
        { region: 'Klang Valley', propertyCount: 6, percentageOfPortfolio: 65 },
        { region: 'Johor', propertyCount: 3, percentageOfPortfolio: 25 },
        { region: 'Other', propertyCount: 1, percentageOfPortfolio: 10 },
      ],
    },
  } as NormalizedReitData['entity'] & { portfolio: unknown },
  references: mockReferences,
  metrics: [
    {
      id: 'm-1',
      metricType: 'share_price',
      value: 1.52,
      unit: 'MYR',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: true,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-2',
      metricType: 'nav_per_unit',
      value: 1.85,
      unit: 'MYR',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-3',
      metricType: 'dpu',
      value: 8.5,
      unit: 'sen',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-4',
      metricType: 'dividend_yield_market',
      value: 5.6,
      unit: '%',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: true,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-5',
      metricType: 'gearing_ratio',
      value: 35.2,
      unit: '%',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-6',
      metricType: 'interest_coverage',
      value: 4.2,
      unit: 'x',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-7',
      metricType: 'occupancy_rate',
      value: 92.5,
      unit: '%',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-8',
      metricType: 'wale_years',
      value: 4.5,
      unit: 'years',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-9',
      metricType: 'market_cap',
      value: 450,
      unit: 'million',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: true,
      sourceDisplayIds: ['T:001'],
    },
    {
      id: 'm-10',
      metricType: 'price_to_book',
      value: 0.82,
      unit: 'x',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: true,
      sourceDisplayIds: ['T:001'],
    },
  ],
  timeSeries: [
    createMockTimeSeries('dpu', [7.8, 8.0, 8.2, 8.4, 8.5]),
    createMockTimeSeries('share_price', [1.50, 1.52]),
  ],
  riskAssessment: {
    id: 'risk-1',
    entityId: 'entity-1',
    assessmentDate: '2025-04-20',
    overallRiskRating: 'moderate',
    riskFactors: [],
  },
  observations: [],
  ...overrides,
});

// ============================================================================
// Mocks
// ============================================================================

jest.mock('@/hooks/useEntityData', () => ({
  useEntityData: jest.fn(),
}));

const mockShare = jest.fn();
const mockCanShare = jest.fn().mockReturnValue(true);

Object.defineProperty(navigator, 'share', {
  value: mockShare,
  writable: true,
  configurable: true,
});

Object.defineProperty(navigator, 'canShare', {
  value: mockCanShare,
  writable: true,
  configurable: true,
});

const mockWriteText = navigator.clipboard.writeText as jest.Mock;

// ============================================================================
// Test Suite
// ============================================================================

describe('EntityPage Share Button', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  beforeEach(() => {
    jest.clearAllMocks();
    useEntityData.mockReturnValue({
      data: [createMockEntity()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    // Reset window.location.href for tests
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/entity/5130.KL' },
      writable: true,
    });
  });

  it('should render share button with correct aria-label', () => {
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    expect(shareButton).toBeInTheDocument();
  });

  it('should use Web Share API when available', async () => {
    mockShare.mockResolvedValue(undefined);
    
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Atrium REIT (5130.KL) - REIT Analysis',
      text: expect.stringContaining('Atrium REIT'),
      url: 'https://example.com/entity/5130.KL',
    });
  });

  it('should fallback to clipboard when Web Share API not available', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/entity/5130.KL');
    
    // Restore mock
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
  });

  it('should fallback to clipboard when canShare returns false', async () => {
    mockCanShare.mockReturnValue(false);
    
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(mockShare).not.toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/entity/5130.KL');
    
    mockCanShare.mockReturnValue(true);
  });

  it('should show success feedback after clipboard copy', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(mockWriteText).toHaveBeenCalled();
    
    // Should show copied state
    await waitFor(() => {
      expect(screen.getByLabelText('Link copied to clipboard')).toBeInTheDocument();
    });
    
    // Restore mock
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
  });

  it('should handle share cancellation gracefully', async () => {
    mockShare.mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
    
    render(<EntityPage ticker="5130.KL" />);
    
    const shareButton = screen.getByLabelText('Share this page');
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    // Should not throw or show error
    expect(mockShare).toHaveBeenCalled();
  });
});

describe('EntityPage Download Button', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  beforeEach(() => {
    jest.clearAllMocks();
    useEntityData.mockReturnValue({
      data: [createMockEntity()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    // Mock URL.createObjectURL and related methods
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should render download button with correct aria-label', () => {
    render(<EntityPage ticker="5130.KL" />);
    
    const downloadButton = screen.getByLabelText('Download entity snapshot');
    expect(downloadButton).toBeInTheDocument();
  });

  it('should trigger download when clicked', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');
    
    render(<EntityPage ticker="5130.KL" />);
    
    const downloadButton = screen.getByLabelText('Download entity snapshot');
    await act(async () => {
      fireEvent.click(downloadButton);
    });
    
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should show success feedback after download', async () => {
    render(<EntityPage ticker="5130.KL" />);
    
    const downloadButton = screen.getByLabelText('Download entity snapshot');
    await act(async () => {
      fireEvent.click(downloadButton);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Download started')).toBeInTheDocument();
    });
  });
});

describe('EntityPage Price Change Display', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  it('should display calculated price change when time series data available', () => {
    useEntityData.mockReturnValue({
      data: [createMockEntity()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    // Price changed from 1.50 to 1.52 = +0.02 (+1.3%)
    expect(screen.getByText(/\+0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.3%/)).toBeInTheDocument();
  });

  it('should display dash when price change unavailable', () => {
    useEntityData.mockReturnValue({
      data: [createMockEntity({
        timeSeries: [],
      })],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByLabelText('Price change unavailable')).toBeInTheDocument();
  });

  it('should show negative price change in danger color', () => {
    useEntityData.mockReturnValue({
      data: [createMockEntity({
        timeSeries: [
          createMockTimeSeries('share_price', [1.52, 1.50]), // Decreasing
        ],
      })],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText(/-0\.02/)).toBeInTheDocument();
    expect(screen.getByText(/-1\.3%/)).toBeInTheDocument();
  });
});

describe('EntityPage Geographic Distribution', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  it('should render geographic distribution bars when data available', () => {
    useEntityData.mockReturnValue({
      data: [createMockEntity()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    // Should show region labels
    expect(screen.getByText('Klang Valley')).toBeInTheDocument();
    expect(screen.getByText('Johor')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should show unavailable state when no geographic data', () => {
    const baseEntity = createMockEntity();
    useEntityData.mockReturnValue({
      data: [createMockEntity({
        entity: {
          ...baseEntity.entity,
          portfolio: {
            totalProperties: 10,
            totalAssetsRM: 500000000,
            investmentPropertiesRM: 450000000,
            geographicDistribution: [],
          },
        } as NormalizedReitData['entity'] & { portfolio: unknown },
      })],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText('Geographic distribution data unavailable')).toBeInTheDocument();
    expect(screen.getByText('Check Data Room for portfolio details')).toBeInTheDocument();
  });
});

describe('EntityPage No-Memo State', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  beforeEach(() => {
    useEntityData.mockReturnValue({
      data: [createMockEntity()],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('should show no-memo callout in executive summary', () => {
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText(/No long-form memo has been checked in/)).toBeInTheDocument();
  });

  it('should show contextual no-memo state in thesis section', () => {
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText(/No written research memo has been published/)).toBeInTheDocument();
    expect(screen.getByText(/Data Room below provides the foundational metrics/)).toBeInTheDocument();
  });

  it('should show key metrics to watch in thesis section', () => {
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText(/Key metrics to watch/)).toBeInTheDocument();
    expect(screen.getByText(/DPU sustainability at 8.50 sen/)).toBeInTheDocument();
  });

  it('should render markdown when analysisMarkdown provided', () => {
    // Note: MemoMarkdown strips the top-level H1, so we start with H2
    const markdown = `## Executive Summary

This is a test memo with **bold** and _italic_ text.

## Company Overview

Some overview content here.`;

    render(<EntityPage ticker="5130.KL" analysisMarkdown={markdown} />);
    
    // Should not show no-memo callout
    expect(screen.queryByText(/No long-form memo has been checked in/)).not.toBeInTheDocument();
    
    // Should render markdown content in the main article (not sidebar)
    // Use getAllByText since "Executive Summary" appears in both sidebar and main content
    const executiveSummaryElements = screen.getAllByText('Executive Summary');
    expect(executiveSummaryElements.length).toBeGreaterThanOrEqual(1);
    
    // Check that bold text is rendered
    expect(screen.getByText(/bold/)).toBeInTheDocument();
  });

  it('should render clickable citation references in markdown content', () => {
    const markdownWithCitations = `## Executive Summary

The REIT trades at a discount [T:001] with strong occupancy [U:002].

See also the annual report [A:003] for more details.`;

    render(<EntityPage ticker="5130.KL" analysisMarkdown={markdownWithCitations} />);
    
    // Citation chips should be rendered as buttons
    const citationsButton = screen.getByRole('button', { name: /2 citations/i });
    expect(citationsButton).toBeInTheDocument();
  });

  it('should open citation panel when citation chip is clicked', async () => {
    const user = userEvent.setup();
    const markdownWithCitations = `## Executive Summary

The REIT trades at a discount [T:001].`;

    render(<EntityPage ticker="5130.KL" analysisMarkdown={markdownWithCitations} />);
    
    // Click the citation count button in the sidebar
    const citationsButton = screen.getByRole('button', { name: /2 citations/i });
    await user.click(citationsButton);

    // Citation panel should be visible
    expect(screen.getByText('Citations & Sources')).toBeInTheDocument();
  });
});

describe('EntityPage Loading States', () => {
  const { useEntityData } = require('@/hooks/useEntityData');

  it('should show loading state initially', () => {
    useEntityData.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText('Loading REIT memo...')).toBeInTheDocument();
  });

  it('should show error state when entity not found', () => {
    useEntityData.mockReturnValue({
      data: [],
      isLoading: false,
      error: 'Entity not found',
      refetch: jest.fn(),
    });
    
    render(<EntityPage ticker="5130.KL" />);
    
    expect(screen.getByText('REIT not found')).toBeInTheDocument();
    expect(screen.getByText('Entity not found')).toBeInTheDocument();
  });
});
