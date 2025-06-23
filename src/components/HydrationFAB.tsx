'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Droplet, Coffee, Beer, Wine, History, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/lib/hooks/use-haptics';
import { HydrationLogModal } from './hydration/HydrationLogModal';
import { useHydration } from '@/contexts/HydrationContext';
import { cn } from '@/lib/utils';
import { differenceInHours } from 'date-fns';
import { useDrinkHistory } from '@/hooks/useDrinkHistory';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

// Helper function to get the icon for a drink type
const getDrinkIcon = (drinkType: string) => {
  switch (drinkType) {
    case 'water': return Droplet;
    case 'coffee': case 'tea': return Coffee;
    case 'beer': return Beer;
    case 'cocktail': return Wine;
    default: return Droplet;
  }
};

export function HydrationFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { triggerHaptic } = useHaptics();
  const { hydrationPercentage, dailyHydration, logHydration, isLoading } = useHydration();
  const { lastUsedDrinkType, lastUsedAmount } = useDrinkHistory();
  
  // Check if user hasn't logged water in over 2 hours
  useEffect(() => {
    // Skip if no hydration data yet
    if (!dailyHydration) return;
    
    const checkInactivity = () => {
      const logs = dailyHydration.logs;
      
      if (!logs || logs.length === 0) {
        // If no logs yet today, trigger pulse animation
        setShouldPulse(true);
        return;
      }
      
      // Sort logs by timestamp (newest first)
      const sortedLogs = [...logs].sort((a, b) => {
        return b.getDate().getTime() - a.getDate().getTime();
      });
      
      // Get most recent log
      const lastLog = sortedLogs[0];
      const hoursSinceLastLog = differenceInHours(new Date(), lastLog.getDate());
      
      // Pulse if it's been more than 2 hours since last log
      setShouldPulse(hoursSinceLastLog >= 2);
    };
    
    checkInactivity();
    
    // Check every 15 minutes
    const intervalId = setInterval(checkInactivity, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [dailyHydration]);
  

  const handleClick = () => {
    // Enhanced haptic feedback - more pronounced for low-vision users
    triggerHaptic('medium');
    setTimeout(() => triggerHaptic('light'), 150); // Double tap sensation
    
    // Reset pulse animation when clicked
    setShouldPulse(false);
    setIsModalOpen(true);
  };

  // Calculate button color based on hydration percentage
  const getButtonVariant = () => {
    if (hydrationPercentage >= 100) return 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20';
    if (hydrationPercentage >= 50) return 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20';
    return 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20';
  };
  
  // Define pulse animation variants
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(66, 153, 225, 0.5)',
        '0 0 0 10px rgba(66, 153, 225, 0)',
        '0 0 0 0 rgba(66, 153, 225, 0)'
      ],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const, // Use const assertion for TypeScript
        duration: 2
      }
    },
    idle: { scale: 1 }
  };

  // Quick add last used drink function
  const handleQuickAdd = async () => {
    if (!lastUsedDrinkType || !lastUsedAmount) {
      toast({
        title: "No previous drink found",
        description: "Please log a drink first to use quick add.",
        variant: "default"
      });
      return;
    }

    // Enhanced haptic feedback
    triggerHaptic('light');
    
    try {
      // Log the last used drink with proper parameters
      await logHydration(lastUsedAmount, lastUsedDrinkType);

      // Show success toast
      toast({
        title: "Quick add successful",
        description: `Added ${lastUsedAmount}ml of ${lastUsedDrinkType}`,
        variant: "default"
      });

      // Reset pulse animation
      setShouldPulse(false);
    } catch (error) {
      toast({
        title: "Failed to log drink",
        description: "There was an error logging your drink. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="fixed right-4 bottom-20 z-50 md:right-6 md:bottom-6 flex flex-col items-end space-y-3">
        {/* Quick Add Button - Only show if there's a last used drink */}
        {lastUsedDrinkType && lastUsedAmount && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-14 w-14 rounded-full shadow-md flex items-center justify-center relative"
                    onClick={handleQuickAdd}
                    disabled={isLoading}
                    aria-label="Quick add last drink"
                  >
                    <div className="relative">
                      {/* Show drink type icon */}
                      {React.createElement(getDrinkIcon(lastUsedDrinkType), {
                        className: "h-6 w-6",
                        ...(lastUsedDrinkType === 'water' ? { fill: "#3b82f6" } : {})
                      })}
                      <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {lastUsedAmount >= 1000 ? `${(lastUsedAmount/1000).toFixed(1)}L` : `${lastUsedAmount}`}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Quick add {lastUsedAmount}ml {lastUsedDrinkType}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Main FAB Button */}
        <motion.div
          className="z-50"
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={shouldPulse ? "pulse" : "idle"}
          variants={pulseVariants}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
            mass: 0.5
          }}
        >
          {/* Outer touch target area for accessibility */}
          <div className="p-2 touch-none"> {/* Adds padding to increase touch area */}
            <Button
              className={cn(
                'h-18 w-18 rounded-full transition-all duration-300 flex items-center justify-center min-h-[60px] min-w-[60px]', // Increased size
                getButtonVariant()
              )}
              onClick={handleClick}
              aria-label="Log water intake"
              aria-haspopup="dialog"
              aria-expanded={isModalOpen}
              aria-controls="hydration-log-modal"
            >
              <motion.div
                className="relative flex items-center justify-center p-4" // Added padding for larger touch target
                initial={{ rotate: 0 }}
                whileTap={{ rotate: 45 }}
                animate={{ scale: shouldPulse ? [1, 1.1, 1] : 1 }}
                transition={shouldPulse ? { repeat: Infinity, duration: 2 } : {}}
              >
                {hydrationPercentage >= 100 ? (
                  <Droplet className="h-8 w-8 text-white" fill="white" />
                ) : (
                  <Plus className="h-8 w-8 text-white" strokeWidth={2.5} />
                )}
                
                {/* For screen readers */}
                <span className="sr-only">Log water intake</span>
              </motion.div>
            </Button>
          </div>
        </motion.div>
      </div>

      <HydrationLogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
