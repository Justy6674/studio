"use client";

import React, { HTMLAttributes, AriaAttributes, JSXElementConstructor, ReactElement } from 'react';
import { A11yProps } from '@/lib/accessibility';

interface AriaEnhancerProps extends A11yProps {
  children: React.ReactNode;
  /**
   * Type of element for semantic meaning
   */
  elementType?: 'region' | 'navigation' | 'dialog' | 'listbox' | 'combobox' | 'tablist' | 'tab' | 'tabpanel';
  /**
   * Whether this element is current/active in a set
   */
  isCurrent?: boolean;
  /**
   * Whether this element is expanded (for menus, accordions, etc)
   */
  isExpanded?: boolean;
  /**
   * Whether this element is selected (for options, tabs, etc)
   */
  isSelected?: boolean;
  /**
   * Whether this element has a popup
   */
  hasPopup?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /**
   * Whether this element controls another element
   */
  controls?: string;
  /**
   * Whether this element describes another element
   */
  describes?: string;
  /**
   * Whether this element owns another element
   */
  owns?: string;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * A component that enhances children with proper ARIA attributes
 * This helps ensure consistent accessibility across the app
 * 
 * Usage:
 * <AriaEnhancer 
 *   role="button"
 *   aria-label="Close dialog" 
 *   elementType="dialog"
 *   controls="main-content"
 * >
 *   <button>×</button>
 * </AriaEnhancer>
 */
export function AriaEnhancer({
  children,
  elementType,
  role,
  id,
  tabIndex,
  isCurrent,
  isExpanded,
  isSelected,
  hasPopup,
  controls,
  describes,
  owns,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-hidden': ariaHidden,
  'aria-live': ariaLive,
  'aria-atomic': ariaAtomic,
}: AriaEnhancerProps) {
  // Map element type to appropriate role if not explicitly provided
  const derivedRole = !role && elementType ? {
    region: 'region',
    navigation: 'navigation',
    dialog: 'dialog',
    listbox: 'listbox', 
    combobox: 'combobox',
    tablist: 'tablist',
    tab: 'tab',
    tabpanel: 'tabpanel',
  }[elementType] : role;
  
  // Collect all ARIA attributes
  const ariaAttributes: HTMLAttributes<HTMLElement> & { role?: string } = {
    role: derivedRole,
    id,
    tabIndex,
    'aria-current': isCurrent ? 'page' : undefined,
    // Convert boolean values to appropriate string values for ARIA attributes
    'aria-expanded': isExpanded !== undefined ? (isExpanded ? 'true' : 'false') : undefined,
    'aria-selected': isSelected !== undefined ? (isSelected ? 'true' : 'false') : undefined,
    'aria-haspopup': hasPopup,
    'aria-controls': controls,
    'aria-describedby': ariaDescribedby,
    'aria-labelledby': ariaLabelledby,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden !== undefined ? (ariaHidden ? 'true' : 'false') : undefined,
    'aria-live': ariaLive,
    'aria-atomic': ariaAtomic !== undefined ? (ariaAtomic ? 'true' : 'false') : undefined,
    'aria-owns': owns,
  };

  // If child is a React element, clone it and add ARIA attributes
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...ariaAttributes,
      className: `${(children.props as any).className || ''} ${className}`.trim(),
    } as React.HTMLAttributes<HTMLElement>);
  }
  
  // Otherwise wrap in a div with ARIA attributes
  return (
    <div {...ariaAttributes} className={className}>
      {children}
    </div>
  );
}

/**
 * A component that makes non-interactive elements keyboard-accessible
 * Use for custom interactive elements that aren't native buttons, links, etc.
 * 
 * Usage:
 * <AccessibleInteraction
 *   onClick={handleClick} 
 *   role="button"
 *   label="Open menu"
 * >
 *   <div>Custom clickable element</div>
 * </AccessibleInteraction>
 */
export function AccessibleInteraction({
  children,
  onClick,
  onKeyDown,
  role = 'button',
  label,
  labelledBy,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  label?: string;
  labelledBy?: string;
  className?: string;
  disabled?: boolean;
}) {
  // Handle keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    // For buttons: Space and Enter activate
    if (role === 'button' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent);
    }
    
    // For links: Enter activates
    if (role === 'link' && e.key === 'Enter') {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent);
    }
    
    // Call custom handler if provided
    onKeyDown?.(e);
  };
  
  // If child is a React element, clone it and add accessibility attributes
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      role,
      tabIndex: disabled ? -1 : 0,
      'aria-label': label,
      'aria-labelledby': labelledBy,
      'aria-disabled': disabled ? 'true' : undefined,
      onClick: disabled ? undefined : onClick,
      onKeyDown: disabled ? undefined : handleKeyDown,
      className: `${(children.props as any).className || ''} ${className}`.trim(),
    } as React.HTMLAttributes<HTMLElement>);
  }
  
  // Otherwise wrap in a div with accessibility attributes
  return (
    <div
      role={role}
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * A component that provides screen reader only text
 * Use to provide additional context that is visually redundant
 * 
 * Usage:
 * <button>
 *   <span>×</span>
 *   <ScreenReaderOnly>Close dialog</ScreenReaderOnly>
 * </button>
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      }}
    >
      {children}
    </span>
  );
}
