"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getHydrationLogs } from "@/lib/hydration";
import type { HydrationLog } from "@/lib/types";
import { format, startOfDay, subDays, isToday, isYesterday } from "date-fns";
import { Calendar, Droplets, TrendingUp, Award, Filter } from "lucide-react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  consumed: {
    label: "Consumed (ml)",
    color: "#5271ff",
  },
  goal: {
    label: "Goal (ml)", 
    color: "#b68a71",
  },
} satisfies ChartConfig;

export default function HistoryPage() {
  const { user, userProfile } = useAuth();
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const hydrationGoal = userProfile?.hydrationGoal || 2000;

  useEffect(() => {
    if (user) {
      loadHydrationHistory();
    }
  }, [user, viewMode]);

  const loadHydrationHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const logs = await getHydrationLogs();
      // Filter logs based on viewMode
      const days = viewMode === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredLogs = logs.filter(log => 
        log.timestamp.getTime() >= cutoffDate.getTime()
      );
      
      setHydrationLogs(filteredLogs);
    } catch (error) {
      console.error("Error loading hydration history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group logs by day
  const groupedLogs = hydrationLogs.reduce((acc, log) => {
    const dayKey = format(log.timestamp, 'yyyy-MM-dd');
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(log);
    return acc;
  }, {} as Record<string, HydrationLog[]>);

  // Calculate day summaries
  const daySummaries = Object.entries(groupedLogs).map(([dateStr, logs]) => {
    const date = new Date(dateStr);
    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const goalPercentage = Math.round((totalIntake / hydrationGoal) * 100);
    
    return {
      date,
      dateStr,
      logs,
      totalIntake,
      goalPercentage,
      logsCount: logs.length,
    };
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // Chart data for the past week/month
  const chartData = daySummaries.slice(0, viewMode === 'week' ? 7 : 30).reverse().map(day => ({
    date: format(day.date, 'MMM dd'),
    consumed: day.totalIntake,
    goal: hydrationGoal,
  }));

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'EEEE, MMM d');
  };

  const getGoalStatus = (percentage: number) => {
    if (percentage >= 100) return { label: "Excellent", color: "bg-green-500" };
    if (percentage >= 75) return { label: "Good", color: "bg-blue-500" };
    if (percentage >= 50) return { label: "Fair", color: "bg-yellow-500" };
    return { label: "Needs Work", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hydration History</h1>
          <p className="text-muted-foreground">Track your hydration journey over time</p>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Hydration History
          </h1>
          <p className="text-muted-foreground">Track your hydration journey over time</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            onClick={() => setViewMode('week')}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
            size="sm"
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hydration Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Bar dataKey="consumed" fill="#5271ff" radius={4} />
                <Bar dataKey="goal" fill="#b68a71" opacity={0.3} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Daily History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daily History</h2>
        
        {daySummaries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No History Yet</h3>
              <p className="text-muted-foreground">Start logging your water intake to see your history here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {daySummaries.map((day) => {
              const status = getGoalStatus(day.goalPercentage);
              
              return (
                <Card key={day.dateStr} className="transition-colors hover:bg-accent/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{formatDateLabel(day.date)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(day.date, 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <Badge className={`${status.color} text-white`}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Intake</p>
                        <p className="text-lg font-semibold">{day.totalIntake}ml</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Goal Progress</p>
                        <p className="text-lg font-semibold">{day.goalPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Logs</p>
                        <p className="text-lg font-semibold">{day.logsCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className="text-lg font-semibold">
                          {Math.round(day.totalIntake / day.logsCount)}ml
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status.color}`}
                        style={{ width: `${Math.min(day.goalPercentage, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 