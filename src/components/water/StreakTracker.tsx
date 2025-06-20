'use client';

import { Flame } from 'lucide-react';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakTracker({ currentStreak, longestStreak }: StreakTrackerProps) {
  return (
    <div className="flex items-center justify-around w-full">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Flame className="h-6 w-6 text-orange-500" />
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{currentStreak}</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Flame className="h-6 w-6 text-red-600" />
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{longestStreak}</p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Longest</p>
      </div>
    </div>
  );
}
