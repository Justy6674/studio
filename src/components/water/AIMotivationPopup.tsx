'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIMotivationPopupProps {
  motivation: string;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export function AIMotivationPopup({
  motivation,
  isOpen,
  onClose,
  loading,
  onRefresh,
}: AIMotivationPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  AI Coach
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700 w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700 w-full"></div>
                  </div>
                ) : (
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    &ldquo;{motivation}&rdquo;
                  </p>
                )}
                <Button onClick={onRefresh} disabled={loading}>
                  {loading ? 'Thinking...' : 'Another one!'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
