import React, { useState, useEffect } from 'react';

interface WaterGlassProps {
  currentIntake: number;
  goalIntake: number;
  size?: number;
  triggerAnimation?: boolean;
}

export function WaterGlass({ currentIntake, goalIntake, size = 320, triggerAnimation = false }: WaterGlassProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBubbles, setShowBubbles] = useState(false);
  const [finalSize, setFinalSize] = useState(size);
  const fillPercentage = Math.min((currentIntake / goalIntake) * 100, 100);
  
  const glassHeight = finalSize * 0.8;
  const glassWidth = finalSize * 0.5;
  const fillHeight = (fillPercentage / 100) * glassHeight * 0.85;

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        const responsiveSize = Math.min(size, window.innerWidth * 0.7);
        setFinalSize(Math.max(responsiveSize, 240)); // Minimum size for mobile
      }
    };
    
    updateSize();
    window?.addEventListener('resize', updateSize);
    return () => window?.removeEventListener('resize', updateSize);
  }, [size]);

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

  // Generate more bubbles for larger glass
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: finalSize * (0.35 + Math.random() * 0.3),
    delay: i * 0.15,
    size: 3 + Math.random() * 4,
  }));

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: finalSize, height: finalSize }}>
        <svg
          width={finalSize}
          height={finalSize}
          viewBox={`0 0 ${finalSize} ${finalSize}`}
          className="drop-shadow-2xl"
        >
          {/* Definitions for gradients and animations */}
          <defs>
            {/* Enhanced water gradient for larger display */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
              <stop offset="30%" stopColor="rgba(14, 165, 233, 0.85)" />
              <stop offset="70%" stopColor="rgba(6, 182, 212, 0.8)" />
              <stop offset="100%" stopColor="rgba(56, 178, 172, 0.9)" />
            </linearGradient>
            
            {/* Glass clip path */}
            <clipPath id="glassClip">
              <path
                d={`M ${finalSize * 0.25} ${finalSize * 0.1} 
                    L ${finalSize * 0.75} ${finalSize * 0.1}
                    L ${finalSize * 0.7} ${finalSize * 0.9}
                    L ${finalSize * 0.3} ${finalSize * 0.9}
                    Z`}
              />
            </clipPath>
          </defs>

          {/* Glass container with enhanced styling */}
          <path
            d={`M ${finalSize * 0.25} ${finalSize * 0.1} 
                L ${finalSize * 0.75} ${finalSize * 0.1}
                L ${finalSize * 0.7} ${finalSize * 0.9}
                L ${finalSize * 0.3} ${finalSize * 0.9}
                Z`}
            fill="rgba(148, 163, 184, 0.08)"
            stroke="rgba(148, 163, 184, 0.4)"
            strokeWidth="3"
            className="drop-shadow-lg"
          />
          
          {/* Water fill with smooth transition */}
          {fillPercentage > 0 && (
            <rect
              x={finalSize * 0.25}
              y={finalSize * 0.9 - (fillHeight / glassHeight) * (finalSize * 0.8)}
              width={glassWidth}
              height={(fillHeight / glassHeight) * (finalSize * 0.8)}
              fill="url(#waterGradient)"
              clipPath="url(#glassClip)"
              className="transition-all duration-1000 ease-out"
            />
          )}
          
          {/* Enhanced glass rim */}
          <ellipse
            cx={finalSize * 0.5}
            cy={finalSize * 0.1}
            rx={glassWidth * 0.5}
            ry={finalSize * 0.03}
            fill="rgba(148, 163, 184, 0.15)"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth="2"
          />
          
          {/* Water surface with enhanced wave effect */}
          {fillPercentage > 0 && (
            <g>
              <ellipse
                cx={finalSize * 0.5}
                cy={finalSize * 0.9 - (fillHeight / glassHeight) * (finalSize * 0.8)}
                rx={glassWidth * 0.45}
                ry={finalSize * 0.02}
                fill="rgba(14, 165, 233, 0.7)"
                className={`transition-all duration-1000 ease-out ${isAnimating ? 'animate-pulse' : ''}`}
              />
              
              {/* Enhanced gentle wave ripples during animation */}
              {isAnimating && (
                <g>
                  <ellipse
                    cx={finalSize * 0.5}
                    cy={finalSize * 0.9 - (fillHeight / glassHeight) * (finalSize * 0.8)}
                    rx={glassWidth * 0.3}
                    ry={finalSize * 0.015}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="2"
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
                      values="0; 0.7; 0"
                      dur="1.5s"
                      repeatCount="1"
                    />
                  </ellipse>
                  
                  <ellipse
                    cx={finalSize * 0.5}
                    cy={finalSize * 0.9 - (fillHeight / glassHeight) * (finalSize * 0.8)}
                    rx={glassWidth * 0.35}
                    ry={finalSize * 0.01}
                    fill="none"
                    stroke="rgba(14, 165, 233, 0.4)"
                    strokeWidth="1.5"
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
                      values="0; 0.5; 0"
                      dur="1.5s"
                      begin="0.3s"
                      repeatCount="1"
                    />
                  </ellipse>
                </g>
              )}
            </g>
          )}

          {/* Enhanced bubbles animation */}
          {showBubbles && fillPercentage > 0 && (
            <g>
              {bubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={bubble.x}
                  cy={finalSize * 0.85}
                  r={bubble.size}
                  fill="rgba(255, 255, 255, 0.7)"
                  opacity="0"
                >
                  <animate
                    attributeName="cy"
                    values={`${finalSize * 0.85}; ${finalSize * 0.9 - (fillHeight / glassHeight) * (finalSize * 0.8)}`}
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 0.9; 0.7; 0"
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                  <animate
                    attributeName="r"
                    values={`${bubble.size}; ${bubble.size * 1.8}; ${bubble.size * 0.3}`}
                    dur="2s"
                    begin={`${bubble.delay}s`}
                    repeatCount="1"
                  />
                </circle>
              ))}
            </g>
          )}
        </svg>
        
        {/* Larger percentage display for bigger glass */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-4xl md:text-5xl font-bold text-white drop-shadow-2xl transition-all duration-500 ${isAnimating ? "scale-110 text-blue-300" : ""}`}>
              {Math.round(fillPercentage)}%
            </div>
          </div>
        </div>

        {/* Enhanced success animation overlay */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl opacity-0 animate-bounce">💧
              <div className="animate-ping absolute inset-0 text-6xl">💧</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress Display - Mobile Optimized */}
      <div className="text-center space-y-2 w-full max-w-sm">
        {/* Current vs Goal */}
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <span className="text-xl md:text-2xl font-bold text-hydration-400">
            {currentIntake}ml
          </span>
          <span className="text-sm md:text-base text-slate-400">of</span>
          <span className="text-lg md:text-xl font-semibold text-slate-300">
            {goalIntake}ml
          </span>
        </div>
        
        {/* Percentage */}
        <div className="text-2xl md:text-3xl font-bold text-slate-200">
          {fillPercentage.toFixed(0)}%
        </div>
        
        {/* Remaining */}
        {fillPercentage < 100 && (
          <div className="text-xs md:text-sm text-slate-400">
            {goalIntake - currentIntake}ml remaining
          </div>
        )}
        
        {/* Goal achieved */}
        {fillPercentage >= 100 && (
          <div className="text-xs md:text-sm text-green-400 font-medium">
            🎉 Daily goal achieved!
          </div>
        )}
      </div>
    </div>
  );
}
