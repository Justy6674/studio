'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface InteractiveGlassProps {
  dailyGoal: number; // in ml
  currentIntake: number; // in ml
  onIntakeChange?: (newIntake: number) => void;
}

export function InteractiveGlass({
  dailyGoal = 2000,
  currentIntake = 0,
  onIntakeChange
}: InteractiveGlassProps) {
  const [intake, setIntake] = useState(currentIntake);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const percentage = Math.min((intake / dailyGoal) * 100, 100);
  const fillHeight = Math.min(percentage, 100);
  
  useEffect(() => {
    setIntake(currentIntake);
  }, [currentIntake]);

  const addWater = (amount: number) => {
    setIsAnimating(true);
    const newIntake = Math.max(0, intake + amount);
    setIntake(newIntake);
    onIntakeChange?.(newIntake);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const resetIntake = () => {
    setIsAnimating(true);
    setIntake(0);
    onIntakeChange?.(0);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Card className="bg-slate-700 border-brown-500/30 p-6">
      <CardContent className="p-0">
        <div className="flex flex-col items-center space-y-6">
          {/* Glass SVG */}
          <div className="relative">
            <svg
              width="120"
              height="160"
              viewBox="0 0 120 160"
              className="drop-shadow-lg"
            >
              {/* Glass outline */}
              <path
                d="M30 20 L90 20 L85 140 Q85 150 75 150 L45 150 Q35 150 35 140 Z"
                fill="none"
                stroke="#b68a71" // brown-500 - warm brown
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              
              {/* Water fill */}
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#5271ff" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#6b82ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7bb8ff" stopOpacity="0.7" />
                </linearGradient>
                
                <clipPath id="glassClip">
                  <path d="M32 22 L88 22 L83 138 Q83 148 73 148 L47 148 Q37 148 37 138 Z" />
                </clipPath>
              </defs>
              
              <motion.rect
                x="32"
                y={22 + (126 * (100 - fillHeight) / 100)}
                width="56"
                height={126 * fillHeight / 100}
                fill="url(#waterGradient)"
                clipPath="url(#glassClip)"
                initial={{ y: 148 }}
                animate={{ 
                  y: 22 + (126 * (100 - fillHeight) / 100),
                  height: 126 * fillHeight / 100
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              
              {/* Water surface animation */}
              {fillHeight > 0 && (
                <motion.ellipse
                  cx="60"
                  cy={22 + (126 * (100 - fillHeight) / 100)}
                  rx="26"
                  ry="3"
                  fill="#5271ff"
                  opacity="0.6"
                  animate={{
                    cy: 22 + (126 * (100 - fillHeight) / 100),
                    scaleX: [1, 1.05, 1],
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{
                    scaleX: { duration: 2, repeat: Infinity },
                    opacity: { duration: 2, repeat: Infinity }
                  }}
                />
              )}
              
              {/* Measurement lines */}
              {[25, 50, 75].map((mark) => (
                <g key={mark}>
                  <line
                    x1="88"
                    y1={22 + (126 * (100 - mark) / 100)}
                    x2="92"
                    y2={22 + (126 * (100 - mark) / 100)}
                    stroke="#b68a71"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <text
                    x="96"
                    y={22 + (126 * (100 - mark) / 100) + 3}
                    fontSize="8"
                    fill="#b68a71"
                    opacity="0.8"
                  >
                    {mark}%
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Ripple effect on interaction */}
            {isAnimating && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-hydration-400"
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}
          </div>
          
          {/* Stats */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-white">
              {intake.toLocaleString()} ml
            </div>
            <div className="text-brown-300">
              of {dailyGoal.toLocaleString()} ml goal
            </div>
            <div className="text-lg text-hydration-400 font-semibold">
              {percentage.toFixed(1)}% Complete
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => addWater(-250)}
              variant="outline"
              size="sm"
              className="border-brown-500 text-brown-300 hover:bg-brown-500 hover:text-white"
              disabled={intake <= 0}
            >
              <Minus className="w-4 h-4" />
              250ml
            </Button>
            
            <Button
              onClick={() => addWater(250)}
              size="sm"
              className="bg-hydration-400 hover:bg-hydration-500 text-white"
            >
              <Plus className="w-4 h-4" />
              250ml
            </Button>
            
            <Button
              onClick={resetIntake}
              variant="outline"
              size="sm"
              className="border-brown-500 text-brown-300 hover:bg-brown-500 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick add buttons */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {[500, 750, 1000].map((amount) => (
              <Button
                key={amount}
                onClick={() => addWater(amount)}
                variant="ghost"
                size="sm"
                className="text-cream-300 hover:bg-slate-600 hover:text-white"
              >
                +{amount}ml
              </Button>
            ))}
          </div>
          
          {/* Progress indicator */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-brown-300 mb-1">
              <span>Today&apos;s Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-hydration-400 to-hydration-300 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${fillHeight}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 