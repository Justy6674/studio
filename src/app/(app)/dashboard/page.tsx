
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { WaterProgressDisplay } from "@/components/water/WaterProgressDisplay";
import { StreakDisplay } from "@/components/water/StreakDisplay";
import { AIMotivationCard } from "@/components/water/AIMotivationCard";
// import { getHydrationLogs as getHydrationLogsAction, getAIMotivation as getAIMotivationAction } from "@/app/actions/hydration"; // Using Firebase Functions now
import { getFunctions, httpsCallable } from "firebase/functions";
import type { HydrationLog, UserProfile, MotivationTone } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, CalendarDays, Terminal } from "lucide-react"; // Added Terminal
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";


export default function DashboardPage() {
  const { user, loading: authLoading, fetchUserProfile } = useAuth();
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMotivation, setLoadingMotivation] = useState(true);
  const firebaseFunctions = getFunctions();

  const hydrationGoal = user?.hydrationGoal || 2000;
  const dailyStreak = user?.dailyStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  const userName = user?.name || user?.displayName || "User";
  const userTone = user?.preferences?.tone || 'default';

  const fetchDashboardLogs = useCallback(async () => {
    if (!user) return;
    try {
      const fetchLogsFn = httpsCallable(firebaseFunctions, 'fetchHydrationLogs');
      const result = await fetchLogsFn({ daysToFetch: 7 }) as any; // Type cast for result data
      
      const logsData = result.data.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp) // Ensure timestamp is a Date object
      })) as HydrationLog[];
      
      setHydrationLogs(logsData);

      const todayStart = startOfDay(new Date());
      const todayLogs = logsData.filter(log => isSameDay(new Date(log.timestamp), todayStart));
      const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setCurrentIntake(todayIntake);

    } catch (error) {
      console.error("Error fetching dashboard logs via function:", error);
    }
  }, [user, firebaseFunctions]);

  const fetchAIMotivation = useCallback(async () => {
    if (!user) return;
    setLoadingMotivation(true);
    try {
      const getMotivationFn = httpsCallable(firebaseFunctions, 'getHydrationMotivation');
      // Prepare recent logs for context, if any
      const recentLogsForMotivation = hydrationLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Ensure descending order
        .slice(0, 5) // Take most recent 5 logs
        .map(log => ({
          amount: log.amount,
          timestamp: new Date(log.timestamp).toISOString(),
        }));
      
      const result = await getMotivationFn({ 
        tone: userTone,
        userName: userName,
        hydrationGoal: hydrationGoal,
        recentLogs: recentLogsForMotivation
      }) as any;
      setAiMotivation(result.data.message);
    } catch (error) {
      console.error("Error fetching AI motivation via function:", error);
      setAiMotivation("Could not fetch motivation at this time. Keep hydrating!");
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, userTone, userName, hydrationGoal, firebaseFunctions, hydrationLogs]);


  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([
        fetchDashboardLogs(),
        fetchAIMotivation() 
      ]).finally(() => {
        setLoadingData(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Removed fetchDashboardLogs & fetchAIMotivation from deps to control calls

   useEffect(() => { // Separate effect to run fetchAIMotivation when userTone changes
    if(user && userTone) {
        fetchAIMotivation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTone]);


  // Recalculate current intake when logs change (after new log added by LogWaterForm)
   useEffect(() => {
    const todayStart = startOfDay(new Date());
    const todayLogs = hydrationLogs.filter(log => isSameDay(new Date(log.timestamp), todayStart));
    const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
    setCurrentIntake(todayIntake);
  }, [hydrationLogs]);

  const getWeeklyChartData = () => {
    const today = new Date();
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    
    return last7Days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const logsForDay = hydrationLogs.filter(log => format(new Date(log.timestamp), "yyyy-MM-dd") === dateStr);
      const totalAmount = logsForDay.reduce((sum, log) => sum + log.amount, 0);
      return {
        date: format(day, "MMM d"), 
        water: totalAmount,
        goal: hydrationGoal,
      };
    });
  };
  const weeklyChartData = getWeeklyChartData();
  const chartConfig = {
    water: { label: "Water Intake (ml)", color: "hsl(var(--chart-1))" }, // Using chart-1
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">Here's your hydration overview for today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-1">
           {/* Pass fetchDashboardLogs to LogWaterForm to refresh logs after adding water */}
           <LogWaterForm onLogSuccess={fetchDashboardLogs} />
        </div>
        <WaterProgressDisplay currentIntake={currentIntake} goalIntake={hydrationGoal} />
        <StreakDisplay currentStreak={dailyStreak} longestStreak={longestStreak} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AIMotivationCard 
            motivation={aiMotivation} 
            isLoading={loadingMotivation} 
            onRefresh={fetchAIMotivation} 
        />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart className="h-7 w-7 text-primary" />
              Weekly Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData && weeklyChartData.length === 0 ? (
                <Skeleton className="h-[250px] w-full" />
            ) : weeklyChartData.length > 0 ? (
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
              {hydrationLogs.slice(0,10).map(log => ( 
                <li key={log.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <span className="font-medium">{log.amount}ml</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
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
