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
        // IMMEDIATE FIX: Check if we're on dashboard with existing progress
        // If user has visible progress (URL contains dashboard and progress ring visible), 
        // they're definitely a returning user - dismiss immediately
        if (window.location.pathname.includes('dashboard')) {
          const progressElement = document.querySelector('[data-progress]') || 
                                 document.querySelector('.progress') ||
                                 document.querySelector('[class*="progress"]');
          if (progressElement) {
            localStorage.setItem(`onboarding-tip-${userId}`, 'true');
            setIsLoading(false);
            return;
          }
        }

        // Check localStorage first (fastest check)
        const hasSeenTip = localStorage.getItem(`onboarding-tip-${userId}`);
        if (hasSeenTip) {
          setIsLoading(false);
          return;
        }

        // Check if user has any hydration data (indicates returning user)
        const hydrationLogs = await getHydrationLogs();
        const hasHydrationData = hydrationLogs && hydrationLogs.length > 0;

        // STRICT RULE: If user has ANY hydration data, they are a returning user
        // Never show welcome modal to returning users, regardless of profile age
        if (hasHydrationData) {
          // Mark as seen to prevent future checks
          localStorage.setItem(`onboarding-tip-${userId}`, 'true');
          setIsLoading(false);
          return;
        }

        // Check if user profile indicates they're very new (created in last 2 hours)
        const isVeryNewProfile = userProfile?.createdAt 
          ? new Date().getTime() - new Date(userProfile.createdAt).getTime() < 2 * 60 * 60 * 1000 // Less than 2 hours old
          : false; // If no createdAt, assume NOT new (safer default)

        // Only show tip if:
        // 1. User hasn't seen it before (localStorage)
        // 2. AND they have no hydration data (confirmed new user)  
        // 3. AND their profile is very new (less than 2 hours old)
        if (!hasSeenTip && !hasHydrationData && isVeryNewProfile) {
          setShowTip(true);
        } else {
          // Mark as seen to prevent future annoyance
          localStorage.setItem(`onboarding-tip-${userId}`, 'true');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // On error, mark as seen to avoid annoying users
        localStorage.setItem(`onboarding-tip-${userId}`, 'true');
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