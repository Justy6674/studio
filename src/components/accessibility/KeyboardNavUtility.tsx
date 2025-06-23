"use client";

import React, { useEffect } from 'react';

interface KeyboardNavUtilityProps {
  children: React.ReactNode;
  /**
   * CSS selector for focusable elements within this component
   * Defaults to common interactive elements
   */
  focusSelector?: string;
  /**
   * Enable arrow key navigation between elements
   */
  enableArrowKeys?: boolean;
  /**
   * Set initial focus to the first focusable element when mounted
   */
  autoFocus?: boolean;
  /**
   * Trap focus within this component (useful for modals)
   */
  trapFocus?: boolean;
  /**
   * Callback when user presses Escape
   */
  onEscape?: () => void;
}

/**
 * A utility component that enhances keyboard navigation for its children
 * - Provides arrow key navigation between elements
 * - Can trap focus within itself (useful for modals/dialogs)
 * - Can auto-focus the first focusable element on mount
 * - Supports escape key handler
 * 
 * Usage:
 * <KeyboardNavUtility trapFocus autoFocus onEscape={closeModal}>
 *   <form>...</form>
 * </KeyboardNavUtility>
 */
export function KeyboardNavUtility({
  children,
  focusSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  enableArrowKeys = true,
  autoFocus = false,
  trapFocus = false,
  onEscape,
}: KeyboardNavUtilityProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return Array.from(container.querySelectorAll(focusSelector))
        .filter(el => !el.hasAttribute('disabled') && 
                      el.getAttribute('aria-hidden') !== 'true') as HTMLElement[];
    };

    // Auto-focus the first element
    if (autoFocus) {
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const focusables = getFocusableElements();
      const currentIndex = focusables.findIndex(el => el === document.activeElement);
      
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      // Handle arrow keys navigation
      if (enableArrowKeys && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const nextIndex = currentIndex < focusables.length - 1 ? currentIndex + 1 : 0;
        focusables[nextIndex].focus();
      } else if (enableArrowKeys && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
        focusables[prevIndex].focus();
      }

      // Handle focus trapping with Tab key
      if (trapFocus && e.key === 'Tab') {
        if (focusables.length === 0) return;
        
        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusSelector, enableArrowKeys, autoFocus, trapFocus, onEscape]);

  return (
    <div ref={containerRef} className="keyboard-nav-utility">
      {children}
    </div>
  );
}

/**
 * A component that applies focus styling when a parent container is navigated via keyboard
 * This helps users track their location when tabbing through a page
 */
export function KeyboardFocusHighlight({ 
  children,
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);
  
  useEffect(() => {
    // Add a global keyboard user detector
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
      }
    };
    
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleMouseDown);
    };
  }, []);
  
  return (
    <div 
      className={`keyboard-focus-container ${isKeyboardUser ? 'keyboard-focus-active' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A component that adds a "Skip to main content" link for keyboard users
 * This is an accessibility best practice to allow keyboard users to bypass navigation
 */
export function SkipToContent() {
  const [visible, setVisible] = React.useState(false);
  
  return (
    <a
      href="#main-content"
      className={`skip-to-content ${visible ? 'visible' : ''}`}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      style={{
        position: 'absolute',
        top: visible ? '8px' : '-9999px',
        left: visible ? '8px' : '-9999px',
        zIndex: 9999,
        padding: '8px 16px',
        background: 'white',
        border: '2px solid #5271ff',
        borderRadius: '4px',
        fontWeight: 500,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        outline: 'none',
      }}
    >
      Skip to main content
    </a>
  );
}
