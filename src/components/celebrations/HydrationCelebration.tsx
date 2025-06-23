"use client";

import React, { useState, useEffect } from 'react';
import { Confetti } from '@/components/ui/confetti';

interface HydrationCelebrationProps {
  type: '50%' | '100%';
  currentAmount: number;
  goalAmount: number;
  onComplete: () => void;
  userName?: string;
}

export function HydrationCelebration({ 
  type, 
  currentAmount, 
  goalAmount, 
  onComplete, 
  userName = "Friend" 
}: HydrationCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiType = type === '50%' ? 'burst' : 'full';
  const confettiDuration = confettiType === 'burst' ? 1000 : 2500;

  useEffect(() => {
    // Trigger the confetti on mount
    setShowConfetti(true);

    // Set a timer to call the onComplete callback after the animation
    const timer = setTimeout(() => {
      onComplete();
    }, confettiDuration + 500); // Add a small buffer

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const getMessage = () => {
    if (type === '50%') {
      return {
        title: "Halfway There! 🚀",
        subtitle: `Great momentum, ${userName}! `,
        description: `${currentAmount}ml of ${goalAmount}ml completed`
      };
    } else {
      return {
        title: "Goal Achieved! 🎉",
        subtitle: `Outstanding work, ${userName}! `,
        description: `${currentAmount}ml hydration goal smashed!`
      };
    }
  };

  const message = getMessage();
  const progressPercentage = Math.round((currentAmount / goalAmount) * 100);

  return (
    <>
      <Confetti active={showConfetti} type={confettiType} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        {/* Celebration Message Overlay */}
        <div className="pointer-events-auto">
          <div className={`
            bg-gradient-to-br from-slate-800 to-slate-900 
            border-2 ${type === '50%' ? 'border-blue-400' : 'border-yellow-400'}
            rounded-2xl p-6 shadow-2xl transform animate-bounce
            text-center max-w-sm mx-4
          `}>
            {/* Achievement Badge */}
            <div className={`
              inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
              ${type === '50%' 
                ? 'bg-blue-500 text-blue-100' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              }
            `}>
              <span className="text-2xl font-bold">{progressPercentage}%</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {message.title}
            </h2>

            {/* Subtitle */}
            <p className={`
              text-lg font-semibold mb-2
              ${type === '50%' ? 'text-blue-300' : 'text-yellow-300'}
            `}>
              {message.subtitle}
            </p>

            {/* Description */}
            <p className="text-slate-300 text-sm">
              {message.description}
            </p>

            {/* Progress Visualization */}
            <div className="mt-4">
              <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`
                    h-full rounded-full transition-all duration-1000
                    ${type === '50%' 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                      : 'bg-gradient-to-r from-green-400 via-yellow-400 to-orange-500'
                    }
                  `}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}