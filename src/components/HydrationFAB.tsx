'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/lib/hooks/use-haptics';
import { HydrationLogModal } from './hydration/HydrationLogModal';
import { useHydration } from '@/contexts/HydrationContext';

// Animation variants for the FAB
const fabVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring',
      damping: 15,
      stiffness: 300
    }
  },
  hover: { 
    scale: 1.1,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

export function HydrationFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { triggerHaptic } = useHaptics();
  const { hydrationPercentage } = useHydration();

  const handleClick = () => {
    triggerHaptic('medium');
    setIsModalOpen(true);
  };

  // Calculate button color based on hydration percentage
  const getButtonVariant = () => {
    if (hydrationPercentage >= 100) return 'bg-green-600 hover:bg-green-700';
    if (hydrationPercentage >= 50) return 'bg-blue-600 hover:bg-blue-700';
    return 'bg-primary hover:bg-primary/90';
  };

  return (
    <>
      <motion.div
        className="fixed right-4 bottom-20 z-50 md:right-6 md:bottom-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 25,
          mass: 0.5
        }}
      >
        <Button
          className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${getButtonVariant()}`}
          size="icon"
          onClick={handleClick}
          aria-label="Log water intake"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          aria-controls="hydration-log-modal"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Log water intake</span>
        </Button>
      </motion.div>

      <HydrationLogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
