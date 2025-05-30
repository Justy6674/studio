import React, { useState, useEffect } from 'react';

interface WaterGlassProps {
  currentIntake: number;
  goalIntake: number;
  size?: number;
  triggerAnimation?: boolean;
}

export function WaterGlass({ currentIntake, goalIntake, size = 240, triggerAnimation = false }: WaterGlassProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const fillPercentage = Math.min((currentIntake / goalIntake) * 100, 100);
  const glassHeight = size * 0.8;
  const glassWidth = size * 0.5;
  const fillHeight = (fillPercentage / 100) * glassHeight * 0.85;

  useEffect(() => {
    if (triggerAnimation) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [triggerAnimation]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-lg"
        >
          {/* Glass container */}
          <path
            d={`M ${size * 0.25} ${size * 0.1} 
                L ${size * 0.75} ${size * 0.1}
                L ${size * 0.7} ${size * 0.9}
                L ${size * 0.3} ${size * 0.9}
                Z`}
            fill="rgba(148, 163, 184, 0.1)"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth="2"
            className={isAnimating ? "animate-pulse" : ""}
          />
          
          {/* Water fill */}
          {fillPercentage > 0 && (
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="50%" stopColor="rgba(14, 165, 233, 0.8)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.9)" />
              </linearGradient>
              <clipPath id="glassClip">
                <path
                  d={`M ${size * 0.25} ${size * 0.1} 
                      L ${size * 0.75} ${size * 0.1}
                      L ${size * 0.7} ${size * 0.9}
                      L ${size * 0.3} ${size * 0.9}
                      Z`}
                />
              </clipPath>
            </defs>
          )}
          
          {fillPercentage > 0 && (
            <rect
              x={size * 0.25}
              y={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
              width={glassWidth}
              height={(fillHeight / glassHeight) * (size * 0.8)}
              fill="url(#waterGradient)"
              clipPath="url(#glassClip)"
              className={`transition-all duration-500 ${isAnimating ? "animate-bounce" : "animate-pulse"}`}
            />
          )}
          
          {/* Glass rim */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.1}
            rx={glassWidth * 0.5}
            ry={size * 0.03}
            fill="rgba(148, 163, 184, 0.2)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="1"
          />
          
          {/* Water surface */}
          {fillPercentage > 0 && (
            <ellipse
              cx={size * 0.5}
              cy={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
              rx={glassWidth * 0.45}
              ry={size * 0.02}
              fill="rgba(14, 165, 233, 0.6)"
              className={`transition-all duration-300 ${isAnimating ? "animate-ping" : "animate-pulse"}`}
            />
          )}

          {/* Ripple effect during animation */}
          {isAnimating && (
            <circle
              cx={size * 0.5}
              cy={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
              r={glassWidth * 0.2}
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2"
              className="animate-ping"
            />
          )}
        </svg>
        
        {/* Percentage display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold text-white drop-shadow-lg transition-all duration-300 ${isAnimating ? "scale-110" : ""}`}>
              {Math.round(fillPercentage)}%
            </div>
          </div>
        </div>

        {/* Sip animation overlay */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-4xl animate-bounce">💧</div>
          </div>
        )}
      </div>
      
      {/* Stats below glass */}
      <div className="text-center space-y-1">
        <div className={`text-lg font-semibold text-slate-200 transition-all duration-300 ${isAnimating ? "scale-105 text-hydration-400" : ""}`}>
          {currentIntake.toLocaleString()}ml
        </div>
        <div className="text-sm text-slate-400">
          Goal: {goalIntake.toLocaleString()}ml
        </div>
        {fillPercentage >= 100 && (
          <div className="text-sm font-medium text-green-400 animate-pulse">
            🎉 Goal Achieved!
          </div>
        )}
      </div>
    </div>
  );
}
