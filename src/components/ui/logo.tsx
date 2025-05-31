'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Droplets } from 'lucide-react';

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
  const [imageError, setImageError] = useState(false);

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} relative rounded-xl overflow-hidden border-2 border-hydration-400 shadow-lg bg-hydration-500/10`}>
        {!imageError ? (
          <Image
            src="/Logo (1).png"
            alt="Water4WeightLoss Logo"
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 32px, (max-width: 1200px) 48px, 64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-hydration-500">
            <Droplets className="w-1/2 h-1/2 text-white" />
          </div>
        )}
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