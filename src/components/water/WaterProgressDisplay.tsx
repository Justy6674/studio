"use client";

import { WaterRing } from "./WaterRing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target } from "lucide-react";

interface WaterProgressDisplayProps {
  currentIntake: number; // in ml
  goalIntake: number; // in ml
}

export function WaterProgressDisplay({ currentIntake, goalIntake }: WaterProgressDisplayProps) {
  const progressPercentage = goalIntake > 0 ? Math.min((currentIntake / goalIntake) * 100, 100) : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Target className="h-7 w-7 text-primary"/>
          Today's Progress
        </CardTitle>
        <CardDescription>You're doing great! Keep it up.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <WaterRing progress={progressPercentage} size={180} strokeWidth={14} />
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">
            {currentIntake.toLocaleString()}<span className="text-lg text-muted-foreground">ml</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Goal: {goalIntake.toLocaleString()}ml
          </p>
        </div>
         {currentIntake >= goalIntake && (
          <p className="text-center text-lg font-semibold text-green-500">
            🎉 Goal Achieved! 🎉
          </p>
        )}
      </CardContent>
    </Card>
  );
}
