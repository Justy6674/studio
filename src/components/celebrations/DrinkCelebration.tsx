'use client';

import React, { useEffect, useState } from 'react';

interface DrinkCelebrationProps {
  drinkType: string;
  drinkName: string;
  isFirstTime: boolean;
  onComplete: () => void;
}

const DRINK_ICONS: Record<string, string> = {
  soda_water: '🥤',
  protein_water: '🍼',
  herbal_tea: '🍵',
  soup_broth: '🍲',
  fruit: '🍉',
  other: '🍹'
};

export default function DrinkCelebration({ 
  drinkType, 
  drinkName, 
  isFirstTime, 
  onComplete 
}: DrinkCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 4 seconds (3 seconds visible + 1 second fade)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const drinkIcon = DRINK_ICONS[drinkType] || '🍹';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="bg-slate-800/95 border border-slate-600 rounded-xl p-6 mx-4 max-w-sm w-full text-center backdrop-blur-sm shadow-2xl">
        
        {/* CSS Confetti Animation for first-time drinks */}
        {isFirstTime && showConfetti && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  ['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
                }`} />
              </div>
            ))}
          </div>
        )}
        
        <div className="relative z-10">
          <div className="text-4xl mb-4 animate-bounce">
            {drinkIcon}
          </div>
          
          {isFirstTime ? (
            <>
              <h3 className="text-lg font-bold text-green-400 mb-2">
                First {drinkName} Logged! 🎉
              </h3>
              <p className="text-slate-300 text-sm">
                Great job expanding your hydration variety!
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-blue-400 mb-2">
                {drinkName} Logged! ✨
              </h3>
              <p className="text-slate-300 text-sm">
                Keep up the great hydration habits!
              </p>
            </>
          )}
          
          <div className="mt-4">
            <div className="text-xs text-slate-400">
              Tap anywhere to continue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 