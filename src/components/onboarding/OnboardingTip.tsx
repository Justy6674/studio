"use client";

import { useState, useEffect } from 'react';
import { X, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getHydrationLogs } from '@/lib/hydration';

interface OnboardingTipProps {
  userId: string;
}

export function OnboardingTip({ userId }: OnboardingTipProps) {
  const [showTip, setShowTip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const checkIfNewUser = async () => {
      try {
        // Check localStorage first (fastest check)
        const hasSeenTip = localStorage.getItem(`onboarding-tip-${userId}`);
        if (hasSeenTip) {
          setIsLoading(false);
          return;
        }

        // Check if user has any hydration data (indicates returning user)
        const hydrationLogs = await getHydrationLogs();
        const hasHydrationData = hydrationLogs && hydrationLogs.length > 0;

        // Check if user profile indicates they're new (created recently)
        const isNewProfile = userProfile?.createdAt 
          ? new Date().getTime() - new Date(userProfile.createdAt).getTime() < 24 * 60 * 60 * 1000 // Less than 24 hours old
          : true; // If no createdAt, assume new

        // Only show tip if:
        // 1. User hasn't seen it before (localStorage)
        // 2. AND they have no hydration data (new user)
        // 3. OR their profile is less than 24 hours old
        if (!hasSeenTip && (!hasHydrationData || isNewProfile)) {
          setShowTip(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // On error, don't show tip to avoid annoying returning users
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkIfNewUser();
    }
  }, [userId, userProfile]);

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-tip-${userId}`, 'true');
    setShowTip(false);
  };

  // Don't render anything while loading or if not showing tip
  if (isLoading || !showTip) return null;

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
            Let&apos;s Start! 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}