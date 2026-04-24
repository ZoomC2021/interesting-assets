'use client';

/**
 * useFocusTrap - Hook for trapping focus within a modal/panel element
 * Implements proper focus management for accessibility
 */

import { useEffect, useRef, useCallback } from 'react';

interface FocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  returnFocusOnDeactivate?: boolean;
}

export function useFocusTrap<T extends HTMLElement>({
  isActive,
  onEscape,
  returnFocusOnDeactivate = true,
}: FocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Store the element that was focused before opening
  useEffect(() => {
    if (isActive) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [isActive]);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = containerRef.current;
    if (!container) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors));
    
    // Filter out elements that are not visible
    return elements.filter((el): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Handle Tab key for focus trapping
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          // Shift + Tab - moving backwards
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab - moving forwards
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape, getFocusableElements]);

  // Focus the first focusable element when activated
  useEffect(() => {
    if (!isActive) {
      // Return focus to the previously focused element when deactivated
      if (returnFocusOnDeactivate && previouslyFocusedElement.current) {
        setTimeout(() => {
          previouslyFocusedElement.current?.focus();
        }, 0);
      }
      return;
    }

    // Focus the first focusable element or the container itself
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = getFocusableElements();
      
      if (focusableElements.length > 0) {
        // Focus the first focusable element (usually the close button)
        focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the container and make it focusable
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isActive, getFocusableElements, returnFocusOnDeactivate]);

  // Prevent body scroll when trap is active
  useEffect(() => {
    if (!isActive) {
      document.body.style.overflow = '';
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isActive]);

  return containerRef;
}

export default useFocusTrap;
