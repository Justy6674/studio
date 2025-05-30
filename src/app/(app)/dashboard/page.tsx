"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { WaterGlass } from "@/components/water/WaterGlass";
import { AIMotivationCard } from "@/components/water/AIMotivationCard";
import { getHydrationLogs, getAIMotivation, logHydration } from "@/lib/hydration";
import { showMotivationNotification } from "@/lib/notifications";
import type { HydrationLog, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Droplets, Target, Lock, Lightbulb } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";

interface DailyLogSummary {
  date: string; // YYYY-MM-DD
  totalAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, hasActiveSubscription, isSubscriptionLoading } = useAuth();
  const { toast } = useToast();
  
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [glassAnimation, setGlassAnimation] = useState(false);
  const [aiMotivation, setAIMotivation] = useState<string>("");
  const [loadingMotivation, setLoadingMotivation] = useState(false);

  const userName = userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';
  const hydrationGoal = userProfile?.hydrationGoal || 2000;

  // Generate smart AI tip based on progress
  const generateSmartTip = useCallback(() => {
    const percentage = hydrationGoal > 0 ? (currentIntake / hydrationGoal) * 100 : 0;
    const remaining = hydrationGoal - currentIntake;
    
    if (percentage >= 100) {
      return `🎉 Goal achieved! Great work staying hydrated today, ${userName}!`;
    } else if (percentage >= 75) {
      return `💪 Almost there! Just ${remaining}ml more to complete your goal.`;
    } else if (percentage >= 50) {
      return `👍 Halfway there! Keep up the momentum - ${remaining}ml to go.`;
    } else if (percentage >= 25) {
      return `🚀 Good start! Drink ${remaining}ml more to reach your hydration goal.`;
    } else if (currentIntake > 0) {
      return `💧 Every drop counts! ${remaining}ml remaining for today's goal.`;
    } else {
      return `🌅 Start your day right! Begin with a glass of water.`;
    }
  }, [currentIntake, hydrationGoal, userName]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const logs = await getHydrationLogs();
      setHydrationLogs(logs);
      
      const today = startOfDay(new Date());
      const todayLogs = logs.filter(log => {
        const logDate = startOfDay(new Date(log.timestamp));
        return isSameDay(logDate, today);
      });
      
      const todayIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setCurrentIntake(todayIntake);
      
      // Calculate streaks
      const dailyTotals = calculateDailyTotals(logs);
      const { currentStreak, longestStreak: maxStreak } = calculateStreaks(dailyTotals, hydrationGoal);
      setDailyStreak(currentStreak);
      setLongestStreak(maxStreak);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, hydrationGoal]);

  const fetchMotivation = useCallback(async () => {
    if (!user) return;
    
    setLoadingMotivation(true);
    try {
      const result = await getAIMotivation(hydrationGoal);
      setAIMotivation(result.message);
    } catch (error) {
      console.error('Error fetching AI motivation:', error);
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, hydrationGoal]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (currentIntake > 0) {
      fetchMotivation();
    }
  }, [fetchMotivation, currentIntake]);

  const handleLogWater = async (amount: number) => {
    if (!user) return;
    
    try {
      const result = await logHydration(amount);
      if (result.success) {
        setCurrentIntake(prev => prev + amount);
        setGlassAnimation(true);
        
        toast({
          title: "Water logged! 💧",
          description: `Added ${amount}ml to your daily intake`,
          duration: 2000,
        });
        
        setTimeout(() => setGlassAnimation(false), 2000);
        
        const newPercentage = ((currentIntake + amount) / hydrationGoal) * 100;
        if (newPercentage >= 100 && currentIntake < hydrationGoal) {
          showMotivationNotification("🎉 Daily goal achieved! Great hydration work!");
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to log water. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log water. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateDailyTotals = (logs: HydrationLog[]): DailyLogSummary[] => {
    const dailyMap = new Map<string, number>();
    
    logs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      dailyMap.set(date, (dailyMap.get(date) || 0) + log.amount);
    });
    
    return Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      totalAmount: amount
    }));
  };

  const calculateStreaks = (dailyTotals: DailyLogSummary[], goal: number) => {
    const sortedDays = dailyTotals
      .filter(day => day.totalAmount >= goal)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Calculate current streak
    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sortedDays[i]?.date === expectedDate) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0 || sortedDays[i-1].date === format(subDays(new Date(sortedDays[i].date), -1), 'yyyy-MM-dd')) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    return { currentStreak, longestStreak };
  };

  // Prepare chart data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const weeklyChartData = last7Days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = hydrationLogs.filter(log => {
      const logDate = format(new Date(log.timestamp), 'yyyy-MM-dd');
      return logDate === dateStr;
    });
    const totalWater = dayLogs.reduce((sum, log) => sum + log.amount, 0);
    
    return {
      date: format(date, 'EEE'),
      water: totalWater,
      goal: hydrationGoal
    };
  });

  const chartConfig = {
    water: {
      label: "Water Intake",
      color: "#5271ff",
    },
  };

  if (isSubscriptionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto bg-slate-800" />
          <Skeleton className="h-4 w-32 mx-auto bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription()) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-slate-400" />
              </div>
              <CardTitle className="text-2xl text-slate-200">Subscription Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-slate-400">
                Access your personalised hydration dashboard with AI insights and progress tracking.
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => router.push("/billing")}
                  className="w-full bg-hydration-600 hover:bg-hydration-700 text-white"
                >
                  View Plans
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-hydration-400 rounded-full animate-pulse"></div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-hydration-400 to-brown-400 bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>
          </div>
          <p className="text-slate-400 text-base md:text-lg">Track your hydration journey and stay motivated with AI insights</p>
        </div>

        {/* Main Progress & Action Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Glass - Main Event */}
          <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-hydration-400/20 rounded-lg">
                  <Target className="h-6 w-6 text-hydration-400" />
                </div>
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <WaterGlass 
                currentIntake={currentIntake} 
                goalIntake={hydrationGoal} 
                size={360} 
                triggerAnimation={glassAnimation}
              />
              
              {/* AI Smart Tip */}
              <div className="w-full p-4 bg-slate-700/50 rounded-lg border border-[#b68a71]/30">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-hydration-400/20 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-hydration-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">Smart Tip</h4>
                    <p className="text-sm text-slate-300">{generateSmartTip()}</p>
                    {dailyStreak > 0 && (
                      <p className="text-xs text-brown-400 mt-1">
                        🔥 Current streak: {dailyStreak} day{dailyStreak !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log Water - Action Area */}
          <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
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

        {/* 7-Day Chart - Full Width Below Main Features */}
        <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-200">
              <div className="p-2 bg-brown-400/20 rounded-lg">
                <BarChart className="h-6 w-6 text-brown-400" />
              </div>
              7-Day Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
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

        {/* AI Motivation */}
        <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
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
