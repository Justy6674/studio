"use client";

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

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
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (type === '50%') {
      triggerBurstAnimation();
    } else if (type === '100%') {
      triggerFullCelebration();
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [type]);

  const triggerBurstAnimation = () => {
    // Quick burst animation for 50% goal
    const burstColors = ['#5271FF', '#60A5FA', '#3B82F6', '#1E40AF'];
    
    // Create a burst effect from center
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: burstColors,
      shapes: ['circle'],
      gravity: 1.2,
      scalar: 1.2,
      drift: 0
    });

    // Add water droplet effect
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.65 },
        colors: ['#60A5FA', '#06B6D4', '#0891B2'],
        shapes: ['circle'],
        gravity: 0.8,
        scalar: 0.8
      });
    }, 100);

    // Complete after 1 second
    animationRef.current = setTimeout(onComplete, 1000);
  };

  const triggerFullCelebration = () => {
    // Full confetti celebration for 100% goal
    const brandColors = [
      '#5271FF',  // Primary blue
      '#b68a71',  // Brown
      '#F1E5A6',  // Wheat
      '#60A5FA',  // Light blue
      '#10B981',  // Green
      '#8B5CF6',  // Purple
      '#F59E0B'   // Orange
    ];

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: brandColors,
      shapes: ['circle', 'square'],
      gravity: 1,
      scalar: 1.4
    });

    // Left side cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
        colors: brandColors,
        gravity: 1.2,
        scalar: 1.2
      });
    }, 200);

    // Right side cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
        colors: brandColors,
        gravity: 1.2,
        scalar: 1.2
      });
    }, 400);

    // Final sparkle shower
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#60A5FA', '#06B6D4', '#0891B2', '#F1E5A6'],
        shapes: ['circle'],
        gravity: 0.6,
        scalar: 0.8,
        drift: 0.1
      });
    }, 600);

    // Complete after 2.5 seconds
    animationRef.current = setTimeout(onComplete, 2500);
  };

  const getMessage = () => {
    if (type === '50%') {
      return {
        title: "Halfway There! 🚀",
        subtitle: `Great momentum, ${userName}!`,
        description: `${currentAmount}ml of ${goalAmount}ml completed`
      };
    } else {
      return {
        title: "Goal Achieved! 🎉",
        subtitle: `Outstanding work, ${userName}!`,
        description: `${currentAmount}ml hydration goal smashed!`
      };
    }
  };

  const message = getMessage();
  const progressPercentage = Math.round((currentAmount / goalAmount) * 100);

  return (
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
  );
} 