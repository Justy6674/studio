
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AIMotivationCardProps {
  currentIntake: number;
  goal: number;
  streak: number;
}

export function AIMotivationCard({ currentIntake, goal, streak }: AIMotivationCardProps) {
  const [motivation, setMotivation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const generateMotivation = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          currentIntake,
          goal,
          streak,
          preferences: user.preferences
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate motivation');
      }

      const data = await response.json();
      setMotivation(data.message);
    } catch (error) {
      console.error('Error generating motivation:', error);
      setMotivation("Stay hydrated! Every sip counts towards your health goal. 💧");
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.min((currentIntake / goal) * 100, 100);
  const needsMotivation = progressPercentage < 50 || streak === 0;

  return (
    <Card className="w-full bg-gradient-to-br from-water-50 to-cream-50 dark:from-water-900/20 dark:to-earth-900/20 border-water-200 dark:border-water-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-water-700 dark:text-water-300">
          <Sparkles className="h-5 w-5" />
          AI Hydration Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {motivation && (
          <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-water-200 dark:border-water-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {motivation}
            </p>
          </div>
        )}
        
        <Button 
          onClick={generateMotivation}
          disabled={isLoading}
          className="w-full bg-water-500 hover:bg-water-600 text-white"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Get AI Motivation
            </>
          )}
        </Button>

        {needsMotivation && !motivation && (
          <p className="text-xs text-muted-foreground text-center">
            Looking for some encouragement? Get personalized motivation from AI! 
          </p>
        )}
      </CardContent>
    </Card>
  );
}
