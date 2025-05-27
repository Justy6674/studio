
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { WaterProgressDisplay } from "@/components/water/WaterProgressDisplay";
import { StreakDisplay } from "@/components/water/StreakDisplay";
import { AIMotivationCard } from "@/components/water/AIMotivationCard";
import { getHydrationLogs, getAIMotivation } from "@/app/actions/hydration";
import type { HydrationLog, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, CalendarDays, Terminal, Droplets, Target, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";

interface DailyLogSummary {
  date: string; // YYYY-MM-DD
  totalAmount: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading, updateUserProfileData } = useAuth();
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMotivation, setLoadingMotivation] = useState(true);

  const hydrationGoal = user?.hydrationGoal || 2000;
  const dailyStreak = user?.dailyStreak || 0;
  const longestStreak = user?.longestStreak || 0;

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const logs = await getHydrationLogs(user.uid);
      setHydrationLogs(logs);

      const todayStart = startOfDay(new Date());
      const todayLogs = logs.filter(log => isSameDay(log.timestamp, todayStart));
      const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setCurrentIntake(todayIntake);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  const fetchMotivation = useCallback(async () => {
    if (!user) return;
    setLoadingMotivation(true);
    try {
      const motivation = await getAIMotivation(user.uid, hydrationGoal);
      setAiMotivation(motivation);
    } catch (error) {
      console.error("Error fetching AI motivation:", error);
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, hydrationGoal]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchMotivation();
    }
  }, [user, fetchDashboardData, fetchMotivation]);

  // Recalculate current intake when logs change (after new log added)
   useEffect(() => {
    const todayStart = startOfDay(new Date());
    const todayLogs = hydrationLogs.filter(log => isSameDay(log.timestamp, todayStart));
    const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
    setCurrentIntake(todayIntake);
  }, [hydrationLogs]);

  const getWeeklyChartData = () => {
    const today = new Date();
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });

    return last7Days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const logsForDay = hydrationLogs.filter(log => format(log.timestamp, "yyyy-MM-dd") === dateStr);
      const totalAmount = logsForDay.reduce((sum, log) => sum + log.amount, 0);
      return {
        date: format(day, "MMM d"), // For X-axis label
        water: totalAmount,
        goal: hydrationGoal,
      };
    });
  };
  const weeklyChartData = getWeeklyChartData();
  const chartConfig = {
    water: { label: "Water Intake (ml)", color: "#5271ff" },
    goal: { label: "Goal (ml)", color: "#b68a71" },
  };

  if (authLoading || (loadingData && !user)) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96 bg-slate-800" />
            <Skeleton className="h-6 w-80 bg-slate-800" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-96 bg-slate-800 rounded-xl" />
            <Skeleton className="h-96 bg-slate-800 rounded-xl" />
            <Skeleton className="h-96 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <Alert className="max-w-md bg-slate-800 border-slate-700">
          <Terminal className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-slate-200">Not Logged In</AlertTitle>
          <AlertDescription className="text-slate-400">Please log in to view your dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const progressPercentage = hydrationGoal > 0 ? Math.min((currentIntake / hydrationGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Welcome back, {user.name || "User"}
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Track your hydration journey and stay motivated</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-blue-400" />
                </div>
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-100">
                  {currentIntake.toLocaleString()}
                  <span className="text-lg text-slate-400 ml-1">ml</span>
                </span>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Goal</div>
                  <div className="text-slate-300">{hydrationGoal.toLocaleString()}ml</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              {currentIntake >= hydrationGoal && (
                <div className="text-center py-2">
                  <span className="text-green-400 font-semibold">🎉 Goal Achieved! 🎉</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-orange-400" />
                </div>
                Streak Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{dailyStreak}</div>
                  <div className="text-sm text-slate-400">Current</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-300">{longestStreak}</div>
                  <div className="text-sm text-slate-400">Best</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="text-center text-slate-400 text-sm">
                  Keep it up! Every drop counts.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Log Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Droplets className="h-6 w-6 text-cyan-400" />
                </div>
                Quick Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogWaterForm onLogSuccess={fetchDashboardData} />
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Chart */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                Weekly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <RechartsBarChart 
                    data={weeklyChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent className="bg-slate-700 border-slate-600" />} 
                    />
                    <Bar dataKey="water" fill="#5271ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="goal" fill="#b68a71" radius={[4, 4, 0, 0]} opacity={0.6} />
                  </RechartsBarChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Droplets className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Start logging water to see your progress!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Motivation */}
          <AIMotivationCard 
            motivation={aiMotivation} 
            isLoading={loadingMotivation} 
            onRefresh={fetchMotivation} 
          />
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-200">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CalendarDays className="h-6 w-6 text-green-400" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-700" />
                ))}
              </div>
            ) : hydrationLogs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {hydrationLogs.slice(0, 10).map((log, index) => (
                  <div 
                    key={log.id} 
                    className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="font-semibold text-slate-200">
                        {log.amount}ml
                      </span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {format(log.timestamp, "MMM d, 'at' h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Droplets className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No activity yet</p>
                <p className="text-slate-500 text-sm">Start your hydration journey by logging your first drink!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
