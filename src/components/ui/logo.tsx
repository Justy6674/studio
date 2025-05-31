'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};

export function Logo({ size = 'md', showText = true, href = '/', className = '' }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} relative rounded-xl overflow-hidden border-2 border-hydration-400 shadow-lg`}>
        <Image
          src="/logo.png"
          alt="Water4WeightLoss Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg text-hydration-400">Water4WeightLoss</span>
          <span className="text-xs text-brown-300">By Downscale</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
} 