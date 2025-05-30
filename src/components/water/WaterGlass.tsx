import React, { useState, useEffect } from 'react';

interface WaterGlassProps {
  currentIntake: number;
  goalIntake: number;
  size?: number;
  triggerAnimation?: boolean;
}

export function WaterGlass({ currentIntake, goalIntake, size = 240, triggerAnimation = false }: WaterGlassProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const fillPercentage = Math.min((currentIntake / goalIntake) * 100, 100);
  const glassHeight = size * 0.8;
  const glassWidth = size * 0.5;
  const fillHeight = (fillPercentage / 100) * glassHeight * 0.85;

  useEffect(() => {
    if (triggerAnimation) {
      setIsAnimating(true);
      setShowBubbles(true);
      
      // Reset animation flags
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      const bubbleTimer = setTimeout(() => setShowBubbles(false), 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(bubbleTimer);
      };
    }
  }, [triggerAnimation]);

  // Generate bubble positions
  const bubbles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: size * (0.35 + Math.random() * 0.3),
    delay: i * 0.2,
    size: 2 + Math.random() * 3,
  }));

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-lg"
        >
          {/* Definitions for gradients and animations */}
          <defs>
            {/* Water gradient */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="50%" stopColor="rgba(14, 165, 233, 0.8)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.9)" />
            </linearGradient>
            
            {/* Wave animation */}
            <path id="wavePath" d={`M ${size * 0.25} ${size * 0.5} Q ${size * 0.375} ${size * 0.48} ${size * 0.5} ${size * 0.5} T ${size * 0.75} ${size * 0.5}`}>
              {isAnimating && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,-1; 0,0; -2,1; 0,0"
                  dur="1.5s"
                  repeatCount="1"
                />
              )}
            </path>
            
            {/* Glass clip path */}
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
          />
          
          {/* Water fill with smooth transition */}
          {fillPercentage > 0 && (
            <rect
              x={size * 0.25}
              y={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
              width={glassWidth}
              height={(fillHeight / glassHeight) * (size * 0.8)}
              fill="url(#waterGradient)"
              clipPath="url(#glassClip)"
              className="transition-all duration-700 ease-out"
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
          
          {/* Water surface with gentle wave effect */}
          {fillPercentage > 0 && (
            <g>
              <ellipse
                cx={size * 0.5}
                cy={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
                rx={glassWidth * 0.45}
                ry={size * 0.02}
                fill="rgba(14, 165, 233, 0.6)"
                className={`transition-all duration-700 ease-out ${isAnimating ? 'animate-pulse' : ''}`}
              />
              
              {/* Gentle wave ripples during animation */}
              {isAnimating && (
                <g>
                  <ellipse
                    cx={size * 0.5}
                    cy={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
                    rx={glassWidth * 0.3}
                    ry={size * 0.015}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth="1"
                    opacity="0"
                  >
                    <animate
                      attributeName="rx"
                      values={`${glassWidth * 0.3}; ${glassWidth * 0.45}; ${glassWidth * 0.3}`}
                      dur="1.5s"
                      repeatCount="1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0.6; 0"
                      dur="1.5s"
                      repeatCount="1"
                    />
                  </ellipse>
                  
                  <ellipse
                    cx={size * 0.5}
                    cy={size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}
                    rx={glassWidth * 0.35}
                    ry={size * 0.01}
                    fill="none"
                    stroke="rgba(14, 165, 233, 0.3)"
                    strokeWidth="1"
                    opacity="0"
                  >
                    <animate
                      attributeName="rx"
                      values={`${glassWidth * 0.35}; ${glassWidth * 0.5}; ${glassWidth * 0.35}`}
                      dur="1.5s"
                      begin="0.3s"
                      repeatCount="1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 0.4; 0"
                      dur="1.5s"
                      begin="0.3s"
                      repeatCount="1"
                    />
                  </ellipse>
                </g>
              )}
            </g>
          )}

          {/* Bubbles animation */}
          {showBubbles && fillPercentage > 0 && (
            <g>
              {bubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={bubble.x}
                  cy={size * 0.85}
                  r={bubble.size}
                  fill="rgba(255, 255, 255, 0.6)"
                  opacity="0"
                >
                  <animate
                    attributeName="cy"
                    values={`${size * 0.85}; ${size * 0.9 - (fillHeight / glassHeight) * (size * 0.8)}`}
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 0.8; 0.6; 0"
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                  <animate
                    attributeName="r"
                    values={`${bubble.size}; ${bubble.size * 1.5}; ${bubble.size * 0.5}`}
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                </circle>
              ))}
            </g>
          )}
        </svg>
        
        {/* Percentage display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold text-white drop-shadow-lg transition-all duration-500 ${isAnimating ? "scale-110 text-blue-300" : ""}`}>
              {Math.round(fillPercentage)}%
            </div>
          </div>
        </div>

        {/* Success animation overlay */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-4xl opacity-0 animate-bounce">💧
              <div className="animate-ping absolute inset-0 text-4xl">💧</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats below glass */}
      <div className="text-center space-y-1">
        <div className={`text-lg font-semibold text-slate-200 transition-all duration-500 ${isAnimating ? "scale-105 text-hydration-400" : ""}`}>
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
