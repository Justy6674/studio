'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RippleEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
}

export function RippleEffect({ trigger, onComplete, className = '' }: RippleEffectProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {trigger && (
        <motion.div
          className="absolute inset-0 border-2 border-[#5271ff]/60 rounded-full"
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={onComplete}
        />
      )}
    </div>
  );
}

interface ShimmerEffectProps {
  isActive?: boolean;
  className?: string;
}

export function ShimmerEffect({ isActive = true, className = '' }: ShimmerEffectProps) {
  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

interface WaterDropProps {
  x: number;
  y: number;
  delay?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function WaterDrop({ 
  x, 
  y, 
  delay = 0, 
  size = 'medium',
  className = '' 
}: WaterDropProps) {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  return (
    <motion.div
      className={`absolute bg-gradient-to-br from-[#5271ff] to-[#8fa8ff] rounded-full opacity-80 ${sizeClasses[size]} ${className}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, y: -20 }}
      animate={{ 
        scale: [0, 1, 0],
        y: [0, 20, 40],
        opacity: [0, 0.8, 0]
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: "easeOut"
      }}
    />
  );
}

interface WaterSplashProps {
  isActive: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

export function WaterSplash({ 
  isActive, 
  intensity = 'medium',
  className = '' 
}: WaterSplashProps) {
  const dropCounts = {
    light: 3,
    medium: 6,
    heavy: 10
  };

  const dropCount = dropCounts[intensity];

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {Array.from({ length: dropCount }).map((_, i) => (
        <WaterDrop
          key={i}
          x={30 + Math.random() * 40} // Center area with some spread
          y={20 + Math.random() * 30}
          delay={i * 0.1}
          size={Math.random() > 0.5 ? 'small' : 'medium'}
        />
      ))}
    </div>
  );
}

interface FloatingBubblesProps {
  count?: number;
  isActive?: boolean;
  className?: string;
}

export function FloatingBubbles({ 
  count = 5, 
  isActive = true,
  className = '' 
}: FloatingBubblesProps) {
  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            bottom: `${10 + Math.random() * 20}%`,
          }}
          animate={{
            y: [-50, -100],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

interface WaveEffectProps {
  amplitude?: number;
  frequency?: number;
  isActive?: boolean;
  className?: string;
}

export function WaveEffect({ 
  amplitude = 5, 
  frequency = 2,
  isActive = true,
  className = '' 
}: WaveEffectProps) {
  if (!isActive) return null;

  return (
    <div className={`absolute top-0 left-0 right-0 h-1 ${className}`}>
      <motion.div
        className="w-full h-full bg-gradient-to-r from-[#5271ff]/20 via-[#5271ff]/40 to-[#5271ff]/20"
        animate={{
          y: [0, amplitude, 0, -amplitude, 0],
        }}
        transition={{
          duration: frequency,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          clipPath: "polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)"
        }}
      />
    </div>
  );
}

// Combined water effects component for easy use
interface WaterEffectsProps {
  showRipple?: boolean;
  showShimmer?: boolean;
  showBubbles?: boolean;
  showWaves?: boolean;
  showSplash?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  onRippleComplete?: () => void;
  className?: string;
}

export function WaterEffects({
  showRipple = false,
  showShimmer = true,
  showBubbles = true,
  showWaves = true,
  showSplash = false,
  intensity = 'medium',
  onRippleComplete,
  className = ''
}: WaterEffectsProps) {
  return (
    <div className={`relative ${className}`}>
      {showShimmer && <ShimmerEffect />}
      {showBubbles && <FloatingBubbles count={intensity === 'light' ? 3 : intensity === 'heavy' ? 8 : 5} />}
      {showWaves && <WaveEffect amplitude={intensity === 'light' ? 3 : intensity === 'heavy' ? 8 : 5} />}
      {showRipple && <RippleEffect trigger={true} onComplete={onRippleComplete} />}
      {showSplash && <WaterSplash isActive={true} intensity={intensity} />}
    </div>
  );
} 