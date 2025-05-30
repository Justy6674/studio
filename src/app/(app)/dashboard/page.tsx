"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { WaterGlass } from "@/components/water/WaterGlass";
import { AIMotivationCard } from "@/components/water/AIMotivationCard";
import { WaterLogExporter } from "@/components/export/WaterLogExporter";
import { BodyMetricsTracker } from "@/components/metrics/BodyMetricsTracker";
import { getHydrationLogs, getAIMotivation, logHydration } from "@/lib/hydration";
import { showMotivationNotification } from "@/lib/notifications";
import type { HydrationLog, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Droplets, Target, Lock, Lightbulb, Download, Scale, Flame, Award } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { OnboardingTip } from "@/components/onboarding/OnboardingTip";
import { StreakCelebration } from "@/components/celebrations/StreakCelebration";

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
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const userName = userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';
  const hydrationGoal = userProfile?.hydrationGoal || 2000;

  // Enhanced onboarding tip for first-time users
  const [showOnboardingTip, setShowOnboardingTip] = useState(false);

  useEffect(() => {
    // Show onboarding tip for new users (first 3 logs)
    if (hydrationLogs.length <= 3 && hydrationLogs.length > 0) {
      setShowOnboardingTip(true);
    }
  }, [hydrationLogs]);

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
      
      // Celebrate streak milestones
      if (currentStreak > dailyStreak && (currentStreak === 3 || currentStreak === 7 || currentStreak % 10 === 0)) {
        setShowStreakCelebration(true);
        setTimeout(() => setShowStreakCelebration(false), 3000);
      }
      
      setDailyStreak(currentStreak);
      setLongestStreak(maxStreak);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, hydrationGoal, dailyStreak]);

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
      setGlassAnimation(true);
      
      const result = await logHydration(amount);
      
      if (result.success) {
        // Update current intake
        setCurrentIntake(prev => prev + amount);
        
        // Refresh hydration logs
        const updatedLogs = await getHydrationLogs(30);
        setHydrationLogs(updatedLogs);
        
        // Calculate streaks from daily totals
        const dailyTotals = calculateDailyTotals(updatedLogs);
        const { currentStreak: newStreak } = calculateStreaks(dailyTotals, hydrationGoal);
        const { currentStreak: oldStreak } = calculateStreaks(calculateDailyTotals(hydrationLogs), hydrationGoal);
        
        // Show celebration for milestones (3, 7, 14, 21, 30+ days)
        const milestones = [3, 7, 14, 21, 30];
        const shouldCelebrate = milestones.includes(newStreak) || 
                               (newStreak > oldStreak && newStreak > 0 && (newStreak % 7 === 0 || newStreak >= 30));
        
        if (shouldCelebrate) {
          setCelebrationStreak(newStreak);
          setIsNewRecord(newStreak > oldStreak);
          setShowStreakCelebration(true);
        }
        
        // Show success toast
        toast({
          title: "Water logged! 💧",
          description: `Added ${amount}ml to your daily intake`,
          duration: 2000,
        });
        
        // Check for goal achievement
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
      
      // Reset glass animation after a delay
      setTimeout(() => setGlassAnimation(false), 1000);
      
    } catch (error) {
      console.error('Error logging water:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Onboarding Tip */}
      {user && <OnboardingTip userId={user.uid} />}
      
      {/* Streak Celebration */}
      {showStreakCelebration && (
        <StreakCelebration
          streak={celebrationStreak}
          isNewRecord={isNewRecord}
          onDismiss={() => setShowStreakCelebration(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Water4WeightLoss
          </h1>
          <p className="text-slate-300 text-lg">
            Track your hydration journey, {userName}! 💧
          </p>
        </div>

        {/* Main Tabbed Content with Brown Borders */}
        <Tabs defaultValue="water" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-slate-800 border border-[#b68a71] h-12 md:h-10">
            <TabsTrigger value="water" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5">
              <Droplets className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Water</span>
              <span className="sm:hidden">H₂O</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5">
              <Scale className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Body Metrics</span>
              <span className="sm:hidden">Body</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-1.5">
              <Download className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">📁</span>
            </TabsTrigger>
          </TabsList>

          {/* Water Tab - Streamlined Dashboard */}
          <TabsContent value="water" className="space-y-4 md:space-y-6">
            {/* Main Hero Section - Large Glass & Quick Actions Above Fold */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Progress Glass - Larger, More Prominent */}
              <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-200 text-lg md:text-xl">
                    <div className="p-1.5 md:p-2 bg-hydration-400/20 rounded-lg">
                      <Target className="h-4 w-4 md:h-6 md:w-6 text-hydration-400" />
                    </div>
                    Today's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-3 md:space-y-4">
                  <WaterGlass 
                    currentIntake={currentIntake} 
                    goalIntake={hydrationGoal} 
                    size={320} 
                    triggerAnimation={glassAnimation}
                  />
                  
                  {/* Enhanced Smart Tip with Brown Border */}
                  <div className="w-full p-3 md:p-4 bg-slate-700/50 border border-[#b68a71]/30 rounded-lg">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-1 md:p-1.5 bg-hydration-400/20 rounded-lg">
                        <Lightbulb className="h-3 w-3 md:h-4 md:w-4 text-hydration-400" />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-semibold text-slate-200 mb-1">Smart Tip</h4>
                        <p className="text-xs md:text-sm text-slate-300">{generateSmartTip()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Log Water - Thumb-Friendly, Above Fold */}
              <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-200 text-lg md:text-xl">
                    <div className="p-1.5 md:p-2 bg-slate-600/20 rounded-lg">
                      <Droplets className="h-4 w-4 md:h-6 md:w-6 text-slate-400" />
                    </div>
                    Log Water
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LogWaterForm onLogWater={handleLogWater} />
                </CardContent>
              </Card>
            </div>

            {/* AI Motivation - Streamlined */}
            <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
              <CardContent className="p-4 md:p-6">
                <AIMotivationCard 
                  motivation={aiMotivation} 
                  loading={loadingMotivation}
                  onRefresh={fetchMotivation}
                />
              </CardContent>
            </Card>

            {/* 7-Day Chart - Optional Below Fold */}
            <Card className="bg-slate-800 border-[#b68a71] shadow-2xl">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-slate-200 text-lg md:text-xl">
                  <div className="p-1.5 md:p-2 bg-[#b68a71]/20 rounded-lg">
                    <BarChart className="h-4 w-4 md:h-6 md:w-6 text-[#b68a71]" />
                  </div>
                  7-Day Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[180px] md:h-[200px] lg:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        fontSize={10}
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
          </TabsContent>

          {/* Body Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <BodyMetricsTracker />
          </TabsContent>

          {/* Export Tab - Keep as is */}
          <TabsContent value="export" className="space-y-6">
            <WaterLogExporter />
          </TabsContent>
        </Tabs>

        {/* Privacy Notice - Subtle Footer */}
        <div className="text-center py-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            🔒 Your data is private and only you can download it. No data sold or shared.
          </p>
        </div>
      </div>
    </div>
  );
}
