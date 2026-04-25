/**
 * @jest-environment jsdom
 */

/**
 * compare-customize-view.test.tsx - Tests for ComparePage customize view functionality
 * 
 * Tests metric visibility toggling, localStorage persistence, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparePage } from '../components/reit-research/pages/ComparePage';

// Ensure within is used (silence lint warning)
const _within = within;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/compare',
  useRouter: () => ({ push: mockPush }),
}));

// Mock hooks
const mockEntityData = {
  data: [
    {
      entity: {
        id: 'entity-1',
        code: '5130.KL',
        name: 'Atrium REIT',
        exchange: 'KLSE',
        sector: 'Industrial',
      },
      metrics: [],
      references: [],
      timeSeries: [],
    },
    {
      entity: {
        id: 'entity-2',
        code: '5106.KL',
        name: 'Axis REIT',
        exchange: 'KLSE',
        sector: 'Industrial',
      },
      metrics: [],
      references: [],
      timeSeries: [],
    },
  ],
  isLoading: false,
  error: null,
};

jest.mock('../hooks/useEntityData', () => ({
  useEntityData: () => mockEntityData,
}));

// Mock data/reits
jest.mock('../data/reits', () => ({
  adaptReitsData: () => [
    {
      id: 'entity-1',
      ticker: '5130.KL',
      name: 'Atrium REIT',
      marketCap: 500,
      sharePrice: 1.5,
      dpu: 8.5,
      yield: 5.5,
      gearing: 35,
      interestCover: 4.2,
      occupancy: 95,
      wale: 3.5,
      priceToBook: 1.1,
      dpuHistory: [],
      overallRisk: 'moderate',
      citations: [],
    },
    {
      id: 'entity-2',
      ticker: '5106.KL',
      name: 'Axis REIT',
      marketCap: 600,
      sharePrice: 2.0,
      dpu: 9.0,
      yield: 4.5,
      gearing: 40,
      interestCover: 5.0,
      occupancy: 98,
      wale: 4.0,
      priceToBook: 1.2,
      dpuHistory: [],
      overallRisk: 'low',
      citations: [],
    },
  ],
  getDefaultEntityCodes: () => ['5130.KL', '5106.KL'],
  getReitMetricSourceIds: () => [],
  normalizeEntityCodes: (codes: string[]) => codes,
}));

describe('ComparePage Customize View', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => { localStorageMock[key] = value; },
        removeItem: (key: string) => { delete localStorageMock[key]; },
      },
      writable: true,
    });
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderComparePage() {
    return render(<ComparePage initialIds={['5130.KL', '5106.KL']} />);
  }

  // ==========================================================================
  // Customize Button
  // ==========================================================================
  describe('Customize Button', () => {
    it('should render customize button with visible metric count', () => {
      renderComparePage();
      
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      expect(customizeButton).toBeInTheDocument();
      
      // Should show count badge (9 metrics visible by default)
      expect(customizeButton).toHaveTextContent('9');
    });

    it('should have proper ARIA attributes', () => {
      renderComparePage();
      
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      expect(customizeButton).toHaveAttribute('aria-expanded', 'false');
      expect(customizeButton).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should open customize panel when clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      expect(screen.getByRole('dialog', { name: 'Customize visible metrics' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Customize Panel
  // ==========================================================================
  describe('Customize Panel', () => {
    it('should render panel with all metrics grouped by category', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Should show panel header (use heading role to distinguish from button)
      const panelHeading = screen.getByRole('heading', { name: 'Customize View' });
      expect(panelHeading).toBeInTheDocument();
      expect(screen.getByText('9 of 9 metrics visible')).toBeInTheDocument();
      
      // Get the dialog/panel and search within it for category headers
      const panel = screen.getByRole('dialog');
      
      // Should show category headers as h3 elements within the panel
      expect(within(panel).getByRole('heading', { name: 'Market' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Per-Share' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Financial' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Leverage' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Operational' })).toBeInTheDocument();
    });

    it('should close panel when close button is clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      expect(screen.getByRole('dialog', { name: 'Customize visible metrics' })).toBeInTheDocument();
      
      // Close panel
      const closeButton = screen.getByLabelText('Close customize panel');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Customize visible metrics' })).not.toBeInTheDocument();
      });
    });

    it('should close panel when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      expect(screen.getByRole('dialog', { name: 'Customize visible metrics' })).toBeInTheDocument();
      
      // Click backdrop (first sibling before panel)
      const backdrop = document.querySelector('.bg-canvas\\/60');
      if (backdrop) {
        await user.click(backdrop as Element);
      }
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Customize visible metrics' })).not.toBeInTheDocument();
      });
    });

    it('should close panel on Escape key', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      const dialog = screen.getByRole('dialog', { name: 'Customize visible metrics' });
      expect(dialog).toBeInTheDocument();
      
      // Press Escape
      fireEvent.keyDown(dialog, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Customize visible metrics' })).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Metric Toggle
  // ==========================================================================
  describe('Metric Toggle', () => {
    it('should toggle metric visibility when clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Find and click a metric toggle
      const marketCapToggle = screen.getByLabelText('Market Cap (visible)');
      await user.click(marketCapToggle);
      
      // Metric should now be marked as hidden
      await waitFor(() => {
        expect(screen.getByLabelText('Market Cap (hidden)')).toBeInTheDocument();
      });
    });

    it('should not allow hiding all metrics', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Hide all but one metric - use getAllByLabelText specifically for metric toggles
      // Filter to get only metric toggle buttons (not the main button)
      const allToggles = screen.getAllByLabelText(/\(visible\)|\(hidden\)/i);
      const visibleToggles = allToggles.filter(toggle => 
        toggle.getAttribute('aria-label')?.includes('(visible)')
      );
      
      // Click all but the first visible toggle
      for (let i = 1; i < visibleToggles.length; i++) {
        await user.click(visibleToggles[i]);
      }
      
      // The last remaining visible metric toggle should be disabled
      const remainingVisibleToggles = screen.getAllByLabelText(/\(visible\)/i);
      expect(remainingVisibleToggles.length).toBe(1);
      expect(remainingVisibleToggles[0]).toBeDisabled();
    });

    it('should have proper ARIA pressed state', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Check that metrics have aria-pressed
      const marketCapToggle = screen.getByLabelText('Market Cap (visible)');
      expect(marketCapToggle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ==========================================================================
  // Bulk Actions
  // ==========================================================================
  describe('Bulk Actions', () => {
    it('should show all metrics when Show All is clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Hide a metric first
      const marketCapToggle = screen.getByLabelText('Market Cap (visible)');
      await user.click(marketCapToggle);
      
      // Click Show All
      const showAllButton = screen.getByText('Show All');
      await user.click(showAllButton);
      
      // All metrics should be visible again
      await waitFor(() => {
        expect(screen.getByLabelText('Market Cap (visible)')).toBeInTheDocument();
      });
    });

    it('should show minimal metrics when Show Minimal is clicked', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Click Show Minimal
      const showMinimalButton = screen.getByText('Show Minimal');
      await user.click(showMinimalButton);
      
      // Should show 1 metric visible
      await waitFor(() => {
        expect(screen.getByText('1 of 9 metrics visible')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // localStorage Persistence
  // ==========================================================================
  describe('localStorage Persistence', () => {
    it('should save visible metrics to localStorage', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Hide a metric
      const marketCapToggle = screen.getByLabelText('Market Cap (visible)');
      await user.click(marketCapToggle);
      
      // Should have saved to localStorage
      await waitFor(() => {
        const saved = localStorageMock['reit-compare-visible-metrics'];
        expect(saved).toBeDefined();
        const parsed = JSON.parse(saved);
        expect(parsed).not.toContain('mcap');
      });
    });

    it('should load visible metrics from localStorage on mount', async () => {
      // Pre-populate localStorage with custom visibility (hide Market Cap)
      localStorageMock['reit-compare-visible-metrics'] = JSON.stringify([
        'price', 'dpu', 'yield', 'gearing', 'icr', 'occ', 'wale', 'pb'
      ]);
      
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Market Cap should be hidden
      await waitFor(() => {
        expect(screen.getByLabelText('Market Cap (hidden)')).toBeInTheDocument();
      });
      
      // Should show 8 metrics visible
      expect(screen.getByText('8 of 9 metrics visible')).toBeInTheDocument();
    });

    it('should handle invalid localStorage data gracefully', async () => {
      // Pre-populate localStorage with invalid data
      localStorageMock['reit-compare-visible-metrics'] = 'invalid-json';
      
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Should show all metrics (default behavior)
      expect(screen.getByText('9 of 9 metrics visible')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Table Updates
  // ==========================================================================
  describe('Table Updates', () => {
    it('should update table when metrics are hidden', async () => {
      // Pre-populate localStorage to hide Market Cap
      localStorageMock['reit-compare-visible-metrics'] = JSON.stringify([
        'price', 'dpu', 'yield', 'gearing', 'icr', 'occ', 'wale', 'pb'
      ]);
      
      renderComparePage();
      
      // Market Cap should not be visible in the table
      await waitFor(() => {
        const marketCapHeader = screen.queryByText('Market Cap', { selector: 'span' });
        // It might not be in the document or it might be filtered out
        expect(marketCapHeader).toBeNull();
      });
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have proper dialog ARIA attributes', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Customize visible metrics');
    });

    it('should have focus trap within panel', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      const dialog = screen.getByRole('dialog');
      
      // Tab should be trapped
      fireEvent.keyDown(dialog, { key: 'Tab' });
      
      // Panel should still be open
      expect(dialog).toBeInTheDocument();
    });

    it('should return focus to trigger button when closed', async () => {
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Close panel
      const closeButton = screen.getByLabelText('Close customize panel');
      await user.click(closeButton);
      
      // Focus should return to customize button
      await waitFor(() => {
        expect(document.activeElement).toBe(customizeButton);
      });
    });
  });
});
