"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Star } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
        <CardTitle className="text-2xl">Hydration Streaks</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">{currentStreak} {currentStreak === 1 ? "Day" : "Days"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold text-foreground">{longestStreak} {longestStreak === 1 ? "Day" : "Days"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
