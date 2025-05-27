
"use client";

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, initialLoading } = useAuthContext();
  
  // Show loading screen while checking auth
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show welcome back screen
  if (user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">
              💧 Welcome Back!
            </h1>
            <p className="text-slate-400 text-lg">
              Hello {user.name || user.email?.split('@')[0] || 'there'}
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-2">
              Ready to track your hydration?
            </h2>
            <p className="text-slate-300 mb-4">
              Continue your water journey and maintain your healthy habits.
            </p>
            <Link 
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show welcome/signup screen
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            💧 Welcome to Water4WeightLoss
          </h1>
          <p className="text-slate-400 text-lg">
            Track your hydration and achieve your health goals
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-2">
            Start Your Journey
          </h2>
          <p className="text-slate-300 mb-6">
            Join thousands who are improving their health through better hydration habits.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Sign Up
            </Link>
            <Link 
              href="/login"
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
