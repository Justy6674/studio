"use client";

import { useState, useEffect } from 'react';
import { Trophy, Zap, Target, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreakCelebrationProps {
  streak: number;
  isNewRecord?: boolean;
  onDismiss: () => void;
}

export function StreakCelebration({ streak, isNewRecord = false, onDismiss }: StreakCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getMilestoneInfo = (streak: number) => {
    if (streak >= 30) return { icon: Crown, title: "Hydration Royalty!", message: "30 days strong! You're a water champion! 👑", color: "text-yellow-400" };
    if (streak >= 21) return { icon: Trophy, title: "Habit Master!", message: "21 days! You've built a lasting habit! 🏆", color: "text-yellow-400" };
    if (streak >= 14) return { icon: Target, title: "Two Week Warrior!", message: "14 days of consistency! Amazing! 🎯", color: "text-blue-400" };
    if (streak >= 7) return { icon: Zap, title: "Week Champion!", message: "7 days in a row! You're on fire! ⚡", color: "text-green-400" };
    if (streak >= 3) return { icon: Zap, title: "Nice Job!", message: "3 days strong! Keep it up! 💪", color: "text-green-400" };
    return { icon: Zap, title: "Great Start!", message: "You're building momentum! 🚀", color: "text-blue-400" };
  };

  const { icon: Icon, title, message, color } = getMilestoneInfo(streak);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
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
                ['bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-red-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
              }`} />
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 max-w-md w-full mx-4 text-center relative">
        <div className="flex justify-center mb-4">
          <div className={`p-4 bg-slate-700 rounded-full ${color}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-200 mb-2">
          {title}
        </h3>
        
        <div className="text-4xl font-bold text-hydration-400 mb-2">
          {streak} Day{streak !== 1 ? 's' : ''}
        </div>
        
        {isNewRecord && (
          <div className="text-sm text-yellow-400 font-semibold mb-2">
            🎉 NEW PERSONAL RECORD! 🎉
          </div>
        )}
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>
        
        <Button
          onClick={onDismiss}
          className="bg-hydration-500 hover:bg-hydration-600 text-white px-8"
        >
          Keep Going! 💪
        </Button>
      </div>
    </div>
  );
} 