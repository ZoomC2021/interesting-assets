/**
 * @jest-environment jsdom
 */

/**
 * monitor-range-filters.test.tsx - Tests for MonitorPage range filter functionality
 * 
 * Tests market cap and yield dual-range slider filters
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonitorPage } from '../components/reit-research/pages/MonitorPage';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/monitor',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock DesignStateProvider
jest.mock('../components/reit-research/DesignStateProvider', () => ({
  useDesignState: () => ({ isCompact: false }),
}));

// Mock hooks
const mockEntityData = {
  data: [
    {
      entity: {
        id: 'entity-1',
        code: '5130.KL',
        name: 'Small REIT',
        exchange: 'KLSE',
        sector: 'Industrial',
        isShariahCompliant: false,
        manager: { name: 'Manager A' },
      },
      metrics: [
        { metricType: 'market_cap', value: 500, unit: 'MYR', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
        { metricType: 'dividend_yield_market', value: 0.08, unit: 'ratio', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
      ],
      references: [],
      timeSeries: [],
      riskAssessment: { overallRiskRating: 'moderate' },
      generatedAt: '2024-01-01T00:00:00Z',
    },
    {
      entity: {
        id: 'entity-2',
        code: '5106.KL',
        name: 'Medium REIT',
        exchange: 'KLSE',
        sector: 'Industrial',
        isShariahCompliant: true,
        manager: { name: 'Manager B' },
      },
      metrics: [
        { metricType: 'market_cap', value: 2500, unit: 'MYR', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
        { metricType: 'dividend_yield_market', value: 0.06, unit: 'ratio', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
      ],
      references: [],
      timeSeries: [],
      riskAssessment: { overallRiskRating: 'low' },
      generatedAt: '2024-01-01T00:00:00Z',
    },
    {
      entity: {
        id: 'entity-3',
        code: '5176.KL',
        name: 'Large REIT',
        exchange: 'KLSE',
        sector: 'Diversified',
        isShariahCompliant: false,
        manager: { name: 'Manager C' },
      },
      metrics: [
        { metricType: 'market_cap', value: 8000, unit: 'MYR', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
        { metricType: 'dividend_yield_market', value: 0.04, unit: 'ratio', period: { type: 'point_in_time' }, sourceDisplayIds: [] },
      ],
      references: [],
      timeSeries: [],
      riskAssessment: { overallRiskRating: 'moderate' },
      generatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  isLoading: false,
  error: null,
};

jest.mock('../hooks/useEntityData', () => ({
  useEntityData: () => mockEntityData,
}));

// Mock lib/available-entities
jest.mock('../lib/available-entities', () => ({
  AVAILABLE_ENTITIES: [
    { code: '5130.KL' },
    { code: '5106.KL' },
    { code: '5176.KL' },
  ],
}));

describe('MonitorPage Range Filters', () => {
  function renderMonitorPage() {
    return render(<MonitorPage />);
  }

  // ==========================================================================
  // Market Cap Range Filter
  // ==========================================================================
  describe('Market Cap Range Filter', () => {
    it('should render market cap range filter section', async () => {
      renderMonitorPage();
      
      // Find the Market Cap filter section by its button/heading
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      expect(marketCapButton).toBeInTheDocument();
    });

    it('should expand market cap section when clicked', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand the Market Cap section
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      // Should show the range sliders
      expect(screen.getByLabelText('Market Cap minimum')).toBeInTheDocument();
      expect(screen.getByLabelText('Market Cap maximum')).toBeInTheDocument();
    });

    it('should display min and max value labels', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand the Market Cap section
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      // Should show value labels
      expect(screen.getByText('Min:', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Max:', { exact: false })).toBeInTheDocument();
    });

    it('should filter results by market cap range', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.getByText('Medium REIT')).toBeInTheDocument();
        expect(screen.getByText('Large REIT')).toBeInTheDocument();
      });
      
      // Expand the Market Cap section
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      // Get the max slider and change it to filter out Large REIT (8000)
      const maxSlider = screen.getByLabelText('Market Cap maximum');
      fireEvent.change(maxSlider, { target: { value: '5000' } });
      
      // Large REIT should be filtered out
      await waitFor(() => {
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument();
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.getByText('Medium REIT')).toBeInTheDocument();
      });
    });

    it('should enforce min <= max constraint', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand the Market Cap section
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      const minSlider = screen.getByLabelText('Market Cap minimum');
      const maxSlider = screen.getByLabelText('Market Cap maximum');
      
      // Try to set min above max - it should be constrained
      fireEvent.change(minSlider, { target: { value: '7000' } });
      
      // The min should not exceed max value
      expect(Number(minSlider.getAttribute('value'))).toBeLessThanOrEqual(Number(maxSlider.getAttribute('value')));
    });
  });

  // ==========================================================================
  // Yield Range Filter
  // ==========================================================================
  describe('Yield Range Filter', () => {
    it('should render yield range filter section', async () => {
      renderMonitorPage();
      
      // Find the Yield filter section
      const yieldButton = screen.getByText('Yield (%)');
      expect(yieldButton).toBeInTheDocument();
    });

    it('should expand yield section when clicked', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand the Yield section
      const yieldButton = screen.getByText('Yield (%)');
      await user.click(yieldButton);
      
      // Should show the range sliders
      expect(screen.getByLabelText('Yield minimum')).toBeInTheDocument();
      expect(screen.getByLabelText('Yield maximum')).toBeInTheDocument();
    });

    it('should filter results by yield range', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.getByText('Medium REIT')).toBeInTheDocument();
        expect(screen.getByText('Large REIT')).toBeInTheDocument();
      });
      
      // Expand the Yield section
      const yieldButton = screen.getByText('Yield (%)');
      await user.click(yieldButton);
      
      // Get the min slider and set it to filter out low yield REITs (Large REIT at 4%)
      const minSlider = screen.getByLabelText('Yield minimum');
      fireEvent.change(minSlider, { target: { value: '5' } });
      
      // Large REIT (4% yield) should be filtered out
      await waitFor(() => {
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument();
        expect(screen.getByText('Small REIT')).toBeInTheDocument(); // 8% yield
        expect(screen.getByText('Medium REIT')).toBeInTheDocument(); // 6% yield
      });
    });

    it('should display yield values with % unit', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand the Yield section
      const yieldButton = screen.getByText('Yield (%)');
      await user.click(yieldButton);
      
      // Should show percentage symbols
      const minLabel = screen.getByText(/Min:/);
      const parent = minLabel.parentElement;
      expect(parent?.textContent).toContain('%');
    });
  });

  // ==========================================================================
  // Combined Filters
  // ==========================================================================
  describe('Combined Filter Behavior', () => {
    it('should work with existing search filter', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
      });
      
      // Type in search box
      const searchInput = screen.getByPlaceholderText('Filter by name or ticker...');
      await user.type(searchInput, 'Small');
      
      // Only Small REIT should be visible
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.queryByText('Medium REIT')).not.toBeInTheDocument();
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument();
      });
    });

    it('should work with sector filter', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
      });
      
      // Find and check the Industrial sector checkbox
      const industrialCheckbox = screen.getByLabelText('Industrial');
      await user.click(industrialCheckbox);
      
      // Only Industrial REITs should be visible
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.getByText('Medium REIT')).toBeInTheDocument();
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument(); // Diversified
      });
    });

    it('should work with shariah filter', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
      });
      
      // Check Shariah Compliant Only
      const shariahCheckbox = screen.getByLabelText('Shariah Compliant Only');
      await user.click(shariahCheckbox);
      
      // Only shariah compliant REIT should be visible
      await waitFor(() => {
        expect(screen.queryByText('Small REIT')).not.toBeInTheDocument();
        expect(screen.getByText('Medium REIT')).toBeInTheDocument(); // Only shariah compliant one
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument();
      });
    });

    it('should compose multiple filters together', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
      });
      
      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Filter by name or ticker...');
      await user.type(searchInput, 'REIT');
      
      // Apply sector filter (Industrial)
      const industrialCheckbox = screen.getByLabelText('Industrial');
      await user.click(industrialCheckbox);
      
      // Expand and apply yield filter
      const yieldButton = screen.getByText('Yield (%)');
      await user.click(yieldButton);
      const yieldMinSlider = screen.getByLabelText('Yield minimum');
      fireEvent.change(yieldMinSlider, { target: { value: '7' } });
      
      // Only Small REIT should remain (Industrial, >7% yield, matches 'REIT')
      await waitFor(() => {
        expect(screen.getByText('Small REIT')).toBeInTheDocument();
        expect(screen.queryByText('Medium REIT')).not.toBeInTheDocument(); // Industrial but 6% yield
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument(); // Diversified, filtered by sector
      });
    });
  });

  // ==========================================================================
  // Filter Count Display
  // ==========================================================================
  describe('Filter Results Count', () => {
    it('should update count when range filters are applied', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByText(/3 covered/)).toBeInTheDocument();
      });
      
      // Expand and apply market cap filter
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      const maxSlider = screen.getByLabelText('Market Cap maximum');
      fireEvent.change(maxSlider, { target: { value: '1000' } });
      
      // Count should update to 1 (only Small REIT at 500)
      await waitFor(() => {
        expect(screen.getByText(/1 covered/)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Reset Functionality
  // ==========================================================================
  describe('Reset Functionality', () => {
    it('should show reset button when filters are active', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Initially no reset button
      expect(screen.queryByText('Reset all')).not.toBeInTheDocument();
      
      // Apply a search filter
      const searchInput = screen.getByPlaceholderText('Filter by name or ticker...');
      await user.type(searchInput, 'REIT');
      
      // Reset button should appear
      expect(screen.getByText('Reset all')).toBeInTheDocument();
    });

    it('should clear search query on reset', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Apply a search filter
      const searchInput = screen.getByPlaceholderText('Filter by name or ticker...');
      await user.type(searchInput, 'Small');
      
      // Click reset
      const resetButton = screen.getByText('Reset all');
      await user.click(resetButton);
      
      // Search should be cleared
      expect(searchInput).toHaveValue('');
    });

    it('should clear sector filters on reset', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Apply sector filter
      const industrialCheckbox = screen.getByLabelText('Industrial');
      await user.click(industrialCheckbox);
      
      // Click reset
      const resetButton = screen.getByText('Reset all');
      await user.click(resetButton);
      
      // Checkbox should be unchecked
      expect(industrialCheckbox).not.toBeChecked();
    });

    it('should clear range filters on reset', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Large REIT')).toBeInTheDocument();
      });
      
      // Apply market cap filter
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      const maxSlider = screen.getByLabelText('Market Cap maximum');
      fireEvent.change(maxSlider, { target: { value: '5000' } });
      
      // Verify filter applied
      await waitFor(() => {
        expect(screen.queryByText('Large REIT')).not.toBeInTheDocument();
      });
      
      // Click reset
      const resetButton = screen.getByText('Reset all');
      await user.click(resetButton);
      
      // Large REIT should be visible again (filter cleared)
      await waitFor(() => {
        expect(screen.getByText('Large REIT')).toBeInTheDocument();
      });
    });

    it('should hide reset button after all filters cleared', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Filter by name or ticker...');
      await user.type(searchInput, 'REIT');
      
      // Reset button should be visible
      expect(screen.getByText('Reset all')).toBeInTheDocument();
      
      // Click reset
      const resetButton = screen.getByText('Reset all');
      await user.click(resetButton);
      
      // Reset button should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Reset all')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have proper ARIA labels on range sliders', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand market cap section
      const marketCapButton = screen.getByText('Market Cap (RM M)');
      await user.click(marketCapButton);
      
      // Check ARIA labels
      const minSlider = screen.getByLabelText('Market Cap minimum');
      const maxSlider = screen.getByLabelText('Market Cap maximum');
      
      expect(minSlider).toHaveAttribute('type', 'range');
      expect(maxSlider).toHaveAttribute('type', 'range');
    });

    it('should have accessible slider controls', async () => {
      const user = userEvent.setup();
      renderMonitorPage();
      
      // Expand yield section
      const yieldButton = screen.getByText('Yield (%)');
      await user.click(yieldButton);
      
      const minSlider = screen.getByLabelText('Yield minimum');
      
      // Should be focusable
      minSlider.focus();
      expect(document.activeElement).toBe(minSlider);
    });
  });
});
