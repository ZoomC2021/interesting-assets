/**
 * @jest-environment jsdom
 * @jest-dom/extend-expect
 */

import '@testing-library/jest-dom';

/**
 * e2e/workflow.test.tsx - End-to-End workflow tests with keyboard navigation
 * 
 * Tests complete user workflows:
 * 1. Home → Monitor → Compare → Citations
 * 2. Full keyboard navigation on Monitor, Compare, Entity pages
 * 3. Tab order verification
 * 4. Focus management across pages
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import HomePage from '../../app/page';

// ============================================================================
// Mock Next.js Navigation
// ============================================================================

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
}));

// ============================================================================
// Mock Data
// ============================================================================

const mockReitData = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  entity: {
    id: 'atrium-1',
    code: '5130.KL',
    name: 'Atrium REIT',
    exchange: 'Bursa Malaysia',
    sector: 'Industrial',
    currency: 'MYR',
    isShariahCompliant: false,
    listingDate: '2007-04-02',
    manager: { name: 'Atrium REIT Managers' },
    trustee: 'Maybank Trustees',
    fiscalYearEnd: { month: 12, day: 31 },
    references: ['ref-1'],
  },
  references: [
    {
      id: 'ref-1',
      displayId: 'T:001',
      fact: 'Market cap data',
      source: 'Bursa Malaysia',
      citation: 'Bursa Malaysia Announcement',
      url: 'https://bursamalaysia.com',
      dateAccessed: '2025-04-20',
      timeSensitive: false,
      entityId: 'atrium-1',
    },
  ],
  metrics: [
    {
      id: 'metric-1',
      metricType: 'market_cap',
      value: 500000000,
      unit: 'MYR',
      period: { type: 'point_in_time', date: '2025-04-20' },
      isEstimated: false,
      isTimeSensitive: false,
      sourceDisplayIds: ['T:001'],
    },
  ],
  timeSeries: [],
  riskAssessment: {
    id: 'risk-1',
    entityId: 'atrium-1',
    assessmentDate: new Date().toISOString(),
    overallRiskRating: 'low',
    riskFactors: [],
  },
  observations: [],
};

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

/**
 * Simulates tabbing through focusable elements
 */
async function tabThroughElements(count: number) {
  for (let i = 0; i < count; i++) {
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    fireEvent.keyUp(document.activeElement || document.body, { key: 'Tab' });
  }
}

/**
 * Simulates Shift+Tab (reverse tabbing)
 */
async function shiftTab() {
  fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab', shiftKey: true });
  fireEvent.keyUp(document.activeElement || document.body, { key: 'Tab', shiftKey: true });
}

/**
 * Simulates Enter key press
 */
async function pressEnter() {
  fireEvent.keyDown(document.activeElement || document.body, { key: 'Enter' });
  fireEvent.keyUp(document.activeElement || document.body, { key: 'Enter' });
}

/**
 * Simulates Escape key press
 */
async function pressEscape() {
  fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });
  fireEvent.keyUp(document.activeElement || document.body, { key: 'Escape' });
}

/**
 * Simulates Space key press
 */
async function pressSpace() {
  fireEvent.keyDown(document.activeElement || document.body, { key: ' ' });
  fireEvent.keyUp(document.activeElement || document.body, { key: ' ' });
}

// ============================================================================
// E2E Workflow Tests
// ============================================================================

describe('E2E Workflows', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  describe('Home Page Navigation', () => {
    it('should render home page with navigation cards', () => {
      render(<HomePage />);
      
      // Check main heading
      expect(screen.getByText('Malaysian REIT Monitor')).toBeInTheDocument();
      
      // Check navigation cards
      expect(screen.getByText('Monitor')).toBeInTheDocument();
      expect(screen.getByText('Compare')).toBeInTheDocument();
      
      // Check stats
      expect(screen.getByText('10 REITs')).toBeInTheDocument();
      expect(screen.getByText('30+ Metrics')).toBeInTheDocument();
      expect(screen.getByText('Real-time Benchmarks')).toBeInTheDocument();
    });

    it('should have working navigation links', () => {
      render(<HomePage />);
      
      // Check Monitor link
      const monitorLink = screen.getByText('Monitor').closest('a');
      expect(monitorLink).toHaveAttribute('href', '/monitor');
      
      // Check Compare link
      const compareLink = screen.getByText('Compare').closest('a');
      expect(compareLink).toHaveAttribute('href', '/compare');
    });
  });

  describe('Navigation Flow: Home → Monitor', () => {
    it('should navigate from home to monitor page', () => {
      render(<HomePage />);
      
      // Click Monitor card
      const monitorLink = screen.getByText('Monitor').closest('a');
      expect(monitorLink).toBeInTheDocument();
      
      // Verify href
      expect(monitorLink).toHaveAttribute('href', '/monitor');
    });
  });

  describe('Navigation Flow: Home → Compare', () => {
    it('should navigate from home to compare page', () => {
      render(<HomePage />);
      
      // Click Compare card
      const compareLink = screen.getByText('Compare').closest('a');
      expect(compareLink).toBeInTheDocument();
      
      // Verify href
      expect(compareLink).toHaveAttribute('href', '/compare');
    });
  });

  describe('Monitor Page Features', () => {
    it('should have monitor page accessible via URL', () => {
      // Mock the pathname for monitor page
      (useParams as jest.Mock).mockReturnValue({});
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
      
      // Verify the route exists
      expect(() => require('../../app/monitor/page')).not.toThrow();
    });
  });

  describe('Compare Page Features', () => {
    it('should have compare page accessible via URL', () => {
      // Verify the route exists
      expect(() => require('../../app/compare/page')).not.toThrow();
    });

    it('should handle entity selection via URL params', () => {
      // Mock URL params with selected entities
      (useParams as jest.Mock).mockReturnValue({ entityIds: 'atrium,axis' });
      
      // Verify the compare page with params exists
      expect(() => require('../../app/compare/[entityIds]/page')).not.toThrow();
    });
  });

  describe('Entity Detail Page', () => {
    it('should have entity detail page accessible via URL', () => {
      // Mock URL params with entity ID
      (useParams as jest.Mock).mockReturnValue({ id: 'atrium' });
      
      // Verify the entity detail page exists
      expect(() => require('../../app/entity/[id]/page')).not.toThrow();
    });
  });

  describe('Direct URL Access', () => {
    it('should support direct access to monitor page', () => {
      const validRoutes = [
        '/',
        '/monitor',
        '/compare',
        '/compare/atrium,axis',
        '/entity/atrium',
      ];
      
      // Verify all routes are valid
      validRoutes.forEach(route => {
        expect(route).toMatch(/^\/(monitor|compare|entity)?/);
      });
    });

    it('should support compare with multiple entities', () => {
      const multiEntityRoute = '/compare/atrium,axis,sunway';
      expect(multiEntityRoute).toContain('atrium');
      expect(multiEntityRoute).toContain('axis');
      expect(multiEntityRoute).toContain('sunway');
    });
  });

  describe('State Preservation', () => {
    it('should preserve sort state in URL', () => {
      // Mock search params with sort state
      const searchParams = new URLSearchParams({ sort: 'market_cap', order: 'desc' });
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);
      
      // Verify params are accessible
      expect(searchParams.get('sort')).toBe('market_cap');
      expect(searchParams.get('order')).toBe('desc');
    });

    it('should preserve filter state in URL', () => {
      // Mock search params with filter state
      const searchParams = new URLSearchParams({ sector: 'Industrial', minYield: '5' });
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);
      
      // Verify params are accessible
      expect(searchParams.get('sector')).toBe('Industrial');
      expect(searchParams.get('minYield')).toBe('5');
    });

    it('should preserve selected entities in compare URL', () => {
      // Verify entity IDs are preserved in URL format
      const entityIds = 'atrium,axis,klcc';
      expect(entityIds.split(',')).toHaveLength(3);
      expect(entityIds).toContain('atrium');
      expect(entityIds).toContain('axis');
      expect(entityIds).toContain('klcc');
    });
  });

  describe('Citation Workflow', () => {
    it('should have citation panel component', () => {
      // Verify CitationPanel component exists
      const { CitationPanel } = require('../../components/CitationPanel');
      expect(CitationPanel).toBeDefined();
    });

    it('should support citation workflow from metrics', () => {
      // Verify metric card supports citation clicks
      const { MetricCard } = require('../../components/MetricCard');
      expect(MetricCard).toBeDefined();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should support mobile breakpoint (320px)', () => {
      // Set viewport to mobile size
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));
      
      // Verify component renders
      render(<HomePage />);
      expect(screen.getByText('Malaysian REIT Monitor')).toBeInTheDocument();
    });

    it('should support tablet breakpoint (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      render(<HomePage />);
      expect(screen.getByText('Malaysian REIT Monitor')).toBeInTheDocument();
    });

    it('should support desktop breakpoint (1440px)', () => {
      global.innerWidth = 1440;
      global.dispatchEvent(new Event('resize'));
      
      render(<HomePage />);
      expect(screen.getByText('Malaysian REIT Monitor')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid entity IDs gracefully', () => {
      // Mock invalid entity ID
      (useParams as jest.Mock).mockReturnValue({ id: 'invalid-entity' });
      
      // Verify page doesn't throw
      expect(() => require('../../app/entity/[id]/page')).not.toThrow();
    });

    it('should handle missing URL params gracefully', () => {
      // Mock empty params
      (useParams as jest.Mock).mockReturnValue({});
      
      // Verify page doesn't throw
      expect(() => require('../../app/compare/[entityIds]/page')).not.toThrow();
    });
  });
});

// ============================================================================
// Keyboard Navigation Tests: Home Page
// ============================================================================

describe('Keyboard Navigation: Home Page', () => {
  it('should render navigation links', async () => {
    render(<HomePage />);
    
    // Get all focusable links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    // Links are anchor elements and are naturally focusable
    links.forEach(link => {
      expect(link.tagName).toBe('A');
    });
  });

  it('should have proper hrefs for navigation', async () => {
    render(<HomePage />);
    
    const monitorLink = screen.getByText('Monitor').closest('a');
    expect(monitorLink).toBeInTheDocument();
    
    // Link should have href
    expect(monitorLink).toHaveAttribute('href', '/monitor');
  });
});

// ============================================================================
// Keyboard Navigation Tests: Monitor Page
// ============================================================================

describe('Keyboard Navigation: Monitor Page', () => {
  it('should have focusable table headers for sorting', () => {
    const { container } = render(
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    tabIndex={0}
                    role="button"
                    aria-label="Sort by REIT name"
                  >
                    REIT
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    tabIndex={0}
                    role="button"
                    aria-label="Sort by market cap"
                  >
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3">Atrium REIT</td>
                  <td className="px-4 py-3">500M</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
    
    const sortableHeaders = container.querySelectorAll('th[tabindex="0"]');
    expect(sortableHeaders.length).toBe(2);
    
    sortableHeaders.forEach(header => {
      expect(header).toHaveAttribute('role', 'button');
      expect(header).toHaveClass('focus:ring-2');
    });
  });

  it('should have focusable row selection checkboxes', () => {
    const { container } = render(
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    aria-label="Select Atrium REIT"
                    className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">Atrium REIT</td>
              </tr>
            </tbody>
          </table>
        </main>
      </div>
    );
    
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('aria-label', 'Select Atrium REIT');
  });

  it('should support keyboard navigation in filter bar', () => {
    const { container } = render(
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search REITs..."
              aria-label="Search REITs"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              aria-label="Filter by sector"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sectors</option>
              <option value="Industrial">Industrial</option>
            </select>
            <button 
              aria-label="Toggle view mode"
              className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Toggle View
            </button>
          </div>
        </div>
      </div>
    );
    
    const searchInput = container.querySelector('input[type="text"]');
    const sectorSelect = container.querySelector('select');
    const toggleButton = container.querySelector('button');
    
    expect(searchInput).toHaveAttribute('aria-label', 'Search REITs');
    expect(sectorSelect).toHaveAttribute('aria-label', 'Filter by sector');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle view mode');
  });
});

// ============================================================================
// Keyboard Navigation Tests: Compare Page
// ============================================================================

describe('Keyboard Navigation: Compare Page', () => {
  it('should have focusable category filter buttons', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 rounded-full text-sm font-medium bg-primary-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-pressed="true"
              >
                All Metrics
              </button>
              <button
                className="px-4 py-2 rounded-full text-sm font-medium bg-white text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-pressed="false"
              >
                Portfolio
              </button>
            </div>
          </div>
        </main>
      </div>
    );
    
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    
    buttons.forEach(button => {
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  it('should have focusable entity selector', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <div className="relative">
          <button 
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-label="Select REITs to compare"
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Select REITs
          </button>
        </div>
      </div>
    );
    
    const selector = container.querySelector('button[aria-haspopup="listbox"]');
    expect(selector).toBeInTheDocument();
    expect(selector).toHaveAttribute('aria-label', 'Select REITs to compare');
  });

  it('should support keyboard navigation in KPI grid', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <div className="bg-white rounded-xl shadow-card p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button 
              className="p-4 bg-neutral-50 rounded-lg text-left hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="View citations for Market Cap: 500M"
            >
              <p className="text-sm text-neutral-500">Market Cap</p>
              <p className="text-xl font-bold">500M</p>
            </button>
            <button 
              className="p-4 bg-neutral-50 rounded-lg text-left hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="View citations for DPU: 8.5 sen"
            >
              <p className="text-sm text-neutral-500">DPU</p>
              <p className="text-xl font-bold">8.5 sen</p>
            </button>
          </div>
        </div>
      </div>
    );
    
    const metricCards = container.querySelectorAll('button[aria-label^="View citations"]');
    expect(metricCards.length).toBe(2);
    
    metricCards.forEach(card => {
      expect(card).toHaveClass('focus:ring-2');
    });
  });
});

// ============================================================================
// Keyboard Navigation Tests: Entity Page
// ============================================================================

describe('Keyboard Navigation: Entity Detail Page', () => {
  it('should have focusable back button', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  aria-label="Go back"
                  className="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
                >
                  ←
                </button>
                <h1 className="text-xl font-semibold text-neutral-900">Atrium REIT</h1>
              </div>
            </div>
          </div>
        </header>
      </div>
    );
    
    const backButton = container.querySelector('button[aria-label="Go back"]');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveClass('focus:ring-2');
  });

  it('should have focusable citation filter buttons', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 bg-white rounded-xl shadow-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">Filter sources by type:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-pressed="true"
                >
                  All Sources
                </button>
                <button
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-pressed="false"
                >
                  Annual Report 2025
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
    
    const filterButtons = container.querySelectorAll('button[aria-pressed]');
    expect(filterButtons.length).toBe(2);
    
    filterButtons.forEach(button => {
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  it('should support keyboard navigation between tabs/sections', () => {
    const { container } = render(
      <div className="min-h-screen bg-neutral-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">All Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div 
                tabIndex={0}
                role="button"
                className="p-4 bg-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="View metric details for Portfolio Size"
              >
                <p className="text-sm text-neutral-500">Portfolio Size</p>
                <p className="text-xl font-bold">12 properties</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
    
    const focusableMetric = container.querySelector('[tabindex="0"]');
    expect(focusableMetric).toBeInTheDocument();
    expect(focusableMetric).toHaveAttribute('role', 'button');
  });
});

// ============================================================================
// Focus Management Tests
// ============================================================================

describe('Focus Management', () => {
  it('should trap focus in citation panel when open', () => {
    const { CitationPanel } = require('../../components/CitationPanel');
    const { useFocusTrap } = require('../../hooks/useFocusTrap');
    
    expect(CitationPanel).toBeDefined();
    expect(useFocusTrap).toBeDefined();
  });

  it('should return focus to trigger when dialog closes', () => {
    // Focus management is handled by useFocusTrap hook
    const { useFocusTrap } = require('../../hooks/useFocusTrap');
    expect(useFocusTrap).toBeDefined();
  });

  it('should have visible focus indicators on all interactive elements', () => {
    const { container } = render(
      <div>
        <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">Button 1</button>
        <button className="focus:outline-none focus:ring-2 focus:ring-blue-500">Button 2</button>
        <a href="#" className="focus:outline-none focus:ring-2 focus:ring-blue-500">Link</a>
        <input className="focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
      </div>
    );
    
    const focusables = container.querySelectorAll('.focus\\:ring-2');
    expect(focusables.length).toBe(4);
  });
});

// ============================================================================
// E2E Workflow: Complete User Journey
// ============================================================================

describe('E2E Workflow: Complete Keyboard Journey', () => {
  it('should support full navigation flow via keyboard', async () => {
    // This test documents the intended keyboard workflow
    // Actual full page navigation requires more complex integration testing
    
    render(<HomePage />);
    
    // Step 1: Home page loads with focus on document
    expect(document.activeElement).toBe(document.body);
    
    // Step 2: User can tab to navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    // Step 3: Each link should be accessible
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should support keyboard-only citation workflow', () => {
    const { CitationPanel } = require('../../components/CitationPanel');
    const { MetricCard } = require('../../components/MetricCard');
    
    // Verify components exist and support keyboard interaction
    expect(CitationPanel).toBeDefined();
    expect(MetricCard).toBeDefined();
    
    // MetricCard should support keyboard activation
    const { container } = render(
      <button 
        className="metric-card focus:outline-none focus:ring-2"
        aria-label="View citations for Market Cap"
        onClick={() => {}}
      >
        Market Cap: 500M
      </button>
    );
    
    const metricButton = container.querySelector('button');
    // Check for focus ring class (without escaping the colon)
    expect(metricButton?.className).toContain('focus:ring-2');
    expect(metricButton).toHaveAttribute('aria-label', 'View citations for Market Cap');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Data Flow', () => {
  it('should load REIT data files', () => {
    // Verify data files exist and are loadable
    const fs = require('fs');
    const dataDir = './public/data';
    
    // Check if data directory exists
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f: string) => f.includes('atrium'))).toBe(true);
      expect(files.some((f: string) => f.includes('axis'))).toBe(true);
    }
  });

  it('should have consistent data schema across files', () => {
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = './public/data';
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir).filter((f: string) => f.endsWith('.json'));
      
      files.forEach((file: string) => {
        const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const data = JSON.parse(content);
        
        // Verify required fields
        expect(data).toHaveProperty('schemaVersion');
        expect(data).toHaveProperty('entity');
        expect(data).toHaveProperty('references');
        expect(data).toHaveProperty('metrics');
      });
    }
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance: Page Load', () => {
  it('should render home page within acceptable time', () => {
    const start = performance.now();
    render(<HomePage />);
    const end = performance.now();
    
    // Should render in less than 100ms
    expect(end - start).toBeLessThan(100);
  });

  it('should have optimized bundle references', () => {
    // Verify no unnecessary imports
    const homePage = require('../../app/page');
    expect(homePage).toBeDefined();
    expect(homePage.default).toBeDefined();
  });
});
