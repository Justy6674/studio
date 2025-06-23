'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface AIMotivationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  motivation: string;
  loading: boolean;
  onRefresh?: () => void;
}

export function AIMotivationPopup({
  isOpen,
  onClose,
  motivation,
  loading,
  onRefresh,
}: AIMotivationPopupProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const { userProfile } = useAuth();
  
  // Get the user's preferred motivation tone
  const preferredTone = userProfile?.motivationTone || 'friendly';
  
  // Adjust title and styling based on tone
  const getToneSpecificElements = () => {
    switch (preferredTone) {
      case 'strict':
        return {
          title: 'Listen Up',
          icon: <MessageSquare className="h-5 w-5 text-red-500" />,
          accentColor: 'border-red-500',
          buttonText: 'Got it'
        };
      case 'funny':
        return {
          title: 'Fun Hydration Fact',
          icon: <Sparkles className="h-5 w-5 text-amber-500" />,
          accentColor: 'border-amber-500',
          buttonText: 'Haha, nice!'
        };
      case 'kick_my_ass':
        return {
          title: 'Reality Check',
          icon: <MessageSquare className="h-5 w-5 text-purple-600" />,
          accentColor: 'border-purple-600',
          buttonText: 'I\'ll do better'
        };
      case 'friendly':
      default:
        return {
          title: 'Your Hydration Coach',
          icon: <Sparkles className="h-5 w-5 text-blue-500" />,
          accentColor: 'border-blue-500',
          buttonText: 'Thank you!'
        };
    }
  };
  
  const toneElements = getToneSpecificElements();
  
  useEffect(() => {
    if (isOpen) {
      setAnimationComplete(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {toneElements.icon}
            {toneElements.title}
          </DialogTitle>
          <DialogDescription>
            Personalized hydration feedback for your journey
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Getting AI guidance...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={motivation}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setAnimationComplete(true)}
              >
                <blockquote className={`border-l-4 ${toneElements.accentColor} pl-4 italic text-lg`}>
                  {motivation}
                </blockquote>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        
        <DialogFooter className="flex justify-between gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Tip
            </Button>
          )}
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={animationComplete ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <Button onClick={onClose}>
              {toneElements.buttonText}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
