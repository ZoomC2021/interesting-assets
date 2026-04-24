/**
 * @jest-environment jsdom
 */

/**
 * citation-a11y.test.tsx - Accessibility tests for citation components
 * 
 * Tests keyboard navigation, focus management, and screen reader support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CitationPanel } from '../components/CitationPanel';
import { MetricCard } from '../components/MetricCard';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAnnouncer } from '../hooks/useAnnouncer';
import type { NormalizedReitData, Reference, Metric } from '../types/frontend';

// ============================================================================
// Mock Data
// ============================================================================

const mockReferences: Reference[] = [
  {
    id: 'ref-1',
    displayId: 'T:001',
    fact: 'Total assets value',
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
    fact: 'Market capitalization',
    source: 'Bursa Malaysia',
    citation: 'Bursa Malaysia Announcement dated 2025-04-15',
    url: 'https://bursamalaysia.com/announcement',
    dateAccessed: '2025-04-20',
    timeSensitive: true,
    entityId: 'entity-1',
  },
];

const mockEntity: NormalizedReitData = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
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
  },
  references: mockReferences,
  metrics: [],
  timeSeries: [],
  riskAssessment: {
    id: 'risk-1',
    entityId: 'entity-1',
    assessmentDate: new Date().toISOString().slice(0, 10),
    overallRiskRating: 'moderate',
    riskFactors: [],
  },
  observations: [],
};

const mockMetric: Metric = {
  id: 'metric-1',
  metricType: 'market_cap',
  value: 500000000,
  unit: 'MYR',
  period: { type: 'point_in_time', date: '2025-04-20' },
  isEstimated: false,
  isTimeSensitive: true,
  sourceDisplayIds: ['T:001', 'A:001'],
};

// ============================================================================
// useFocusTrap Tests
// ============================================================================

describe('useFocusTrap', () => {
  function TestComponent({ isActive, onEscape }: { isActive: boolean; onEscape?: () => void }) {
    const ref = useFocusTrap<HTMLDivElement>({ isActive, onEscape });
    
    return (
      <div ref={ref} data-testid="trap-container">
        <button data-testid="button-1">First Button</button>
        <button data-testid="button-2">Second Button</button>
        <a href="#test" data-testid="link">Link</a>
      </div>
    );
  }

  it('should not trap focus when inactive', () => {
    render(<TestComponent isActive={false} />);
    const container = screen.getByTestId('trap-container');
    expect(container).toBeInTheDocument();
  });

  it('should trap focus when active', async () => {
    const user = userEvent.setup();
    const onEscape = jest.fn();
    
    render(<TestComponent isActive={true} onEscape={onEscape} />);
    
    const button1 = screen.getByTestId('button-1');
    const button2 = screen.getByTestId('button-2');
    const link = screen.getByTestId('link');
    
    // Wait for initial focus
    await waitFor(() => {
      expect(document.activeElement).toBe(button1);
    }, { timeout: 2000 });
    
    // Tab should move through elements
    await user.tab();
    expect(document.activeElement).toBe(button2);
    
    await user.tab();
    expect(document.activeElement).toBe(link);
    
    // Tab should cycle back to first button (focus trap)
    await user.tab();
    expect(document.activeElement).toBe(button1);
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = jest.fn();
    render(<TestComponent isActive={true} onEscape={onEscape} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalled();
  });
});

// ============================================================================
// useAnnouncer Tests
// ============================================================================

describe('useAnnouncer', () => {
  function TestComponent() {
    const { announce, liveRegionProps, announcements } = useAnnouncer();
    
    return (
      <div>
        <button onClick={() => announce('Test message', 'polite')}>Announce</button>
        <div {...liveRegionProps.polite} data-testid="polite-region">
          {announcements.filter(a => a.priority === 'polite').map(a => a.message).join(', ')}
        </div>
        <div {...liveRegionProps.assertive} data-testid="assertive-region">
          {announcements.filter(a => a.priority === 'assertive').map(a => a.message).join(', ')}
        </div>
      </div>
    );
  }

  it('should have aria-live polite attributes', () => {
    render(<TestComponent />);
    const politeRegion = screen.getByTestId('polite-region');
    
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should have aria-live assertive attributes', () => {
    render(<TestComponent />);
    const assertiveRegion = screen.getByTestId('assertive-region');
    
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');
  });
});

// ============================================================================
// CitationPanel Accessibility Tests
// ============================================================================

describe('CitationPanel Accessibility', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should have proper ARIA attributes when open', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAttribute('aria-labelledby', 'citation-panel-title');
    expect(panel).toHaveAttribute('aria-describedby', 'citation-panel-description');
  });

  it('should have accessible title and description', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    const title = screen.getByText('Sources & Citations');
    expect(title).toHaveAttribute('id', 'citation-panel-title');
    
    const description = screen.getByText(/2 references from 1 source/);
    expect(description).toHaveAttribute('id', 'citation-panel-description');
  });

  it('should have accessible close button', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    const closeButton = screen.getByLabelText('Close citation panel');
    expect(closeButton).toHaveAttribute('title', 'Close (Escape)');
  });

  it('should close on Escape key press', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render citations list with proper role', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    const list = screen.getByRole('list', { name: 'Citations list' });
    expect(list).toBeInTheDocument();
    
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('should have accessible filter buttons with aria-pressed', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    const allFilterButton = screen.getByLabelText('Show all sources');
    expect(allFilterButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have accessible copy buttons with proper labels', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001']}
        entities={[mockEntity]}
      />
    );
    
    const copyButton = screen.getByLabelText(/Copy citation/);
    expect(copyButton).toBeInTheDocument();
  });

  it('should mark time-sensitive data with visual indicator', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['A:001']} // Time-sensitive reference
        entities={[mockEntity]}
      />
    );
    
    const timeSensitiveBadge = screen.getByText('Time-sensitive');
    expect(timeSensitiveBadge).toBeInTheDocument();
    expect(timeSensitiveBadge).toHaveAttribute('title', expect.stringContaining('time-sensitive'));
  });

  it('should have accessible external links', () => {
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001']}
        entities={[mockEntity]}
      />
    );
    
    const viewSourceLink = screen.getByLabelText(/View source for/);
    expect(viewSourceLink).toHaveAttribute('target', '_blank');
    expect(viewSourceLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

// ============================================================================
// MetricCard Accessibility Tests
// ============================================================================

describe('MetricCard Accessibility', () => {
  const mockOnClick = jest.fn();

  it('should have proper role and aria-label when clickable', () => {
    render(
      <MetricCard
        metric={mockMetric}
        entityName="Atrium"
        entityColor="#2563eb"
        onClick={mockOnClick}
      />
    );
    
    const card = screen.getByRole('button');
    // aria-label uses the display name, not the metricType
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Market Cap'));
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('2 citations'));
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should handle keyboard activation', () => {
    render(
      <MetricCard
        metric={mockMetric}
        entityName="Atrium"
        entityColor="#2563eb"
        onClick={mockOnClick}
      />
    );
    
    const card = screen.getByRole('button');
    
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledWith(['T:001', 'A:001']);
    
    mockOnClick.mockClear();
    
    fireEvent.keyDown(card, { key: ' ' });
    expect(mockOnClick).toHaveBeenCalledWith(['T:001', 'A:001']);
  });

  it('should display citation count badge', () => {
    render(
      <MetricCard
        metric={mockMetric}
        entityName="Atrium"
        entityColor="#2563eb"
        onClick={mockOnClick}
      />
    );
    
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', '2 citations');
  });

  it('should display time-sensitive warning icon', () => {
    render(
      <MetricCard
        metric={mockMetric}
        entityName="Atrium"
        entityColor="#2563eb"
      />
    );
    
    const warningIcon = screen.getByLabelText('Warning: Time-sensitive data');
    expect(warningIcon).toBeInTheDocument();
  });

  it('should display estimated indicator', () => {
    const estimatedMetric = { ...mockMetric, isEstimated: true };
    render(
      <MetricCard
        metric={estimatedMetric}
        entityName="Atrium"
        entityColor="#2563eb"
      />
    );
    
    const estimatedLabel = screen.getByText('est.');
    expect(estimatedLabel).toBeInTheDocument();
    expect(estimatedLabel).toHaveAttribute('title', 'Estimated value');
  });
});

// ============================================================================
// Keyboard Navigation Tests
// ============================================================================

describe('Keyboard Navigation', () => {
  it('CitationPanel should support Tab navigation through all focusable elements', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    render(
      <CitationPanel
        isOpen={true}
        onClose={mockOnClose}
        citationIds={['T:001', 'A:001']}
        entities={[mockEntity]}
      />
    );
    
    // Wait for initial focus
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close citation panel');
      expect(document.activeElement).toBe(closeButton);
    }, { timeout: 2000 });
    
    // Tab through filter buttons
    await user.tab();
    const filterButton = screen.getByLabelText('Show all sources');
    expect(document.activeElement).toBe(filterButton);
  });

  it('MetricCard should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(
      <MetricCard
        metric={mockMetric}
        entityName="Atrium"
        entityColor="#2563eb"
        onClick={mockOnClick}
      />
    );
    
    const card = screen.getByRole('button');
    
    // Focus the card
    await act(async () => {
      await user.click(card);
    });
    expect(document.activeElement).toBe(card);
    
    // Activate with Enter
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    expect(mockOnClick).toHaveBeenCalled();
  });
});
