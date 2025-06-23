"use client";

import type { SVGProps } from "react";

interface WaterRingProps extends SVGProps<SVGSVGElement> {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export function WaterRing({ progress, size = 120, strokeWidth = 10, className, ...props }: WaterRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`w-full h-full ${className || ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      {...props}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="text-secondary/50 dark:text-secondary/30" // Track color
        fill="transparent"
        stroke="currentColor"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="text-primary" // Progress color
        fill="transparent"
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.35s ease-out" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="text-2xl font-bold fill-current text-foreground"
      >
        {`${Math.round(progress)}%`}
      </text>
    </svg>
  );
}
