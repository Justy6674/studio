import React, { useState, useEffect } from 'react';

interface WaterGlassProps {
  currentIntake: number;
  goalIntake: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WaterGlass({ 
  currentIntake, 
  goalIntake, 
  size = 'lg', 
  className = '' 
}: WaterGlassProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [bubbles, setBubbles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);

  const fillPercentage = Math.min((currentIntake / goalIntake) * 100, 100);
  
  // Responsive sizing - much more compact
  const sizeMap = {
    sm: { glass: 120, percentage: 'text-2xl', container: 'space-y-2' },
    md: { glass: 160, percentage: 'text-3xl', container: 'space-y-3' },
    lg: { glass: 200, percentage: 'text-4xl sm:text-5xl', container: 'space-y-3' }
  };
  
  const { glass: glassSize, percentage: percentageClass, container: containerClass } = sizeMap[size];

  // Generate bubbles for animation
  useEffect(() => {
    if (fillPercentage > 0) {
      const newBubbles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60, // Keep bubbles within glass bounds
        y: 70 + Math.random() * 20, // Start from water area
        size: 3 + Math.random() * 4, // Bubble size 3-7px
        delay: Math.random() * 2 // Animation delay 0-2s
      }));
      setBubbles(newBubbles);
    }
  }, [fillPercentage]);

  // Trigger animation when water amount changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentIntake]);

  return (
    <div className={`flex flex-col items-center ${containerClass} ${className}`}>
      {/* Glass Container with subtle shadow */}
      <div 
        className="relative drop-shadow-lg"
        style={{ width: glassSize, height: glassSize }}
      >
        <svg
          width={glassSize}
          height={glassSize}
          viewBox={`0 0 ${glassSize} ${glassSize}`}
          className="filter drop-shadow-md"
        >
          {/* Glass Definition */}
          <defs>
            {/* Enhanced Water Gradient */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#2563eb" stopOpacity="1" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
            </linearGradient>
            
            {/* Glass gradient for depth */}
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1" />
            </linearGradient>

            {/* Bubble gradient */}
            <radialGradient id="bubbleGradient">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#bfdbfe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* Glass Body - Rounded bottom */}
          <path
            d={`M ${glassSize * 0.2} ${glassSize * 0.1} 
                L ${glassSize * 0.8} ${glassSize * 0.1}
                L ${glassSize * 0.75} ${glassSize * 0.85}
                Q ${glassSize * 0.75} ${glassSize * 0.95} ${glassSize * 0.65} ${glassSize * 0.95}
                L ${glassSize * 0.35} ${glassSize * 0.95}
                Q ${glassSize * 0.25} ${glassSize * 0.95} ${glassSize * 0.25} ${glassSize * 0.85}
                Z`}
            fill="url(#glassGradient)"
            stroke="#64748b"
            strokeWidth="2"
            className="glass-outline"
          />

          {/* Water Fill with improved masking */}
          {fillPercentage > 0 && (
            <g mask="url(#glassMask)">
              <defs>
                <mask id="glassMask">
                  <rect width={glassSize} height={glassSize} fill="black"/>
                  <path
                    d={`M ${glassSize * 0.2} ${glassSize * 0.1} 
                        L ${glassSize * 0.8} ${glassSize * 0.1}
                        L ${glassSize * 0.75} ${glassSize * 0.85}
                        Q ${glassSize * 0.75} ${glassSize * 0.95} ${glassSize * 0.65} ${glassSize * 0.95}
                        L ${glassSize * 0.35} ${glassSize * 0.95}
                        Q ${glassSize * 0.25} ${glassSize * 0.95} ${glassSize * 0.25} ${glassSize * 0.85}
                        Z`}
                    fill="white"
                  />
                </mask>
              </defs>
              
              {/* Water Rectangle */}
              <rect
                x={glassSize * 0.25}
                y={glassSize * (0.95 - (fillPercentage / 100) * 0.8)}
                width={glassSize * 0.5}
                height={glassSize * (fillPercentage / 100) * 0.8}
                fill="url(#waterGradient)"
                className={`transition-all duration-700 ease-out ${isAnimating ? 'animate-pulse' : ''}`}
                mask="url(#glassMask)"
              />

              {/* Animated Bubbles */}
              {bubbles.map((bubble) => (
                <circle
                  key={bubble.id}
                  cx={`${bubble.x}%`}
                  cy={`${bubble.y}%`}
                  r={bubble.size}
                  fill="url(#bubbleGradient)"
                  className="bubble-animation"
                  style={{
                    animation: `bubbleFloat 3s ease-in-out infinite`,
                    animationDelay: `${bubble.delay}s`
                  }}
                />
              ))}
            </g>
          )}

          {/* Glass Highlight for 3D effect */}
          <ellipse
            cx={glassSize * 0.35}
            cy={glassSize * 0.25}
            rx={glassSize * 0.08}
            ry={glassSize * 0.15}
            fill="rgba(255,255,255,0.3)"
            className="glass-highlight"
          />
        </svg>

        {/* Centered Percentage - Properly sized */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${percentageClass} font-black text-white drop-shadow-2xl transition-all duration-500 ${isAnimating ? "scale-110 text-blue-200" : ""}`}>
              {Math.round(fillPercentage)}%
            </div>
          </div>
        </div>
      </div>

      {/* Compact Progress Display */}
      <div className="text-center w-full max-w-xs">
        {/* Current vs Goal - More compact */}
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <span className="text-lg sm:text-xl font-bold text-hydration-400">
            {currentIntake}ml
          </span>
          <span className="text-sm text-slate-400">of</span>
          <span className="text-base sm:text-lg font-semibold text-slate-300">
            {goalIntake}ml
          </span>
        </div>

        {/* Progress Bar - Compact */}
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-hydration-400 to-hydration-500 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>

        {/* Status Message - Compact */}
        <div className="text-xs text-slate-400 mt-1">
          {fillPercentage >= 100 ? "Goal Complete! 🎉" : 
           fillPercentage >= 50 ? "Halfway there! 💪" : 
           "Keep going! 💧"}
        </div>
      </div>

      <style jsx>{`
        @keyframes bubbleFloat {
          0% {
            transform: translateY(0px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px);
            opacity: 0;
          }
        }
        
        .bubble-animation {
          animation: bubbleFloat 3s ease-in-out infinite;
        }
        
        .glass-outline {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .glass-highlight {
          filter: blur(1px);
        }
      `}</style>
    </div>
  );
}
