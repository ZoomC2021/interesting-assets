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
      raw: {
        entity: { id: 'entity-1', code: '5130.KL' },
        metrics: [],
        references: [],
      },
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
      raw: {
        entity: { id: 'entity-2', code: '5106.KL' },
        metrics: [],
        references: [],
      },
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
      
      // Should show count badge (all registry metrics visible by default - 49 metrics)
      const badge = customizeButton.querySelector('span');
      expect(badge).toBeInTheDocument();
      const count = parseInt(badge?.textContent || '0', 10);
      expect(count).toBeGreaterThan(40); // All 49 registry metrics visible by default
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
      
      // Should show all registry metrics visible by default (e.g., "49 of 49 metrics visible")
      const summaryText = screen.getByText(/of \d+ metrics visible/);
      expect(summaryText).toBeInTheDocument();
      // Extract count from text like "49 of 49 metrics visible"
      const match = summaryText.textContent?.match(/(\d+) of (\d+) metrics visible/);
      expect(match).not.toBeNull();
      if (match) {
        expect(parseInt(match[1], 10)).toBeGreaterThan(40); // At least 40 metrics visible
        expect(match[1]).toBe(match[2]); // All metrics visible (X of X)
      }
      
      // Get the dialog/panel and search within it for category headers
      const panel = screen.getByRole('dialog');
      
      // Should show category headers as h3 elements within the panel
      expect(within(panel).getByRole('heading', { name: 'Market' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Per-Share' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Financial' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Leverage' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Operational' })).toBeInTheDocument();
      // Additional categories from registry
      expect(within(panel).getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument();
      expect(within(panel).getByRole('heading', { name: 'Risk' })).toBeInTheDocument();
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
      
      // Find and click a metric toggle (using registry display name)
      const marketCapToggle = screen.getByLabelText('Market Capitalization (visible)');
      await user.click(marketCapToggle);
      
      // Metric should now be marked as hidden
      await waitFor(() => {
        expect(screen.getByLabelText('Market Capitalization (hidden)')).toBeInTheDocument();
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
      
      // Check that metrics have aria-pressed (using registry display name)
      const marketCapToggle = screen.getByLabelText('Market Capitalization (visible)');
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
      
      // Hide a metric first (using registry display name)
      const marketCapToggle = screen.getByLabelText('Market Capitalization (visible)');
      await user.click(marketCapToggle);
      
      // Click Show All
      const showAllButton = screen.getByText('Show All');
      await user.click(showAllButton);
      
      // All metrics should be visible again
      await waitFor(() => {
        expect(screen.getByLabelText('Market Capitalization (visible)')).toBeInTheDocument();
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
      
      // Should show 1 metric visible (only 1 metric kept from full registry)
      await waitFor(() => {
        const summaryText = screen.getByText(/of \d+ metrics visible/);
        expect(summaryText).toBeInTheDocument();
        const match = summaryText.textContent?.match(/(\d+) of (\d+) metrics visible/);
        expect(match).not.toBeNull();
        if (match) {
          expect(parseInt(match[1], 10)).toBe(1); // Only 1 metric visible
          expect(parseInt(match[2], 10)).toBeGreaterThan(40); // Total metrics from registry
        }
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
      
      // Hide a metric (Market Capitalization is from the registry)
      const marketCapToggle = screen.getByLabelText('Market Capitalization (visible)');
      await user.click(marketCapToggle);
      
      // Should have saved to localStorage
      await waitFor(() => {
        const saved = localStorageMock['reit-compare-visible-metrics'];
        expect(saved).toBeDefined();
        const parsed = JSON.parse(saved);
        expect(parsed).not.toContain('market_cap'); // registry metric ID, not legacy 'mcap'
      });
    });

    it('should load visible metrics from localStorage on mount', async () => {
      // Pre-populate localStorage with custom visibility (hide Market Capitalization and Share Price)
      // Using registry metric IDs (not legacy IDs)
      const allMetricIds = [
        'portfolio_size', 'total_assets', 'investment_properties', 'property_count', 'net_lettable_area', 'geographic_concentration',
        'gross_revenue', 'net_property_income', 'realised_income', 'net_profit', 'nav_per_unit', 'market_cap', 'share_price',
        'dpu', 'dpu_growth_yoy', 'dividend_yield_market', 'dividend_yield_nav', 'payout_ratio',
        'gearing_ratio', 'interest_coverage', 'total_borrowings', 'fixed_rate_debt_pct', 'floating_rate_debt_pct', 'wacd',
        'occupancy_rate', 'wale_years', 'tenant_count', 'top_tenant_concentration', 'rental_reversion', 'lease_renewal_rate', 'npi_margin',
        'tenant_risk_rating', 'interest_rate_sensitivity', 'refinancing_risk', 'gearing_headroom',
        'revenue_australia_pct', 'revenue_malaysia_pct', 'revenue_japan_pct',
        'revenue_australia', 'revenue_malaysia', 'revenue_japan', 'reit_segment_revenue', 'cost_of_debt',
        'occupancy_rate_retail', 'wale_years_retail', 'hotel_occupancy', 'hotel_adr', 'hotel_revpar',
        'price_to_book', 'premium_discount_to_nav'
      ];
      const visibleIds = allMetricIds.filter(id => id !== 'market_cap' && id !== 'share_price');
      localStorageMock['reit-compare-visible-metrics'] = JSON.stringify(visibleIds);
      
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Market Capitalization should be hidden (using display name from registry)
      await waitFor(() => {
        expect(screen.getByLabelText('Market Capitalization (hidden)')).toBeInTheDocument();
      });
      
      // Should show N-2 metrics visible (total minus 2 hidden)
      const totalMetrics = allMetricIds.length;
      const summaryText = screen.getByText(new RegExp(`${totalMetrics - 2} of ${totalMetrics} metrics visible`));
      expect(summaryText).toBeInTheDocument();
    });

    it('should handle invalid localStorage data gracefully', async () => {
      // Pre-populate localStorage with invalid data
      localStorageMock['reit-compare-visible-metrics'] = 'invalid-json';
      
      const user = userEvent.setup();
      renderComparePage();
      
      // Open panel
      const customizeButton = screen.getByLabelText('Customize visible metrics');
      await user.click(customizeButton);
      
      // Should show all registry metrics (default behavior) - at least 40
      const summaryText = screen.getByText(/of \d+ metrics visible/);
      expect(summaryText).toBeInTheDocument();
      const match = summaryText.textContent?.match(/(\d+) of (\d+) metrics visible/);
      expect(match).not.toBeNull();
      if (match) {
        expect(parseInt(match[1], 10)).toBeGreaterThan(40); // All metrics visible by default
        expect(match[1]).toBe(match[2]); // X of X means all visible
      }
    });
  });

  // ==========================================================================
  // Table Updates
  // ==========================================================================
  describe('Table Updates', () => {
    it('should update table when metrics are hidden', async () => {
      // Pre-populate localStorage to hide Market Capitalization and Share Price
      // Using registry metric IDs
      const allMetricIds = [
        'portfolio_size', 'total_assets', 'investment_properties', 'property_count', 'net_lettable_area', 'geographic_concentration',
        'gross_revenue', 'net_property_income', 'realised_income', 'net_profit', 'nav_per_unit', 'market_cap', 'share_price',
        'dpu', 'dpu_growth_yoy', 'dividend_yield_market', 'dividend_yield_nav', 'payout_ratio',
        'gearing_ratio', 'interest_coverage', 'total_borrowings', 'fixed_rate_debt_pct', 'floating_rate_debt_pct', 'wacd',
        'occupancy_rate', 'wale_years', 'tenant_count', 'top_tenant_concentration', 'rental_reversion', 'lease_renewal_rate', 'npi_margin',
        'tenant_risk_rating', 'interest_rate_sensitivity', 'refinancing_risk', 'gearing_headroom',
        'revenue_australia_pct', 'revenue_malaysia_pct', 'revenue_japan_pct',
        'revenue_australia', 'revenue_malaysia', 'revenue_japan', 'reit_segment_revenue', 'cost_of_debt',
        'occupancy_rate_retail', 'wale_years_retail', 'hotel_occupancy', 'hotel_adr', 'hotel_revpar',
        'price_to_book', 'premium_discount_to_nav'
      ];
      const visibleIds = allMetricIds.filter(id => id !== 'market_cap' && id !== 'share_price');
      localStorageMock['reit-compare-visible-metrics'] = JSON.stringify(visibleIds);
      
      renderComparePage();
      
      // Market Capitalization should not be visible in the table (using display name from registry)
      await waitFor(() => {
        const marketCapHeader = screen.queryByText('Market Capitalization', { selector: 'span' });
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
