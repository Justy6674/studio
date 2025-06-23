"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the keyboard navigation context
interface KeyboardNavigationContextType {
  isKeyboardUser: boolean;
  setIsKeyboardUser: React.Dispatch<React.SetStateAction<boolean>>;
  focusVisible: boolean;
  registerEscapeHandler: (handler: () => void) => () => void;
  triggerEscapeHandlers: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

/**
 * Provider component that manages keyboard navigation state and behaviors
 * - Detects when users are navigating with keyboard vs. mouse
 * - Provides focus styles only when relevant
 * - Manages escape key handlers across the app
 */
export function KeyboardNavigationProvider({
  children
}: {
  children: React.ReactNode;
}) {
  // Track whether the user is navigating with keyboard
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  // Track escape key handlers that have been registered
  const [escapeHandlers, setEscapeHandlers] = useState<Array<() => void>>([]);

  // Register an escape handler and return function to unregister it
  const registerEscapeHandler = (handler: () => void) => {
    setEscapeHandlers(prev => [...prev, handler]);
    
    // Return function to remove this handler
    return () => {
      setEscapeHandlers(prev => prev.filter(h => h !== handler));
    };
  };
  
  // Trigger all registered escape handlers
  const triggerEscapeHandlers = () => {
    // Get the most recent escape handler and call it
    const mostRecentHandler = escapeHandlers[escapeHandlers.length - 1];
    if (mostRecentHandler) {
      mostRecentHandler();
    }
  };
  
  useEffect(() => {
    // Detect keyboard navigation (mainly Tab key)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
        setFocusVisible(true);
        document.body.classList.add('keyboard-user');
      } else if (event.key === 'Escape') {
        triggerEscapeHandlers();
      }
    };
    
    // Detect mouse/touch navigation
    const handlePointerDown = () => {
      setFocusVisible(false);
      document.body.classList.remove('keyboard-user');
      // Don't set isKeyboardUser to false here to avoid flickering
    };
    
    // Listen for keyboard and pointer events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [escapeHandlers]);
  
  return (
    <KeyboardNavigationContext.Provider value={{
      isKeyboardUser,
      setIsKeyboardUser,
      focusVisible,
      registerEscapeHandler,
      triggerEscapeHandlers
    }}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
}

/**
 * Custom hook to access keyboard navigation context
 */
export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  
  return context;
}

/**
 * Component to trap focus within its children when active
 * Useful for modals, dialogs, and dropdowns
 */
export function FocusTrap({
  children,
  active = true,
  onEscape,
  autoFocus = true
}: {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
  autoFocus?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { registerEscapeHandler } = useKeyboardNavigation();
  
  // Register escape handler
  useEffect(() => {
    if (!onEscape) return;
    
    return registerEscapeHandler(onEscape);
  }, [onEscape, registerEscapeHandler]);
  
  // Handle focus trapping
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Get all focusable elements
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
      ) as HTMLElement[];
    };
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !active) return;
      
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Trap focus in the container
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    
    // Auto-focus the first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
    
    document.addEventListener('keydown', handleTabKey);
    
    // Save the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      
      // Restore focus when component unmounts
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active, autoFocus]);
  
  return (
    <div ref={containerRef} style={{ outline: 'none' }}>
      {children}
    </div>
  );
}

/**
 * Component that adds keyboard shortcut support to an element
 */
export function KeyboardShortcut({
  children,
  shortcut,
  action,
  description
}: {
  children: React.ReactNode;
  shortcut: string | string[];
  action: () => void;
  description?: string;
}) {
  useEffect(() => {
    // Parse the shortcut into individual keys
    const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Convert shortcut strings to key combinations
      const matchShortcut = (shortcutStr: string) => {
        const keys = shortcutStr.toLowerCase().split('+');
        
        const modifiers = {
          ctrl: keys.includes('ctrl') && event.ctrlKey,
          shift: keys.includes('shift') && event.shiftKey,
          alt: keys.includes('alt') && event.altKey,
          meta: keys.includes('meta') && event.metaKey,
        };
        
        // Extract the main key (last one that's not a modifier)
        const mainKey = keys.filter(k => !['ctrl', 'shift', 'alt', 'meta'].includes(k)).pop();
        
        // Check if main key matches
        const keyMatches = mainKey ? event.key.toLowerCase() === mainKey : true;
        
        // For modifier-only shortcuts, check that at least one modifier is pressed
        const hasModifier = keys.some(k => ['ctrl', 'shift', 'alt', 'meta'].includes(k));
        
        // Check if shortcut is used in an input field
        const isInInput = event.target instanceof HTMLInputElement || 
                         event.target instanceof HTMLTextAreaElement || 
                         (event.target as HTMLElement).isContentEditable;
        
        // Don't trigger shortcuts when typing in input fields unless it's Escape
        if (isInInput && mainKey !== 'escape') {
          return false;
        }
        
        // For modifiers, check that the specified ones are pressed and others are not
        const modifiersMatch = 
          (!keys.includes('ctrl') || modifiers.ctrl) &&
          (!keys.includes('shift') || modifiers.shift) &&
          (!keys.includes('alt') || modifiers.alt) &&
          (!keys.includes('meta') || modifiers.meta);
        
        return (hasModifier ? modifiersMatch : true) && keyMatches;
      };
      
      // Check if any of the shortcuts match
      if (shortcuts.some(matchShortcut)) {
        event.preventDefault();
        action();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, action]);
  
  // Create child element with aria-keyshortcuts if description is provided
  const childElement = React.Children.only(children);
  
  if (React.isValidElement(childElement)) {
    const shortcutStr = Array.isArray(shortcut) ? shortcut.join(' ') : shortcut;
    
    return React.cloneElement(childElement, {
      'aria-keyshortcuts': shortcutStr,
      title: description ? `${childElement.props.title || ''} (${description} ${shortcutStr})`.trim() : childElement.props.title,
    } as React.HTMLAttributes<HTMLElement>);
  }
  
  return children;
}
