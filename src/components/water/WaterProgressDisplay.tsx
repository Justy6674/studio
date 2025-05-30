"use client";

import { WaterRing } from "./WaterRing";
import { Progress } from "@/components/ui/progress";
import { Target, Droplets } from "lucide-react";

interface WaterProgressDisplayProps {
  currentIntake: number; // in ml
  goalIntake: number; // in ml
  percentage: number; // calculated percentage
}

export function WaterProgressDisplay({ currentIntake, goalIntake, percentage }: WaterProgressDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Progress Ring */}
      <div className="flex justify-center">
        <WaterRing progress={percentage} size={180} strokeWidth={12} />
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-slate-200">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>

      {/* Stats */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-slate-200">
          {currentIntake.toLocaleString()}<span className="text-lg text-slate-400 ml-1">ml</span>
        </div>
        <div className="text-sm text-slate-400">
          of {goalIntake.toLocaleString()}ml goal
        </div>
        
        {currentIntake >= goalIntake && (
          <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
            <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
              🎉 Goal Achieved! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
