"use client";

import { useMemo } from "react";
import { format, subDays, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import type { HydrationLog } from "@/lib/types";

interface TrendIndicatorProps {
  logs: HydrationLog[];
  goal: number;
  onClick?: () => void;
}

export function TrendIndicator({ logs, goal, onClick }: TrendIndicatorProps) {
  // Calculate week-over-week trends
  const trends = useMemo(() => {
    // Current week
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as start of week
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    // Last week
    const lastWeekStart = subWeeks(currentWeekStart, 1);
    const lastWeekEnd = subWeeks(currentWeekEnd, 1);
    
    // Filter logs for current and last week
    const currentWeekLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= currentWeekStart && logDate <= currentWeekEnd;
    });
    
    const lastWeekLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= lastWeekStart && logDate <= lastWeekEnd;
    });
    
    // Calculate totals and averages
    const currentWeekTotal = currentWeekLogs.reduce((sum, log) => sum + log.amount, 0);
    const lastWeekTotal = lastWeekLogs.reduce((sum, log) => sum + log.amount, 0);
    
    // Calculate daily averages (avoid divide by zero)
    const currentWeekDaysWithData = new Set(currentWeekLogs.map(log => 
      format(new Date(log.timestamp), 'yyyy-MM-dd')
    )).size;
    
    const lastWeekDaysWithData = new Set(lastWeekLogs.map(log => 
      format(new Date(log.timestamp), 'yyyy-MM-dd')
    )).size;
    
    const currentWeekAvg = currentWeekDaysWithData > 0 ? 
      currentWeekTotal / currentWeekDaysWithData : 0;
      
    const lastWeekAvg = lastWeekDaysWithData > 0 ? 
      lastWeekTotal / lastWeekDaysWithData : 0;
    
    // Calculate goal achievement
    const daysInCurrentWeek = Math.min(
      7, 
      eachDayOfInterval({
        start: currentWeekStart,
        end: now
      }).length
    );
    
    const currentWeekGoalTotal = goal * daysInCurrentWeek;
    const lastWeekGoalTotal = goal * 7; // always 7 days for last complete week
    
    const currentWeekGoalPercentage = currentWeekGoalTotal > 0 ? 
      (currentWeekTotal / currentWeekGoalTotal) * 100 : 0;
      
    const lastWeekGoalPercentage = lastWeekGoalTotal > 0 ? 
      (lastWeekTotal / lastWeekGoalTotal) * 100 : 0;
    
    // Calculate percentage changes
    const totalChange = lastWeekTotal > 0 ? 
      ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 
      (currentWeekTotal > 0 ? 100 : 0);
      
    const avgChange = lastWeekAvg > 0 ? 
      ((currentWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 
      (currentWeekAvg > 0 ? 100 : 0);
      
    const goalChange = lastWeekGoalPercentage > 0 ? 
      (currentWeekGoalPercentage - lastWeekGoalPercentage) : 
      (currentWeekGoalPercentage > 0 ? currentWeekGoalPercentage : 0);
    
    return {
      currentWeekTotal,
      lastWeekTotal,
      currentWeekAvg,
      lastWeekAvg,
      totalChange,
      avgChange,
      currentWeekGoalPercentage,
      lastWeekGoalPercentage,
      goalChange,
      daysTracked: {
        current: currentWeekDaysWithData,
        last: lastWeekDaysWithData
      }
    };
  }, [logs, goal]);

  // Helper function to determine color based on trend
  const getTrendColor = (change: number): string => {
    if (change > 5) return "text-green-500";
    if (change < -5) return "text-red-500";
    return "text-yellow-500";
  };

  // Helper function to get trend badge
  const getTrendBadge = (change: number) => {
    if (Math.abs(change) < 2) {
      return (
        <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-300">
          <Minus className="h-3 w-3 mr-1" />
          Stable
        </Badge>
      );
    } else if (change > 0) {
      return (
        <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-300">
          <TrendingUp className="h-3 w-3 mr-1" />
          {change.toFixed(0)}% ↑
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="ml-2 bg-red-50 text-red-800 border-red-300">
          <TrendingDown className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(0)}% ↓
        </Badge>
      );
    }
  };

  // No trend data available yet
  if (trends.daysTracked.last === 0) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Weekly Trends
            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
              New
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough data to show trends yet. Keep tracking for at least a week!
          </p>
          <div className="mt-4 flex justify-end">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Average</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {Math.round(trends.currentWeekAvg)}
                  <span className="text-sm font-normal text-muted-foreground">ml</span>
                </p>
                {getTrendBadge(trends.avgChange)}
              </div>
            </div>
            <div className={`flex flex-col items-end ${getTrendColor(trends.avgChange)}`}>
              {trends.avgChange > 0 ? (
                <ArrowUpRight className="h-8 w-8" />
              ) : (
                <ArrowDownRight className="h-8 w-8" />
              )}
              <span className="text-xs font-medium">vs last week</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Goal Achievement</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {Math.round(trends.currentWeekGoalPercentage)}
                  <span className="text-sm font-normal text-muted-foreground">%</span>
                </p>
                {getTrendBadge(trends.goalChange)}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <p className="text-xs text-muted-foreground flex justify-between">
              <span>Based on {trends.daysTracked.current} days this week</span>
              <span className="text-primary">View Details <ChevronRight className="inline h-3 w-3" /></span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
