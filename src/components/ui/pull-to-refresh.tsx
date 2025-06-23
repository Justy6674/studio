'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  disabled = false 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const threshold = 80; // Distance in pixels to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable pull to refresh at the top of the page
    if (window.scrollY === 0 && !disabled) {
      setIsPulling(true);
      setPullDistance(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled) return;
    
    const touch = e.touches[0];
    const newDistance = Math.max(0, Math.min(touch.clientY - 50, threshold * 1.5)); 
    setPullDistance(newDistance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        // Add haptic feedback for mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("relative w-full", className)}
      aria-live="polite"
      aria-busy={isRefreshing}
    >
      {/* Pull indicator */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-center items-end z-10 overflow-hidden"
        style={{ 
          height: pullDistance,
          opacity: pullDistance / threshold
        }}
        aria-hidden={pullDistance === 0}
      >
        <motion.div 
          animate={{ 
            rotate: isRefreshing ? 360 : 0 
          }}
          transition={{ 
            duration: 1, 
            repeat: isRefreshing ? Infinity : 0,
            ease: "linear" 
          }}
          className="mb-2"
        >
          <Loader2 className="h-6 w-6 text-primary" />
        </motion.div>
      </motion.div>

      {/* Main content */}
      <motion.div
        style={{ 
          marginTop: pullDistance 
        }}
      >
        {children}
      </motion.div>
      
      {/* Fixed refresh indicator when actually refreshing */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 flex justify-center items-center py-3 bg-background z-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm font-medium">Refreshing...</span>
        </div>
      )}
    </div>
  );
}
