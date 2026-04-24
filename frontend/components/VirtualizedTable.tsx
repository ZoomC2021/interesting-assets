'use client';

/**
 * VirtualizedTable - Performance wrapper for large tables
 * Uses windowing to render only visible rows
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualizedTableProps<T> {
  data: T[];
  rowHeight: number;
  headerHeight?: number;
  containerHeight: number;
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedTable<T>({
  data,
  rowHeight,
  headerHeight = 0,
  containerHeight,
  renderRow,
  renderHeader,
  overscan = 5,
  className = '',
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const totalHeight = data.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(data.length, startIndex + visibleCount);
  
  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);
  
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Generate visible rows
  const visibleRows = [];
  for (let i = startIndex; i < endIndex; i++) {
    const item = data[i];
    if (!item) continue;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      top: i * rowHeight + headerHeight,
      left: 0,
      right: 0,
      height: rowHeight,
    };
    
    visibleRows.push(
      <React.Fragment key={i}>
        {renderRow(item, i, style)}
      </React.Fragment>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight + headerHeight, position: 'relative' }}>
        {renderHeader && (
          <div 
            style={{ 
              position: 'sticky', 
              top: 0, 
              height: headerHeight,
              zIndex: 10,
            }}
          >
            {renderHeader()}
          </div>
        )}
        {visibleRows}
      </div>
    </div>
  );
}

// Simplified virtualized list for cards
interface VirtualizedListProps<T> {
  data: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  const totalHeight = data.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(data.length, startIndex + visibleCount);
  
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);
  
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  const visibleItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    const item = data[i];
    if (!item) continue;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      top: i * itemHeight,
      left: 0,
      right: 0,
      height: itemHeight,
    };
    
    visibleItems.push(
      <React.Fragment key={i}>
        {renderItem(item, i, style)}
      </React.Fragment>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

// Performance metrics hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    renderTime: 0,
    lastUpdate: Date.now(),
  });
  
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frames = 0;
    
    const measure = () => {
      frames++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: frames,
          lastUpdate: Date.now(),
        }));
        frames = 0;
        lastTime = now;
      }
      
      frameId = requestAnimationFrame(measure);
    };
    
    frameId = requestAnimationFrame(measure);
    
    return () => cancelAnimationFrame(frameId);
  }, []);
  
  const measureRenderTime = (fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setMetrics(prev => ({ ...prev, renderTime: end - start }));
  };
  
  return { ...metrics, measureRenderTime };
}
