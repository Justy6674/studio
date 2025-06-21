'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface InteractiveGlassProps {
  currentAmount: number;
  goalAmount: number;
  className?: string;
  onTap?: () => void;
}

export function InteractiveGlass({ 
  currentAmount, 
  goalAmount, 
  className = '', 
  onTap 
}: InteractiveGlassProps) {
  const fillPercentage = Math.min((currentAmount / goalAmount) * 100, 100);
  const waterHeight = fillPercentage;

  return (
    <div 
      className={`relative flex flex-col items-center ${className}`}
      onClick={onTap}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onTap?.() : null}
      role="button"
      tabIndex={0}
      aria-label="Log water by tapping on glass"
    >
      {/* Glass Container */}
      <div className="relative w-32 h-48 cursor-pointer group">
        {/* Glass Outline */}
        <svg
          width="128"
          height="192"
          viewBox="0 0 128 192"
          className="absolute inset-0 z-10"
        >
          {/* Glass Border */}
          <path
            d="M16 16 C16 16 16 16 16 20 L16 176 C16 184 24 192 32 192 L96 192 C104 192 112 184 112 176 L112 20 C112 16 112 16 112 16 L16 16 Z"
            fill="none"
            stroke="#b68a71"
            strokeWidth="3"
            className="drop-shadow-lg"
          />
          
          {/* Glass Rim */}
          <ellipse
            cx="64"
            cy="16"
            rx="48"
            ry="8"
            fill="none"
            stroke="#b68a71"
            strokeWidth="3"
          />
        </svg>

        {/* Water Fill */}
        <div className="absolute bottom-2 left-2 right-2 overflow-hidden rounded-b-lg">
          <motion.div
            className="bg-gradient-to-t from-[#5271ff] via-[#6b82ff] to-[#8fa8ff] opacity-80"
            initial={{ height: 0 }}
            animate={{ height: `${waterHeight}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              width: '100%',
              position: 'absolute',
              bottom: 0,
              borderRadius: '0 0 8px 8px',
            }}
          >
            {/* Water Surface Animation */}
            {waterHeight > 0 && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: [-20, 20, -20],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            {/* Bubbles */}
            {waterHeight > 10 && (
              <>
                <motion.div
                  className="absolute w-1 h-1 bg-white/40 rounded-full"
                  style={{ left: '20%', bottom: '30%' }}
                  animate={{
                    y: [-10, 0, -10],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute w-1.5 h-1.5 bg-white/30 rounded-full"
                  style={{ left: '70%', bottom: '50%' }}
                  animate={{
                    y: [-15, 0, -15],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 1
                  }}
                />
                <motion.div
                  className="absolute w-0.5 h-0.5 bg-white/50 rounded-full"
                  style={{ left: '45%', bottom: '20%' }}
                  animate={{
                    y: [-8, 0, -8],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 1.5
                  }}
                />
              </>
            )}
          </motion.div>
        </div>

        {/* Tap Animation */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-[#5271ff]/50 opacity-0 group-hover:opacity-100"
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Amount Display */}
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-white">
          {currentAmount}ml
        </div>
        <div className="text-sm text-white/70">
          of {goalAmount}ml goal
        </div>
        <div className="text-xs text-[#b68a71] mt-1">
          {fillPercentage.toFixed(0)}% complete
        </div>
      </div>

      {/* Ripple Effect on Tap */}
      {onTap && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-[#5271ff]/20"
          initial={{ scale: 0, opacity: 1 }}
          whileTap={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
} 