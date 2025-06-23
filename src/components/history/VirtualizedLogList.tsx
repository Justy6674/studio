'use client';

import React, { useEffect, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { HydrationLog } from '@/lib/types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useKeyboardNavigation } from '@/components/accessibility/KeyboardNavigationProvider';

interface VirtualizedLogListProps {
  logs: HydrationLog[];
  className?: string;
  height?: number;
}

const LogItem = React.memo(({ log, index, style, onKeyDown, isKeyboardUser }: {
  log: HydrationLog;
  index: number;
  style: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isKeyboardUser: boolean;
}) => {
  return (
    <div style={style} data-index={index}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.2 }}
        tabIndex={isKeyboardUser ? 0 : undefined}
        onKeyDown={onKeyDown}
        className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-lg ${index % 2 === 0 ? 'bg-secondary/30' : 'bg-secondary/50'} mx-1 my-1`}
        role="listitem"
        aria-label={`${log.amount} ml of ${log.drinkName || log.drinkType || 'water'} at ${format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}`}
      >
        <Card className="bg-transparent border-0 shadow-none hover:bg-secondary/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{log.amount} ml</p>
                {log.drinkType && (
                  <p className="text-xs text-muted-foreground">
                    {log.drinkName || log.drinkType}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});
LogItem.displayName = 'LogItem';

const EmptyState = () => (
  <div className="text-center py-8">
    <p className="text-muted-foreground">No hydration logs found</p>
    <button 
      className="mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      onClick={() => {
        // Navigate to home to encourage logging
        window.location.href = '/';
      }}
    >
      Log your first drink
    </button>
  </div>
);

export function VirtualizedLogList({ logs, className = '', height = 400 }: VirtualizedLogListProps) {
  const { isKeyboardUser } = useKeyboardNavigation();
  const [listRef, setListRef] = useState<List | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Calculate responsive item size
  const itemSize = isMobile ? 85 : 95;
  
  // Dynamic width based on container size
  const [width, setWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Update width on resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < logs.length - 1) {
          setFocusedIndex(currentIndex + 1);
          listRef?.scrollToItem(currentIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setFocusedIndex(currentIndex - 1);
          listRef?.scrollToItem(currentIndex - 1);
        }
        break;
      default:
        break;
    }
  };
  
  // Focus the item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex !== null && isKeyboardUser) {
      const item = document.querySelector(`[data-index="${focusedIndex}"] [tabindex="0"]`);
      if (item instanceof HTMLElement) {
        item.focus();
      }
    }
  }, [focusedIndex, isKeyboardUser]);
  
  if (logs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`${className}`} ref={containerRef}>
      {width > 0 && (
        <div role="list" aria-label="Hydration log history">
          <List
            ref={setListRef}
            height={height}
            width={width}
            itemCount={logs.length}
            itemSize={itemSize}
            className="scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            {({ index, style }: ListChildComponentProps) => (
              <LogItem
                log={logs[index]}
                index={index}
                style={style}
                onKeyDown={handleKeyDown}
                isKeyboardUser={isKeyboardUser}
              />
            )}
          </List>
        </div>
      )}
    </div>
  );
}
