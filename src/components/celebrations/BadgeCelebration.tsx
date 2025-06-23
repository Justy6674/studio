"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HydrationBadge } from '@/components/gamification/BadgeSystem';
import { Award, Droplets, Zap, Target, Crown, Medal, Star, Trophy } from 'lucide-react';

// Badge icons mapping
const badgeIcons = {
  Award,
  Droplets,
  Zap,
  Target,
  Crown,
  Medal,
  Star,
  Trophy,
};

interface BadgeCelebrationProps {
  badge: HydrationBadge;
  onDismiss: () => void;
}

export function BadgeCelebration({ badge, onDismiss }: BadgeCelebrationProps) {
  const [showConfetti] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Get the icon component
  const Icon = badgeIcons[badge.icon] || badgeIcons.Award;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div className={`w-2 h-2 rounded-full ${
                ['bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-red-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 6)]
              }`} />
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 max-w-md w-full mx-4 text-center relative animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className={`p-6 ${badge.color} rounded-full`}>
            <Icon className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-200 mb-2">
          New Badge Unlocked!
        </h3>
        
        <div className="text-xl font-bold text-hydration-400 mb-2">
          {badge.name}
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          {badge.description}
        </p>
        
        <Button
          onClick={onDismiss}
          className="bg-hydration-500 hover:bg-hydration-600 text-white px-8"
        >
          Awesome! 🎉
        </Button>
      </div>
    </div>
  );
}
