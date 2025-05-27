
"use client";

import { useEffect, useState } from "react";

interface WaterGlassProps {
  currentIntake: number; // in ml
  goalIntake: number; // in ml
  size?: number; // glass width/height
}

export function WaterGlass({ currentIntake, goalIntake, size = 200 }: WaterGlassProps) {
  const [animatedIntake, setAnimatedIntake] = useState(0);
  
  // Animate the water level when currentIntake changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedIntake(currentIntake);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIntake]);

  const progressPercentage = goalIntake > 0 ? Math.min((animatedIntake / goalIntake) * 100, 100) : 0;
  const waterHeight = (progressPercentage / 100) * (size * 0.7); // 70% of glass height available for water
  
  // Calculate measurement marks (every 500ml up to goal)
  const measurements = [];
  for (let i = 500; i <= goalIntake; i += 500) {
    const markHeight = ((goalIntake - i) / goalIntake) * (size * 0.7);
    measurements.push({
      amount: i,
      position: markHeight + (size * 0.15) // offset for glass top
    });
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Glass container */}
          <defs>
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
            </linearGradient>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          
          {/* Measurement marks and labels */}
          {measurements.map((mark, index) => (
            <g key={index}>
              {/* Measurement line */}
              <line
                x1={size * 0.15}
                y1={mark.position}
                x2={size * 0.25}
                y2={mark.position}
                stroke="#94a3b8"
                strokeWidth="1"
              />
              {/* Measurement text */}
              <text
                x={size * 0.05}
                y={mark.position + 4}
                fontSize="10"
                fill="#64748b"
                textAnchor="end"
              >
                {mark.amount}ml
              </text>
            </g>
          ))}
          
          {/* Glass outline - tapered cylinder */}
          <path
            d={`M ${size * 0.15} ${size * 0.15} 
                L ${size * 0.85} ${size * 0.15}
                L ${size * 0.8} ${size * 0.85}
                L ${size * 0.2} ${size * 0.85}
                Z`}
            fill="none"
            stroke="url(#glassGradient)"
            strokeWidth="2"
          />
          
          {/* Water fill */}
          <defs>
            <clipPath id="glassClip">
              <path
                d={`M ${size * 0.15} ${size * 0.15} 
                    L ${size * 0.85} ${size * 0.15}
                    L ${size * 0.8} ${size * 0.85}
                    L ${size * 0.2} ${size * 0.85}
                    Z`}
              />
            </clipPath>
          </defs>
          
          {waterHeight > 0 && (
            <g clipPath="url(#glassClip)">
              {/* Water body */}
              <rect
                x={size * 0.15}
                y={size * 0.85 - waterHeight}
                width={size * 0.7}
                height={waterHeight}
                fill="url(#waterGradient)"
                className="transition-all duration-1000 ease-out"
              />
              
              {/* Water surface with wave effect */}
              <path
                d={`M ${size * 0.15} ${size * 0.85 - waterHeight}
                    Q ${size * 0.35} ${size * 0.85 - waterHeight - 3}
                    ${size * 0.5} ${size * 0.85 - waterHeight}
                    Q ${size * 0.65} ${size * 0.85 - waterHeight + 3}
                    ${size * 0.85} ${size * 0.85 - waterHeight}
                    L ${size * 0.85} ${size * 0.85 - waterHeight + 5}
                    Q ${size * 0.65} ${size * 0.85 - waterHeight + 2}
                    ${size * 0.5} ${size * 0.85 - waterHeight + 5}
                    Q ${size * 0.35} ${size * 0.85 - waterHeight + 8}
                    ${size * 0.15} ${size * 0.85 - waterHeight + 5}
                    Z`}
                fill="#38bdf8"
                opacity="0.8"
                className="animate-pulse"
              />
              
              {/* Bubbles */}
              {progressPercentage > 10 && (
                <>
                  <circle
                    cx={size * 0.3}
                    cy={size * 0.85 - waterHeight * 0.3}
                    r="2"
                    fill="rgba(255,255,255,0.6)"
                    className="animate-bounce"
                  />
                  <circle
                    cx={size * 0.7}
                    cy={size * 0.85 - waterHeight * 0.6}
                    r="1.5"
                    fill="rgba(255,255,255,0.5)"
                    className="animate-pulse"
                  />
                </>
              )}
            </g>
          )}
          
          {/* Glass rim highlight */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.15}
            rx={size * 0.35}
            ry="4"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />
        </svg>
        
        {/* Current level indicator */}
        {currentIntake > 0 && (
          <div 
            className="absolute left-full ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
            style={{ 
              top: `${((goalIntake - currentIntake) / goalIntake) * (size * 0.7) + (size * 0.15)}px`,
              transform: 'translateY(-50%)'
            }}
          >
            {currentIntake}ml
          </div>
        )}
      </div>
      
      {/* Progress text */}
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-100">
          {progressPercentage.toFixed(1)}%
        </div>
        <div className="text-sm text-slate-400">
          {currentIntake.toLocaleString()}ml / {goalIntake.toLocaleString()}ml
        </div>
        {currentIntake >= goalIntake && (
          <div className="text-green-400 font-semibold mt-2">
            🎉 Goal Achieved! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
