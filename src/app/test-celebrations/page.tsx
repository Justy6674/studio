"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HydrationCelebration } from '@/components/celebrations/HydrationCelebration';

export default function TestCelebrationsPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'50%' | '100%'>('50%');
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Only allow access in development mode
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  const triggerCelebration = (type: '50%' | '100%') => {
    setCelebrationType(type);
    setShowCelebration(true);
  };

  // Redirect to home if not in development
  if (!isDevelopment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <Card className="bg-slate-800 border-red-400 shadow-2xl max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Page Not Available</h2>
            <p className="text-slate-300 mb-4">
              This page is only available in development mode.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">
              🎉 Celebration Animation Tester
            </CardTitle>
            <div className="text-center">
              <span className="inline-block bg-yellow-600 text-yellow-100 px-3 py-1 rounded-full text-sm">
                Development Only
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-slate-300">
              <p>Test the new gamified hydration celebrations!</p>
              <p className="text-sm mt-2">Click below to trigger different milestone animations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 50% Celebration Test */}
              <Card className="bg-slate-700 border-blue-400">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">50%</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Burst Animation</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Quick water droplet burst with blue confetti (~1 second)
                  </p>
                  <Button 
                    onClick={() => triggerCelebration('50%')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Test 50% Goal 🚀
                  </Button>
                </CardContent>
              </Card>

              {/* 100% Celebration Test */}
              <Card className="bg-slate-700 border-yellow-400">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">100%</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Full Celebration</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Epic confetti cannons with brand colors (~2.5 seconds)
                  </p>
                  <Button 
                    onClick={() => triggerCelebration('100%')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                  >
                    Test 100% Goal 🎉
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Animation Details */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-4">
                <h4 className="text-white font-semibold mb-3">🎨 Animation Features:</h4>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li>• <strong>50% Goal:</strong> Quick burst with blue water droplets</li>
                  <li>• <strong>100% Goal:</strong> Multi-stage confetti with brand colors</li>
                  <li>• <strong>Colors:</strong> Blue (#5271FF), Brown (#b68a71), Wheat (#F1E5A6)</li>
                  <li>• <strong>Performance:</strong> Optimized for mobile and desktop</li>
                  <li>• <strong>Non-blocking:</strong> Doesn&apos;t interfere with UI interactions</li>
                  <li>• <strong>Auto-dismiss:</strong> Celebrations automatically complete</li>
                </ul>
              </CardContent>
            </Card>

            {/* Back to Dashboard */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Celebration Component */}
      {showCelebration && (
        <HydrationCelebration
          type={celebrationType}
          currentAmount={celebrationType === '50%' ? 1000 : 2000}
          goalAmount={2000}
          userName="Demo User"
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
} 