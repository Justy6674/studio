import React from 'react';

interface WaterGlassProps {
  currentIntake: number;
  goalIntake: number;
  size?: number;
}

export function WaterGlass({ currentIntake, goalIntake, size = 240 }: WaterGlassProps) {
  const percentage = goalIntake > 0 ? Math.min((currentIntake / goalIntake) * 100, 100) : 0;
  const waterHeight = (percentage / 100) * (size * 0.7); // 70% of glass height for water

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glass Container */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
        >
          {/* Glass outline */}
          <path
            d={`M ${size * 0.25} ${size * 0.15} 
                L ${size * 0.75} ${size * 0.15}
                L ${size * 0.7} ${size * 0.85}
                L ${size * 0.3} ${size * 0.85} Z`}
            fill="none"
            stroke="rgba(148, 163, 184, 0.6)"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Water fill */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="1" />
            </linearGradient>
            <clipPath id="glassClip">
              <path
                d={`M ${size * 0.25} ${size * 0.15} 
                    L ${size * 0.75} ${size * 0.15}
                    L ${size * 0.7} ${size * 0.85}
                    L ${size * 0.3} ${size * 0.85} Z`}
              />
            </clipPath>
          </defs>

          {waterHeight > 0 && (
            <rect
              x={size * 0.25}
              y={size * 0.85 - waterHeight}
              width={size * 0.5}
              height={waterHeight}
              fill="url(#waterGradient)"
              clipPath="url(#glassClip)"
              className="transition-all duration-1000 ease-out"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,2; 0,-2; 0,2"
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>
          )}

          {/* Water surface waves */}
          {waterHeight > 5 && (
            <path
              d={`M ${size * 0.25} ${size * 0.85 - waterHeight}
                  Q ${size * 0.35} ${size * 0.85 - waterHeight - 3}
                    ${size * 0.45} ${size * 0.85 - waterHeight}
                  Q ${size * 0.55} ${size * 0.85 - waterHeight + 3}
                    ${size * 0.65} ${size * 0.85 - waterHeight}
                  Q ${size * 0.7} ${size * 0.85 - waterHeight - 2}
                    ${size * 0.75} ${size * 0.85 - waterHeight}`}
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}

          {/* Measurement marks */}
          {[25, 50, 75].map((mark) => (
            <g key={mark}>
              <line
                x1={size * 0.75 + 5}
                y1={size * 0.85 - (mark / 100) * (size * 0.7)}
                x2={size * 0.75 + 15}
                y2={size * 0.85 - (mark / 100) * (size * 0.7)}
                stroke="rgba(148, 163, 184, 0.5)"
                strokeWidth="1"
              />
              <text
                x={size * 0.75 + 20}
                y={size * 0.85 - (mark / 100) * (size * 0.7) + 4}
                fontSize="10"
                fill="rgba(148, 163, 184, 0.7)"
                className="text-xs"
              >
                {mark}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Stats Display */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-blue-400">
          {Math.round(percentage)}%
        </div>
        <div className="text-lg text-slate-300">
          {currentIntake.toLocaleString()}ml
        </div>
        <div className="text-sm text-slate-400">
          Goal: {goalIntake.toLocaleString()}ml
        </div>
      </div>
    </div>
  );
}