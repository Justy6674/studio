"use client";

import { useState, useEffect } from 'react';
import { X, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingTipProps {
  userId: string;
}

export function OnboardingTip({ userId }: OnboardingTipProps) {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    // Check if user has seen the onboarding tip
    const hasSeenTip = localStorage.getItem(`onboarding-tip-${userId}`);
    if (!hasSeenTip) {
      setShowTip(true);
    }
  }, [userId]);

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-tip-${userId}`, 'true');
    setShowTip(false);
  };

  if (!showTip) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md w-full mx-4 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-hydration-500/20 rounded-full">
            <Droplets className="h-6 w-6 text-hydration-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">
            Welcome to Water4WeightLoss! 💧
          </h3>
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          Drinking water is one of the <strong>easiest weight loss wins</strong>. 
          Log every glass here—see your progress add up and watch your healthy habits grow!
        </p>
        
        <div className="flex gap-2">
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-hydration-500 hover:bg-hydration-600 text-white"
          >
            Let's Start! 🚀
          </Button>
        </div>
      </div>
    </div>
  );
} 