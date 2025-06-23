"use client";

import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  active: boolean;
  type?: 'burst' | 'full';
  duration?: number; // in milliseconds
  colors?: string[];
  particleCount?: number;
}

export function Confetti({
  active,
  type = 'full',
  duration,
  colors,
  particleCount
}: ConfettiProps) {
  const confettiConfig = {
    burst: {
      particleCount: 50,
      colors: ['#5271FF', '#60A5FA', '#3B82F6', '#1E40AF'],
      duration: 1000,
    },
    full: {
      particleCount: 200,
      colors: ['#5271FF', '#b68a71', '#F1E5A6', '#60A5FA', '#10B981', '#8B5CF6', '#F59E0B'],
      duration: 2500,
    },
  };

  const { 
    particleCount: presetParticleCount, 
    colors: presetColors, 
    duration: presetDuration 
  } = confettiConfig[type];

  const finalParticleCount = particleCount ?? presetParticleCount;
  const finalColors = colors ?? presetColors;
  const finalDuration = duration ?? presetDuration;

  const [isActive, setIsActive] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      
      const timer = setTimeout(() => {
        setIsActive(false);
      }, finalDuration);
      
      return () => clearTimeout(timer);
    }
  }, [active, finalDuration]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      colors={finalColors}
      numberOfPieces={finalParticleCount}
      gravity={0.3}
      recycle={false}
      tweenDuration={finalDuration}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  );
}
