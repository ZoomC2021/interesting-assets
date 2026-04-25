/**
 * @jest-environment jsdom
 */

/**
 * reit-research/citation-panel.test.tsx - Component tests for reit-research CitationPanel
 *
 * Tests for Milestone 3: Non-demo citation panel functionality
 * - Empty state rendering
 * - Copy citation with feedback
 * - View source with conditional rendering/disabled handling
 * - Active citation highlight behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CitationPanel } from '../components/reit-research/CitationPanel';
import type { ResearchCitation } from '../data/reits';

// ============================================================================
// Mock Data
// ============================================================================

const mockCitations: ResearchCitation[] = [
  {
    id: 'T:127',
    type: 'Annual Report',
    title: 'Atrium REIT Annual Report 2023',
    date: '28 Feb 2024',
    url: 'https://example.com/ar2023',
    fact: 'Total assets RM500M',
  },
  {
    id: 'T:89',
    type: 'Company Filing',
    title: 'Q4 2023 Financial Results Presentation',
    date: '25 Jan 2024',
    url: 'https://example.com/q4-2023',
    fact: 'Revenue RM120M',
  },
  {
    id: 'T:142',
    type: 'Press Release',
    title: 'Extension of Medium Term Note Programme',
    date: '15 Mar 2024',
    // No URL for this citation
    fact: 'MTN extended to 2026',
  },
];

// ============================================================================
// Mock window.open
// ============================================================================

const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

// ============================================================================
// Test Suite
// ============================================================================

describe('reit-research/CitationPanel', () => {
  const mockOnClose = jest.fn();
  const mockWriteText = navigator.clipboard.writeText as jest.Mock;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOpen.mockClear();
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  describe('Panel Visibility', () => {
    it('should not render panel when isOpen is false', () => {
      render(
        <CitationPanel
          isOpen={false}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      // Panel should have translate-x-full class when closed
      const aside = document.querySelector('aside');
      expect(aside).toHaveClass('translate-x-full');
    });

    it('should render panel when isOpen is true', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      expect(screen.getByText('Citations & Sources')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when citations is undefined', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('No citations available')).toBeInTheDocument();
      expect(screen.getByText('This document does not have any reference citations.')).toBeInTheDocument();
    });

    it('should show empty state when citations array is empty', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={[]}
        />
      );

      expect(screen.getByText('No citations available')).toBeInTheDocument();
      expect(screen.getByText('This document does not have any reference citations.')).toBeInTheDocument();
    });

    it('should show 0 references count in empty state', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={[]}
        />
      );

      expect(screen.getByText('0 references in this document')).toBeInTheDocument();
    });

    it('should NOT show demo/fallback citations when empty', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={[]}
        />
      );

      // These were the old fallback/demo citations that should NOT appear
      expect(screen.queryByText('Atrium REIT Annual Report 2023')).not.toBeInTheDocument();
      expect(screen.queryByText('Q4 2023 Financial Results Presentation')).not.toBeInTheDocument();
      expect(screen.queryByText('T:127')).not.toBeInTheDocument();
    });
  });

  describe('Citation Display', () => {
    it('should render correct number of citations', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      expect(screen.getByText('3 references in this document')).toBeInTheDocument();
    });

    it('should display citation details correctly', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      expect(screen.getByText('T:127')).toBeInTheDocument();
      expect(screen.getByText('Atrium REIT Annual Report 2023')).toBeInTheDocument();
      expect(screen.getByText('28 Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('Annual Report')).toBeInTheDocument();
    });

    it('should render all citations in the list', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      mockCitations.forEach(citation => {
        expect(screen.getByText(citation.id)).toBeInTheDocument();
        expect(screen.getByText(citation.title)).toBeInTheDocument();
      });
    });
  });

  describe('Active Citation Highlight', () => {
    it('should highlight active citation with accent border', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
          activeCitationId="T:127"
        />
      );

      const activeCitation = screen.getByText('T:127').closest('[data-citation-id]');
      expect(activeCitation).toHaveClass('border-accent', 'bg-accent/5');
    });

    it('should not highlight inactive citations', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
          activeCitationId="T:127"
        />
      );

      const inactiveCitation = screen.getByText('T:89').closest('[data-citation-id]');
      expect(inactiveCitation).not.toHaveClass('border-accent');
      expect(inactiveCitation).toHaveClass('border-stroke');
    });

    it('should handle null activeCitationId', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
          activeCitationId={null}
        />
      );

      // All citations should have default border styling
      const citations = document.querySelectorAll('[data-citation-id]');
      citations.forEach(citation => {
        expect(citation).toHaveClass('border-stroke');
      });
    });
  });

  describe('Copy Citation', () => {
    it('should copy citation to clipboard when copy button is clicked', async () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const copyButtons = screen.getAllByLabelText(/Copy citation/);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          'T:127 - Atrium REIT Annual Report 2023 (Annual Report, 28 Feb 2024)'
        );
      });
    });

    it('should show visual feedback when citation is copied', async () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const copyButtons = screen.getAllByLabelText(/Copy citation/);
      fireEvent.click(copyButtons[0]);

      // Should show "Copied!" title after click
      await waitFor(() => {
        expect(copyButtons[0]).toHaveAttribute('title', 'Copied!');
      });
    });

    it('should update aria-label after copying', async () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const copyButton = screen.getByLabelText('Copy citation T:127');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Citation T:127 copied')).toBeInTheDocument();
      });
    });

    it('should reset copied state after 2 seconds', async () => {
      jest.useFakeTimers();

      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const copyButtons = screen.getAllByLabelText(/Copy citation/);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(copyButtons[0]).toHaveAttribute('title', 'Copied!');
      });

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByLabelText('Copy citation T:127')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle clipboard API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard access denied'));

      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const copyButtons = screen.getAllByLabelText(/Copy citation/);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy citation:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('View Source', () => {
    it('should open source URL in new tab when View Source is clicked', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const viewSourceButtons = screen.getAllByLabelText(/View source for citation/);
      fireEvent.click(viewSourceButtons[0]);

      expect(mockOpen).toHaveBeenCalledWith('https://example.com/ar2023', '_blank', 'noopener,noreferrer');
    });

    it('should disable View Source button when citation has no URL', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      // T:142 has no URL, should have disabled button
      const disabledButton = screen.getByLabelText('No source URL for citation T:142');
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should show disabled styling for citations without URL', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const disabledButton = screen.getByLabelText('No source URL for citation T:142');
      expect(disabledButton).toHaveClass('cursor-not-allowed', 'text-ink-muted/30');
    });

    it('should show enabled styling for citations with URL', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const enabledButton = screen.getByLabelText('View source for citation T:127');
      expect(enabledButton).not.toHaveClass('cursor-not-allowed');
      expect(enabledButton).toHaveClass('hover:text-ink');
    });

    it('should have appropriate tooltips for enabled and disabled states', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const enabledButton = screen.getByLabelText('View source for citation T:127');
      expect(enabledButton).toHaveAttribute('title', 'View source');

      const disabledButton = screen.getByLabelText('No source URL for citation T:142');
      expect(disabledButton).toHaveAttribute('title', 'No source URL available');
    });

    it('should not call window.open for disabled View Source button', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const disabledButton = screen.getByLabelText('No source URL for citation T:142');
      fireEvent.click(disabledButton);

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('Panel Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      const closeButton = screen.getByLabelText('Close citation panel');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(
        <CitationPanel
          isOpen={true}
          onClose={mockOnClose}
          citations={mockCitations}
        />
      );

      // The backdrop is a button element
      const backdrop = document.querySelector('button.fixed.inset-0');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
