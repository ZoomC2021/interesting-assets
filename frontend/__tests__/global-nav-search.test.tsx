/**
 * @jest-environment jsdom
 */

/**
 * global-nav-search.test.tsx - Tests for GlobalNav search functionality
 * 
 * Tests keyboard shortcuts, search filtering, entity selection, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalNav } from '../components/reit-research/GlobalNav';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush }),
}));

// Mock available entities
jest.mock('../lib/available-entities', () => ({
  AVAILABLE_ENTITIES: [
    { code: '5130.KL', name: 'Atrium REIT', sector: 'Industrial', aliases: ['atrium'] },
    { code: '5106.KL', name: 'Axis REIT', sector: 'Industrial', aliases: ['axis'] },
    { code: '5176.KL', name: 'Sunway REIT', sector: 'Diversified', aliases: ['sunway'] },
    { code: '5212.KL', name: 'Pavilion REIT', sector: 'Retail', aliases: ['pavilion'] },
    { code: '5180.KL', name: 'CMMT', sector: 'Retail', aliases: ['cmmt'] },
  ],
}));

const mockSetIsCompact = jest.fn();
const mockSetIsDark = jest.fn();

describe('GlobalNav Search', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetIsCompact.mockClear();
    mockSetIsDark.mockClear();
  });

  function renderGlobalNav() {
    return render(
      <GlobalNav
        isCompact={false}
        setIsCompact={mockSetIsCompact}
        isDark={false}
        setIsDark={mockSetIsDark}
      />
    );
  }

  // ==========================================================================
  // Search Trigger
  // ==========================================================================
  describe('Search Trigger', () => {
    it('should render search trigger button with keyboard shortcut hint', () => {
      renderGlobalNav();
      
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      expect(searchTrigger).toBeInTheDocument();
    });

    it('should open search modal when trigger is clicked', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      expect(screen.getByRole('dialog', { name: 'Search entities' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search REITs by name or ticker...')).toBeInTheDocument();
    });

    it('should show initial entity suggestions without query', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Should show first 6 entities by default
      expect(screen.getByText('Atrium REIT')).toBeInTheDocument();
      expect(screen.getByText('Axis REIT')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================
  describe('Keyboard Shortcuts', () => {
    it('should open search on Cmd+K (macOS)', () => {
      renderGlobalNav();
      
      fireEvent.keyDown(document, { metaKey: true, key: 'k' });
      
      expect(screen.getByRole('dialog', { name: 'Search entities' })).toBeInTheDocument();
    });

    it('should open search on Ctrl+K (Windows/Linux)', () => {
      renderGlobalNav();
      
      fireEvent.keyDown(document, { ctrlKey: true, key: 'k' });
      
      expect(screen.getByRole('dialog', { name: 'Search entities' })).toBeInTheDocument();
    });

    it('should close search on Escape key', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      expect(screen.getByRole('dialog', { name: 'Search entities' })).toBeInTheDocument();
      
      // Press Escape
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Search entities' })).not.toBeInTheDocument();
      });
    });

    it('should close search when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      expect(screen.getByRole('dialog', { name: 'Search entities' })).toBeInTheDocument();
      
      // Click backdrop
      const backdrop = document.querySelector('.bg-canvas\\/80');
      if (backdrop) {
        await user.click(backdrop as Element);
      }
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Search entities' })).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Search Filtering
  // ==========================================================================
  describe('Search Filtering', () => {
    it('should filter entities by name', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Type search query
      const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
      await user.type(input, 'atrium');
      
      // Should show Atrium REIT
      expect(screen.getByText('Atrium REIT')).toBeInTheDocument();
      
      // Should not show others
      expect(screen.queryByText('Axis REIT')).not.toBeInTheDocument();
    });

    it('should filter entities by ticker code', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Type ticker search query
      const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
      await user.type(input, '5130');
      
      // Should show Atrium REIT (5130.KL)
      expect(screen.getByText('Atrium REIT')).toBeInTheDocument();
    });

    it('should filter entities by alias', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Type alias search query
      const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
      await user.type(input, 'axis');
      
      // Should show Axis REIT
      expect(screen.getByText('Axis REIT')).toBeInTheDocument();
    });

    it('should show empty state when no results', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Type non-matching query
      const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
      await user.type(input, 'nonexistent');
      
      // Should show empty state
      expect(screen.getByText('No entities found')).toBeInTheDocument();
      expect(screen.getByText('Try searching by name, ticker, or alias')).toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Type search query
      const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
      await user.type(input, 'atrium');
      
      // Click clear button
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      // Input should be cleared
      expect(input).toHaveValue('');
    });
  });

  // ==========================================================================
  // Keyboard Navigation
  // ==========================================================================
  describe('Keyboard Navigation', () => {
    it('should navigate results with arrow keys', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // First item should be selected by default
      const firstItem = screen.getAllByRole('option')[0];
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
      
      // Press arrow down
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowDown' });
      
      // Second item should be selected
      const secondItem = screen.getAllByRole('option')[1];
      expect(secondItem).toHaveAttribute('aria-selected', 'true');
    });

    it('should select entity and navigate on Enter', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Press Enter to select first entity
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
      
      // Should navigate to entity page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/entity/5130.KL');
      });
    });

    it('should have focus trap within modal', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Tab should be trapped
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Tab' });
      
      // Modal should still be open
      expect(dialog).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Mouse Interaction
  // ==========================================================================
  describe('Mouse Interaction', () => {
    it('should navigate to entity page on click', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Click on an entity
      const entityButton = screen.getByRole('option', { name: /Atrium REIT/i });
      await user.click(entityButton);
      
      // Should navigate to entity page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/entity/5130.KL');
      });
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Search entities');
    });

    it('should have proper ARIA attributes on search results', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Search results');
      
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveAttribute('aria-selected');
    });

    it('should focus first element when modal opens', async () => {
      const user = userEvent.setup();
      renderGlobalNav();
      
      // Open search
      const searchTrigger = screen.getByLabelText('Open search (Cmd+K)');
      await user.click(searchTrigger);
      
      // Input should be focused
      await waitFor(() => {
        const input = screen.getByPlaceholderText('Search REITs by name or ticker...');
        expect(document.activeElement).toBe(input);
      });
    });
  });
});
