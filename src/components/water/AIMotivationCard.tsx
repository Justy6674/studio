'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIMotivationCardProps {
  currentHydration: number;
  goal: number;
}

export function AIMotivationCard({ currentHydration, goal }: AIMotivationCardProps) {
  const [motivation, setMotivation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateMotivation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentHydration,
          goal,
          percentage: Math.round((currentHydration / goal) * 100),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMotivation(data.motivation);
      } else {
        setMotivation('Keep up the great work with your hydration! Every sip counts! 💧');
      }
    } catch (error) {
      console.error('Failed to generate motivation:', error);
      setMotivation('Stay hydrated and keep pushing towards your goal! You\'ve got this! 🌊');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateMotivation();
  }, [currentHydration, goal]);

  return (
    <Card className="bg-gradient-to-br from-water-50 to-cream-50 border-water-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-water-700">
          <Sparkles className="h-5 w-5" />
          AI Hydration Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating motivation...
              </span>
            ) : (
              motivation || 'Stay hydrated! Your body will thank you! 💧'
            )}
          </p>
          <Button
            onClick={generateMotivation}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Get New Motivation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}