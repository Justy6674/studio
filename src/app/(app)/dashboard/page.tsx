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
import { BarChart, CalendarDays, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
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
    water: { label: "Water Intake (ml)", color: "hsl(var(--primary))" },
    goal: { label: "Goal (ml)", color: "hsl(var(--muted))" },
  };


  if (authLoading || (loadingData && !user)) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg md:col-span-2 lg:col-span-1" />
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
       <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Not Logged In</AlertTitle>
        <AlertDescription>Please log in to view your dashboard.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {user.name || "User"}!</h1>
        <p className="text-muted-foreground">Here's your hydration overview for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-1">
           <LogWaterForm onLogSuccess={fetchDashboardData} />
        </div>
        <WaterProgressDisplay currentIntake={currentIntake} goalIntake={hydrationGoal} />
        <StreakDisplay currentStreak={dailyStreak} longestStreak={longestStreak} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AIMotivationCard 
            motivation={aiMotivation} 
            isLoading={loadingMotivation} 
            onRefresh={fetchMotivation} 
        />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart className="h-7 w-7 text-primary" />
              Weekly Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <RechartsBarChart data={weeklyChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="water" fill="var(--color-water)" radius={4} />
                <Bar dataKey="goal" fill="var(--color-goal)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Log some water to see your weekly chart!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-2xl">
              <CalendarDays className="h-7 w-7 text-primary" />
              Recent Logs (Max 10 shown)
            </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
             <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
          ) : hydrationLogs.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {hydrationLogs.slice(0,10).map(log => ( // Show recent 10 logs
                <li key={log.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <span className="font-medium">{log.amount}ml</span>
                  <span className="text-sm text-muted-foreground">
                    {format(log.timestamp, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hydration logged yet. Add your first log!</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}