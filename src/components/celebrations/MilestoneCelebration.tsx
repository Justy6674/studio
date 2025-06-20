"use client";

import { useState, useEffect } from 'react';
import { Droplets, Trophy, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneCelebrationProps {
  milestone: number; // percentage reached (e.g., 50, 100)
  currentAmount: number;
  goalAmount: number;
  onDismiss: () => void;
}

export function MilestoneCelebration({ milestone, currentAmount, onDismiss }: MilestoneCelebrationProps) {
  const [showConfetti] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getMilestoneInfo = (milestone: number) => {
    if (milestone >= 100) {
      return { 
        icon: Trophy, 
        title: "Goal Achieved!", 
        message: `🎉 ${currentAmount}ml logged! Daily goal smashed! 🎉`, 
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        confettiColor: "bg-yellow-400"
      };
    } else if (milestone >= 75) {
      return { 
        icon: Target, 
        title: "Almost There!", 
        message: `${milestone}% complete! You're so close to your goal! 💪`, 
        color: "text-green-400",
        bgColor: "bg-green-500/20", 
        confettiColor: "bg-green-400"
      };
    } else if (milestone >= 50) {
      return { 
        icon: Droplets, 
        title: "Halfway There!", 
        message: `${milestone}% complete! Great momentum - keep it flowing! 🌊`, 
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        confettiColor: "bg-blue-400"
      };
    } else {
      return { 
        icon: Sparkles, 
        title: "Great Progress!", 
        message: `${milestone}% milestone reached! You're building a great habit! ✨`, 
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
        confettiColor: "bg-purple-400"
      };
    }
  };

  const { icon: Icon, title, message, color, bgColor, confettiColor } = getMilestoneInfo(milestone);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(milestone >= 100 ? 30 : 15)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            >
              <div className={`w-2 h-2 rounded-full ${confettiColor}`} />
            </div>
          ))}
          
          {/* Extra sparkles for goal achievement */}
          {milestone >= 100 && [...Array(10)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `2s`,
              }}
            >
              <div className="text-yellow-400 text-xl">✨</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-sm w-full mx-4 text-center relative">
        <div className="flex justify-center mb-4">
          <div className={`p-3 ${bgColor} rounded-full ${color}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-200 mb-2">
          {title}
        </h3>
        
        <div className="text-3xl font-bold text-hydration-400 mb-2">
          {milestone}%
        </div>
        
        <p className="text-slate-300 mb-4 leading-relaxed text-sm">
          {message}
        </p>
        
        {/* Progress visualization */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div 
            className="bg-hydration-400 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(milestone, 100)}%` }}
          />
        </div>
        
        <Button
          onClick={onDismiss}
          size="sm"
          className="bg-hydration-500 hover:bg-hydration-600 text-white px-6"
        >
          Keep Going! 💪
        </Button>
      </div>
    </div>
  );
} 