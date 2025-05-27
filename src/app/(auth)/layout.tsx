
"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Auth Container */}
      <div className="relative w-full max-w-md">
        {/* Header with Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image
                src="/logo-128.png"
                alt="Water4WeightLoss"
                width={80}
                height={80}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Water4WeightLoss
          </h1>
          <p className="text-slate-400 text-lg">HydrateAI - Your Aussie Hydration Companion</p>
          
          {/* Animated Water Droplets */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {children}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Built with ❤️ for healthy hydration habits in Australia</p>
          <p className="mt-2">🇦🇺 Proudly supporting Aussie wellness journeys</p>
        </div>
      </div>
    </div>
  );
}
