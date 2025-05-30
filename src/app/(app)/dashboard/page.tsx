"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { WaterProgressDisplay } from "@/components/water/WaterProgressDisplay";
import { WaterGlass } from "@/components/water/WaterGlass";
import { StreakDisplay } from "@/components/water/StreakDisplay";
import { AIMotivationCard } from "@/components/water/AIMotivationCard";
import { getHydrationLogs, getAIMotivation, logHydration } from "@/lib/hydration";
import { showMotivationNotification } from "@/lib/notifications";
import type { HydrationLog, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, CalendarDays, Terminal, Droplets, Target, TrendingUp, Award, Lock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";

interface DailyLogSummary {
  date: string; // YYYY-MM-DD
  totalAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, hasActiveSubscription, isSubscriptionLoading } = useAuth();
  const { toast } = useToast();
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [glassAnimation, setGlassAnimation] = useState(false);

  const hydrationGoal = userProfile?.hydrationGoal || 2000;
  const dailyStreak = userProfile?.dailyStreak || 0;
  const longestStreak = userProfile?.longestStreak || 0;
  const userName = userProfile?.name || user?.email?.split('@')[0] || "User";

  // Check subscription status and redirect if needed
  useEffect(() => {
    if (user && !isSubscriptionLoading && !hasActiveSubscription()) {
      router.push("/billing");
    }
  }, [user, hasActiveSubscription, isSubscriptionLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const logs = await getHydrationLogs();
      setHydrationLogs(logs);

      const todayStart = startOfDay(new Date());
      const todayLogs = logs.filter(log => isSameDay(log.timestamp, todayStart));
      const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setCurrentIntake(todayIntake);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
        description: "Failed to load your hydration data. Please try refreshing.",
      });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  const fetchMotivation = useCallback(async () => {
    if (!user) return;
    setLoadingMotivation(true);
    try {
      const result = await getAIMotivation(hydrationGoal);
      setAiMotivation(result.message);
      
      if (result.error) {
        toast({
          title: "AI Unavailable",
          description: `Using ${result.source || 'fallback'} message`,
          variant: "default",
        });
      } else if (result.source === 'gemini') {
        // Optional: Show success feedback for Gemini responses
        console.log(`AI motivation generated with ${result.tone} tone`);
      }
    } catch (error) {
      console.error("Error fetching AI motivation:", error);
      setAiMotivation("Keep hydrating! Every sip brings you closer to your goal! 💧");
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, hydrationGoal, toast]);

  const handleLogWater = async (amount: number) => {
    setIsLogging(true);
    try {
      const result = await logHydration(amount);
      if (result.success) {
        toast({ title: "Success", description: result.success });
        
        // Trigger glass animation
        setGlassAnimation(true);
        setTimeout(() => setGlassAnimation(false), 100); // Reset trigger after brief moment
        
        // Refresh data immediately
        await Promise.all([
          fetchDashboardData(),
          fetchMotivation()
        ]);
        
        // Auto-fetch new AI motivation after logging water
        if (userProfile?.motivationFrequency !== 'Manual only') {
          const motivationResult = await getAIMotivation(hydrationGoal);
          if (motivationResult.message) {
            setAiMotivation(motivationResult.message);
            
            // Show push notification if enabled and user has granted permission
            if (userProfile?.pushNotifications && 
                userProfile?.motivationFrequency !== 'Never' && 
                Notification.permission === 'granted') {
              await showMotivationNotification(
                motivationResult.message, 
                userProfile?.motivationTone || 'Default'
              );
            }
          }
        }
      } else {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: result.error || "Failed to log water" 
        });
      }
    } catch (error) {
      console.error("Error in handleLogWater:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Something went wrong. Please try again." 
      });
    } finally {
      setIsLogging(false);
    }
  };

  useEffect(() => {
    if (user && hasActiveSubscription()) {
      fetchDashboardData();
      fetchMotivation();
    }
  }, [user, hasActiveSubscription, fetchDashboardData, fetchMotivation]);

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

  if (authLoading || isSubscriptionLoading || (loadingData && !user)) {
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

  // Show subscription required message if user doesn't have active subscription
  if (!hasActiveSubscription()) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-xl text-slate-200">Subscription Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-400">
                Your subscription is inactive. Please subscribe to continue using Water4WeightLoss.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push("/billing")}
                  className="w-full bg-hydration-500 hover:bg-hydration-600 text-white"
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push("/settings")}
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Manage Account
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 mt-4">
                Questions? Contact support@water4weightloss.com
              </p>
            </CardContent>
          </Card>
        </div>
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
            <div className="w-3 h-3 bg-hydration-400 rounded-full animate-pulse"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-hydration-400 to-brown-400 bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>
          </div>
          <p className="text-slate-400 text-lg">Track your hydration journey and stay motivated with AI insights</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-hydration-400/20 rounded-lg">
                  <Target className="h-6 w-6 text-hydration-400" />
                </div>
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <WaterGlass 
                currentIntake={currentIntake} 
                goalIntake={hydrationGoal} 
                size={240}
                triggerAnimation={glassAnimation}
              />
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-brown-400/20 rounded-lg">
                  <Award className="h-6 w-6 text-brown-400" />
                </div>
                Streak Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brown-400">{dailyStreak}</div>
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

          {/* Log Water Card */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-slate-600/20 rounded-lg">
                  <Droplets className="h-6 w-6 text-slate-400" />
                </div>
                Log Water
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogWaterForm onLogWater={handleLogWater} />
            </CardContent>
          </Card>
        </div>

        {/* Progress & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Progress */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-hydration-400/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-hydration-400" />
                </div>
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WaterProgressDisplay
                currentIntake={currentIntake}
                goalIntake={hydrationGoal}
                percentage={progressPercentage}
              />
            </CardContent>
          </Card>

          {/* Weekly Chart */}
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-brown-400/20 rounded-lg">
                  <BarChart className="h-6 w-6 text-brown-400" />
                </div>
                7-Day Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="water" 
                      fill="#5271ff" 
                      radius={[4, 4, 0, 0]}
                      name="Water Intake"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Motivation */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardContent className="p-6">
            <AIMotivationCard 
              motivation={aiMotivation} 
              loading={loadingMotivation}
              onRefresh={fetchMotivation}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
