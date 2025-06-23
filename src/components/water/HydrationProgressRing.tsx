'use client';

import { motion } from 'framer-motion';

interface HydrationProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export function HydrationProgressRing({
  progress,
  size = 160,
  strokeWidth = 12,
}: HydrationProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const ringColor = progress >= 100 ? 'text-green-500' : 'text-blue-500';

  return (
    <div className="relative flex items-center justify-center" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className={ringColor}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {Math.round(progress)}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">of goal</span>
      </div>
    </div>
  );
}
