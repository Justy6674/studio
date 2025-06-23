"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/contexts/AuthContext";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { BadgeCelebration } from "@/components/celebrations/BadgeCelebration";
import { checkAndAwardBadges } from "@/components/gamification/BadgeSystem";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { HydrationProgressRing } from "@/components/water/HydrationProgressRing";
import { AIMotivationPopup } from "@/components/water/AIMotivationPopup";
import { BodyMetricsTracker } from "@/components/metrics/BodyMetricsTracker";
import { getHydrationLogs, getAIMotivation, logHydration, logOtherDrink } from "@/lib/hydration";
import type { HydrationLog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonHydrationRing, SkeletonStats, SkeletonChart, SkeletonCard } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { checkAndSendContextualReminder } from "@/lib/contextualReminders";
import { BarChart as BarChartIcon, Droplets, Target, Scale, FileText, BookOpen, Flame, Lock, Clock, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { OnboardingTip } from "@/components/onboarding/OnboardingTip";
import { StreakCelebration } from "@/components/celebrations/StreakCelebration";
import { MilestoneCelebration } from "@/components/celebrations/MilestoneCelebration";
import { HydrationCelebration } from "@/components/celebrations/HydrationCelebration";
import OtherDrinkModal from '@/components/OtherDrinkModal';
import DrinkCelebration from '@/components/celebrations/DrinkCelebration';
import { InfoCards } from '@/components/info/InfoCards';
import ExportCenter from "@/components/export/ExportCenter";
import { StreakTracker } from "@/components/water/StreakTracker";
import { TimeBasedHydrationChart } from "@/components/charts/TimeBasedHydrationChart";
import { TrendIndicator } from "@/components/charts/TrendIndicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyLogSummary {
  date: string; // YYYY-MM-DD
  totalAmount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, hasActiveSubscription, isSubscriptionLoading } = useAuth();
  const { toast } = useToast();
  
  // State to track when data is refreshing
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [aiMotivation, setAIMotivation] = useState<string>("");
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [milestoneCelebrated, setMilestoneCelebrated] = useState(0);
  const [showMotivationPopup, setShowMotivationPopup] = useState(false);
  const [lastContextualCheck, setLastContextualCheck] = useState<Date | null>(null);
  
  // Badge system state
  const [newBadge, setNewBadge] = useState<any>(null);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  // Enhanced Hydration Celebration State
  const [showHydrationCelebration, setShowHydrationCelebration] = useState(false);
  const [hydrationCelebrationType, setHydrationCelebrationType] = useState<'50%' | '100%'>('50%');

  // Other Drink Modal and Celebration State
  const [showOtherDrinkModal, setShowOtherDrinkModal] = useState(false);
  const [showDrinkCelebration, setShowDrinkCelebration] = useState(false);
  const [drinkCelebrationData, setDrinkCelebrationData] = useState<{
    drinkType: string;
    drinkName: string;
    isFirstTime: boolean;
  } | null>(null);
  
  // Chart interaction state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showChartDetail, setShowChartDetail] = useState(false);
  const [chartDetailType, setChartDetailType] = useState<'time' | 'week' | 'trend'>('time');
  const [detailTitle, setDetailTitle] = useState('');
  const [showDarkPatternAlert, setShowDarkPatternAlert] = useState(false);
  const [darkPatternType, setDarkPatternType] = useState<'end_day_log' | 'missed_days' | null>(null);

  const userName = userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';
  const hydrationGoal = userProfile?.hydrationGoal || 2000;

  const hydrationPercentage = useMemo(() => {
    if (hydrationGoal === 0) return 0;
    return (currentIntake / hydrationGoal) * 100;
  }, [currentIntake, hydrationGoal]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const logs = await getHydrationLogs();
      setHydrationLogs(logs);

      // Calculate streaks
      const dailyTotals = calculateDailyTotals(logs);
      const { currentStreak, longestStreak: maxStreak } = calculateStreaks(dailyTotals, userProfile?.hydrationGoal || 2000);
      setDailyStreak(currentStreak);
      setLongestStreak(maxStreak);

      // Calculate today's intake
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === todayStr;
      });

      const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setCurrentIntake(todayTotal);

      // Check for streak celebration
      if (currentStreak > 0 && currentStreak > dailyStreak) {
        setShowStreakCelebration(true);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load your hydration data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user, toast, userProfile, dailyStreak]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Effect to automatically refresh data at midnight
  // Calculate milliseconds until midnight for daily reset
  const calculateMsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };
  
  // Check for contextual reminders based on user patterns
  const checkForContextualReminders = useCallback(async () => {
    // Don't check too frequently (minimum 15 minutes between checks)
    if (lastContextualCheck) {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
      if (lastContextualCheck > fifteenMinutesAgo) {
        return;
      }
    }

    // Only proceed if we have a user and profile
    if (!user || !userProfile) return;

    try {
      // Update the last check time
      setLastContextualCheck(new Date());

      // Check and send contextual reminder if needed
      await checkAndSendContextualReminder({
        userId: user.uid,
        phoneNumber: userProfile.phoneNumber,
        smsEnabled: userProfile.smsEnabled || false,
        motivationTone: userProfile.motivationTone || 'kind',
        pushNotifications: userProfile.pushNotifications || false,
        hydrationGoal: userProfile.hydrationGoal || 2000,
        getFreshIdToken: async () => await user.getIdToken(true)
      });
    } catch (error) {
      console.error('Error checking for contextual reminders:', error);
    }
  }, [user, userProfile, lastContextualCheck]);
  
  // Effect for midnight reset and contextual reminders
  useEffect(() => {
    if (!user) return;
    
    // Set up midnight reset
    const msUntilMidnight = calculateMsUntilMidnight();
    const midnightTimer = setTimeout(() => {
      // Reset current intake at midnight
      setCurrentIntake(0);
      // Refetch logs to update streaks
      fetchDashboardData();
    }, msUntilMidnight);
    
    // Initial contextual reminder check
    checkForContextualReminders();
    
    // Set up periodic contextual reminder checks (every 30 minutes)
    const contextualCheckInterval = setInterval(() => {
      checkForContextualReminders();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      clearTimeout(midnightTimer);
      clearInterval(contextualCheckInterval);
    };
  }, [user, checkForContextualReminders, fetchDashboardData]);

  // Function to fetch AI motivation
  const fetchMotivationData = useCallback(async () => {
    if (!user || !userProfile) return;
    
    setLoadingMotivation(true);
    try {
      const motivationData = await getAIMotivation(userProfile.hydrationGoal || 2000);
      setAIMotivation(motivationData.message);
      
      // Show motivation popup if we have content
      if (motivationData.message) {
        setShowMotivationPopup(true);
      }
    } catch (error: unknown) {
      console.error("Error fetching AI motivation:", error);
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, userProfile]);
  
  // Fetch AI motivation when currentIntake changes
  useEffect(() => {
    if (currentIntake > 0) {
      // Only fetch motivation if we have intake data
      fetchMotivationData();
    }
  }, [currentIntake, fetchMotivationData]);

  const handleLogWater = async (amount: number) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to track your hydration.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await logHydration(amount);
      
      if (result.success) {
        toast({
          title: "Water logged! 💧",
          description: `Added ${amount}ml to your daily intake.`,
          className: "bg-hydration-500 text-white border-hydration-400",
        });
        setShowMotivationPopup(true);
        
        const oldIntake = currentIntake;
        
        await fetchDashboardData();
        
        const newIntake = oldIntake + amount;
        const oldPercentage = (oldIntake / hydrationGoal) * 100;
        const newPercentage = (newIntake / hydrationGoal) * 100;
        
        // Check for badges after hydration logging
        await checkForBadges();
        
        if (newPercentage >= 50 && oldPercentage < 50) {
          setHydrationCelebrationType('50%');
          setShowHydrationCelebration(true);
        } else if (newPercentage >= 100 && oldPercentage < 100) {
          setHydrationCelebrationType('100%');
          setShowHydrationCelebration(true);
        }
      } else {
        toast({
          title: "Hydration Logging Failed",
          description: result.error || "Failed to log hydration. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error('Error logging water:', error);
        toast({
          title: "Hydration Logging Failed",
          description: (error as Error).message || "Failed to log hydration. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error('Error logging water:', error);
        toast({
          title: "Hydration Logging Failed",
          description: (error as Error).message || "Failed to log hydration. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOtherDrink = async (drinkType: string, drinkName: string, amount: number, hydrationPercentage: number) => {
    if (!user) return;

    try {
      const result = await logOtherDrink(amount, drinkType, drinkName, hydrationPercentage);
      
      if (result.success) {
        const oldIntake = currentIntake;
        const hydrationValue = Math.round(amount * (hydrationPercentage / 100));
        const newIntake = currentIntake + hydrationValue;
        
        setCurrentIntake(newIntake);
        
        toast({
          title: `Drink logged!`,
          description: `Added ${hydrationValue}ml of hydration from ${drinkName}.`,
          className: "bg-hydration-500 text-white border-hydration-400",
        });
        setShowMotivationPopup(true);

        await fetchDashboardData();

        const oldPercentage = (oldIntake / hydrationGoal) * 100;
        const newPercentage = (newIntake / hydrationGoal) * 100;
        
        // Check for badges after logging other drink
        await checkForBadges();
        
        if (newPercentage >= 50 && oldPercentage < 50) {
          setHydrationCelebrationType('50%');
          setShowHydrationCelebration(true);
        } else if (newPercentage >= 100 && oldPercentage < 100) {
          setHydrationCelebrationType('100%');
          setShowHydrationCelebration(true);
        }

        if (result.isFirstTime) {
          setDrinkCelebrationData({ drinkType, drinkName, isFirstTime: true });
          setShowDrinkCelebration(true);
        }

        const milestones = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
        const highestMilestone = milestones.filter(m => newIntake >= m).pop();
        
        if (highestMilestone && highestMilestone > milestoneCelebrated) {
          setMilestoneCelebrated(highestMilestone);
          setShowMilestoneCelebration(true);
        }
      } else {
        toast({
          title: "Logging Failed",
          description: result.error || "Failed to log other drink. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error('Error logging other drink:', error);
        toast({
          title: "Logging Failed",
          description: (error as Error).message || "Failed to log other drink. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error('Error logging other drink:', error);
        toast({
          title: "Logging Failed",
          description: (error as Error).message || "Failed to log other drink. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setShowOtherDrinkModal(false);
    }
  };

  const calculateDailyTotals = (logs: HydrationLog[]): DailyLogSummary[] => {
    const dailyTotals: { [key: string]: number } = {};
    logs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      dailyTotals[date] = (dailyTotals[date] || 0) + (log.hydrationValue || log.amount);
    });
    return Object.entries(dailyTotals).map(([date, totalAmount]) => ({
      date,
      totalAmount
    }));
  };

  const calculateStreaks = (dailyTotals: DailyLogSummary[], goal: number) => {
    if (dailyTotals.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    const sortedDays = dailyTotals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    
    let lastStreakDay: Date | null = null;
    
    const todayData = sortedDays.find(d => isSameDay(startOfDay(new Date(d.date)), today));
    const yesterdayData = sortedDays.find(d => isSameDay(startOfDay(new Date(d.date)), yesterday));

    if (todayData && todayData.totalAmount >= goal) {
      currentStreak = 1;
      lastStreakDay = today;
    } else if (yesterdayData && yesterdayData.totalAmount >= goal) {
      lastStreakDay = yesterday;
    } else if (todayData && todayData.totalAmount < goal) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i];
      const dayDate = startOfDay(new Date(day.date));
      
      if (day.totalAmount >= goal) {
        if (lastStreakDay) {
          const diff = Math.round((lastStreakDay.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            currentStreak++;
          } else if (diff > 1) {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastStreakDay = dayDate;
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
    
    const todayMetGoal = todayData && todayData.totalAmount >= goal;
    if (!todayMetGoal) {
      const yesterdayMetGoal = yesterdayData && yesterdayData.totalAmount >= goal;
      if (!yesterdayMetGoal) {
         currentStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  };

  const weeklyChartData = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 6);
    const dateRange = eachDayOfInterval({ start, end });

    return dateRange.map(date => {
      const dayLogs = hydrationLogs.filter(log => {
        const logDate = startOfDay(new Date(log.timestamp));
        return isSameDay(logDate, date);
      });
      const total = dayLogs.reduce((sum, log) => sum + (log.hydrationValue || log.amount), 0);
      return {
        date: format(date, "EEE"),
        goal: hydrationGoal,
        consumed: total,
      };
    });
  }, [hydrationLogs, hydrationGoal]);

  const chartConfig = {
    consumed: {
      label: "Consumed",
      color: "#5271ff",
    },
    goal: {
      label: "Goal",
      color: "#b68a71",
    },
  } satisfies ChartConfig;

  // Check for badges after hydration logging
  const checkForBadges = async () => {
    if (!user?.uid) return;
    
    try {
      const result = await checkAndAwardBadges(
        user.uid, 
        hydrationLogs, 
        dailyStreak, 
        hydrationGoal, 
        currentIntake
      );
      
      if (result?.awarded && result.newBadges && result.newBadges.length > 0) {
        // Show the first new badge celebration
        setNewBadge(result.newBadges[0]);
        setShowBadgeCelebration(true);
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  const handleRefresh = async () => {
    if (!user || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      // Check for badges after refreshing data
      await checkForBadges();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh hydration data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 pb-20">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skeleton for Hydration Ring */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <SkeletonHydrationRing />
          </div>
          
          {/* Skeleton for Stats */}
          <div className="space-y-6">
            <SkeletonCard className="mb-6" />
            <SkeletonStats />
          </div>
        </div>
        
        <div className="mt-8">
          <Skeleton className="h-8 w-40 mb-4" />
          <SkeletonChart />
        </div>
      </div>
    );
  }
  
  if (isSubscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 pb-20">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skeleton for Hydration Ring */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <SkeletonHydrationRing />
          </div>
          
          {/* Skeleton for Stats */}
          <div className="space-y-6">
            <SkeletonCard className="mb-6" />
            <SkeletonStats />
          </div>
        </div>
        
        <div className="mt-8">
          <Skeleton className="h-8 w-40 mb-4" />
          <SkeletonChart />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center p-6 bg-card rounded-lg shadow-lg border">
            <Lock className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Checking subscription...</h2>
            <p className="text-muted-foreground">Just a moment while we verify your account</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!hasActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Lock className="mr-2 h-6 w-6" /> Premium Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              The full dashboard experience is available for our premium subscribers.
            </p>
            <p className="mb-6">
              Unlock streaks, advanced analytics, AI motivation, and more.
            </p>
            <Button onClick={() => router.push('/billing')} className="w-full">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!user || isRefreshing}>
      <div className="flex flex-col min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
        
        {/* Streak celebration */}
      {showStreakCelebration && (
        <StreakCelebration
          streak={dailyStreak}
          isNewRecord={dailyStreak > longestStreak - 1}
          onDismiss={() => setShowStreakCelebration(false)}
        />
      )}
      
      {/* Badge celebration */}
      {showBadgeCelebration && newBadge && (
        <BadgeCelebration
          badge={newBadge}
          onDismiss={() => setShowBadgeCelebration(false)}
        />
      )}
      
      {showMilestoneCelebration && <MilestoneCelebration milestone={milestoneCelebrated} currentAmount={currentIntake} goalAmount={hydrationGoal} onDismiss={() => setShowMilestoneCelebration(false)} />}
        {showHydrationCelebration && (
          <HydrationCelebration
            type={hydrationCelebrationType}
            currentAmount={currentIntake}
            goalAmount={hydrationGoal}
            onComplete={() => setShowHydrationCelebration(false)}
          />
        )}
        {showDrinkCelebration && drinkCelebrationData && (
          <DrinkCelebration
            drinkType={drinkCelebrationData.drinkType}
            drinkName={drinkCelebrationData.drinkName}
            isFirstTime={drinkCelebrationData.isFirstTime}
            onComplete={() => setShowDrinkCelebration(false)}
          />
        )}

        {/* Onboarding */}
        {user && <OnboardingTip userId={user.uid} />}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="flex-grow">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="exports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Info
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Today&apos;s Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <HydrationProgressRing progress={hydrationPercentage} />
                </CardContent>
              </Card>
              <Card className="p-6 space-y-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Log Water
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LogWaterForm onLogWater={handleLogWater} onOtherDrink={() => setShowOtherDrinkModal(true)} />
                </CardContent>
              </Card>
            </div>

            <Card className="p-6 space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Streak Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center pt-4">
                <StreakTracker currentStreak={dailyStreak} longestStreak={longestStreak} />
              </CardContent>
            </Card>

            <Card className="p-6 space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChartIcon className="h-4 w-4" />
                  7-Day Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="consumed" fill="#5271ff" />
                      <Bar dataKey="goal" fill="#b68a71" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="metrics" className="space-y-6">
            <BodyMetricsTracker />
          </TabsContent>
          <TabsContent value="exports" className="space-y-6">
            <ExportCenter
              userName={userName}
              hydrationLogs={hydrationLogs}
            />
          </TabsContent>
          <TabsContent value="info" className="space-y-6">
            <InfoCards />
          </TabsContent>
        </Tabs>

        {/* Dashboard Charts Row - Time & Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Time-based hydration chart */}
          <Card className="p-6 space-y-4">
            <div className="flex px-4 md:px-6 items-center justify-between">
              <div className="inline-flex items-center space-x-2">
                <BarChartIcon className="h-4 w-4" />
                <h3 className="font-medium">Hydration History</h3>
              </div>
            </div>
            <CardContent className="p-0">
              <button 
                onClick={() => {
                  setChartDetailType('time');
                  setDetailTitle('Today\'s Hydration Pattern');
                  setShowChartDetail(true);
                }}
                className="w-full cursor-pointer"
                aria-label="View detailed time-based hydration chart"
              >
              <TimeBasedHydrationChart 
                logs={hydrationLogs} 
                date={new Date()} 
              />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Tap chart for detailed breakdown
            </p>
          </CardContent>
        </Card>
        
        {/* Trend indicator */}
        <button 
          onClick={() => {
            setChartDetailType('trend');
            setDetailTitle('Weekly Hydration Trends');
            setShowChartDetail(true);
          }}
          className="w-full cursor-pointer"
          aria-label="View weekly hydration trends"
        >
          <TrendIndicator 
            logs={hydrationLogs}
            goal={hydrationGoal}
          />
        </button>
      </div>

      {/* Interactive dialog for chart details */}
      <Dialog open={showChartDetail} onOpenChange={setShowChartDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {chartDetailType === 'time' && (
              <div className="space-y-6">
                <TimeBasedHydrationChart 
                  logs={hydrationLogs} 
                  date={selectedDate}
                />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium">Peak Hydration</h4>
                      <p className="text-sm text-muted-foreground">
                        You tend to drink the most water in the 
                        {(() => {
                          // Calculate peak hydration time
                          const hourlyData = Array(24).fill(0);
                          hydrationLogs
                            .filter(log => {
                              const logDate = new Date(log.timestamp);
                              return format(logDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                            })
                            .forEach(log => {
                              const logDate = new Date(log.timestamp);
                              const hour = logDate.getHours();
                              hourlyData[hour] += log.amount;
                            });
                          
                          const maxAmount = Math.max(...hourlyData);
                          const peakHour = hourlyData.indexOf(maxAmount);
                          
                          if (peakHour >= 5 && peakHour < 12) return ' morning';
                          if (peakHour >= 12 && peakHour < 17) return ' afternoon';
                          if (peakHour >= 17 && peakHour < 21) return ' evening';
                          return ' night';
                        })()} 
                      </p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium">Improvement Suggestion</h4>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const hoursBetweenDrinks = [
                            {name: 'Morning (6am-12pm)', logged: false},
                            {name: 'Afternoon (12pm-5pm)', logged: false},
                            {name: 'Evening (5pm-9pm)', logged: false},
                          ];
                          
                          hydrationLogs
                            .filter(log => {
                              const logDate = new Date(log.timestamp);
                              return format(logDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                            })
                            .forEach(log => {
                              const hour = new Date(log.timestamp).getHours();
                              if (hour >= 6 && hour < 12) hoursBetweenDrinks[0].logged = true;
                              if (hour >= 12 && hour < 17) hoursBetweenDrinks[1].logged = true;
                              if (hour >= 17 && hour < 21) hoursBetweenDrinks[2].logged = true;
                            });
                          
                          const missingPeriods = hoursBetweenDrinks.filter(period => !period.logged);
                          
                          if (missingPeriods.length === 0) {
                            return 'Great job! You\'re hydrating throughout the day.';
                          } else {
                            return `Consider adding hydration during ${missingPeriods.map(p => p.name).join(' and ')} for more balanced intake.`;
                          }
                        })()} 
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Individual Logs</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="py-2 px-4 text-left">Time</th>
                          <th className="py-2 px-4 text-left">Amount</th>
                          <th className="py-2 px-4 text-left">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hydrationLogs
                          .filter(log => {
                            const logDate = new Date(log.timestamp);
                            return format(logDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          })
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((log, index) => (
                            <tr key={index} className="border-t hover:bg-muted/50">
                              <td className="py-2 px-4">{format(new Date(log.timestamp), 'h:mm a')}</td>
                              <td className="py-2 px-4">{log.amount}ml</td>
                              <td className="py-2 px-4">{log.drinkType || 'Water'}</td>
                            </tr>
                          ))
                        }
                        {hydrationLogs.filter(log => {
                          const logDate = new Date(log.timestamp);
                          return format(logDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        }).length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-muted-foreground">
                              No logs for this date
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {chartDetailType === 'week' && (
              <div>
                <h3>Weekly Breakdown</h3>
                {/* To be implemented */}
              </div>
            )}
            
            {chartDetailType === 'trend' && (
              <div className="space-y-6">
                <TrendIndicator 
                  logs={hydrationLogs}
                  goal={hydrationGoal}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weekly comparison chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Week-over-Week Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsBarChart
                          data={(() => {
                            const now = new Date();
                            const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
                            const lastWeekStart = subDays(currentWeekStart, 7);
                            
                            // Get days for current and last week
                            const daysCurrentWeek = eachDayOfInterval({
                              start: currentWeekStart,
                              end: now
                            });
                            
                            const daysLastWeek = eachDayOfInterval({
                              start: lastWeekStart,
                              end: subDays(now, 7)
                            });
                            
                            // Create comparison data
                            return daysCurrentWeek.map((date, index) => {
                              const dayName = format(date, 'EEE');
                              
                              // Get logs for this day in current week
                              const currentDayLogs = hydrationLogs.filter(log => {
                                const logDate = new Date(log.timestamp);
                                return isSameDay(logDate, date);
                              });
                              
                              // Get logs for this day in last week
                              const lastWeekDate = daysLastWeek[index];
                              const lastWeekDayLogs = hydrationLogs.filter(log => {
                                const logDate = new Date(log.timestamp);
                                return isSameDay(logDate, lastWeekDate);
                              });
                              
                              // Calculate totals
                              const currentDayTotal = currentDayLogs.reduce(
                                (sum, log) => sum + log.amount, 0
                              );
                              
                              const lastWeekDayTotal = lastWeekDayLogs.reduce(
                                (sum, log) => sum + log.amount, 0
                              );
                              
                              return {
                                name: dayName,
                                current: currentDayTotal,
                                previous: lastWeekDayTotal,
                                goal: hydrationGoal
                              };
                            });
                          })()}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `${value}`}
                          />
                          <ChartTooltip cursor={{ opacity: 0.5 }} />
                          <Bar dataKey="current" name="This Week" fill="#5271ff" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="previous" name="Last Week" fill="#5271ff40" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Consistency analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Consistency Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        // Calculate consistency metrics
                        const now = new Date();
                        const last14Days = eachDayOfInterval({
                          start: subDays(now, 13),
                          end: now
                        });
                        
                        // Count days with logs
                        const daysWithHydration = new Set(
                          hydrationLogs
                            .filter(log => {
                              const logDate = new Date(log.timestamp);
                              return logDate >= subDays(now, 13);
                            })
                            .map(log => format(new Date(log.timestamp), 'yyyy-MM-dd'))
                        );
                        
                        // Calculate streak
                        let currentStreak = 0;
                        for (let i = 0; i < last14Days.length; i++) {
                          const dateStr = format(last14Days[last14Days.length - 1 - i], 'yyyy-MM-dd');
                          if (daysWithHydration.has(dateStr)) {
                            currentStreak++;
                          } else if (i > 0) {
                            break;
                          }
                        }
                        
                        // Check for patterns
                        let endDayLogPattern = false;
                        let hasMissedConsecutiveDays = false;
                        
                        // Check for end of day logs (indicating user logs all at once)
                        const endDayLogs = hydrationLogs.filter(log => {
                          const logDate = new Date(log.timestamp);
                          const hour = logDate.getHours();
                          return hour >= 21; // After 9pm
                        }).length;
                        
                        const totalLogs = hydrationLogs.length;
                        const endDayLogPercent = totalLogs > 0 ? (endDayLogs / totalLogs) * 100 : 0;
                        
                        // Dark pattern detected if more than 50% of logs are after 9pm
                        endDayLogPattern = endDayLogPercent > 50;
                        
                        // Check for consecutive days without hydration
                        const missedDaysCount = last14Days.length - daysWithHydration.size;
                        let consecutiveMissed = 0;
                        let maxConsecutiveMissed = 0;
                        
                        for (const day of last14Days) {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          if (!daysWithHydration.has(dateStr)) {
                            consecutiveMissed++;
                            maxConsecutiveMissed = Math.max(maxConsecutiveMissed, consecutiveMissed);
                          } else {
                            consecutiveMissed = 0;
                          }
                        }
                        
                        hasMissedConsecutiveDays = maxConsecutiveMissed >= 3;
                        
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/50 p-3 rounded-lg text-center">
                                <p className="text-2xl font-bold">
                                  {Math.round(daysWithHydration.size / last14Days.length * 100)}%
                                </p>
                                <p className="text-xs text-muted-foreground">14-day consistency</p>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg text-center">
                                <p className="text-2xl font-bold">{currentStreak} days</p>
                                <p className="text-xs text-muted-foreground">Current streak</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2 text-sm">Pattern Analysis</h4>
                              
                              {endDayLogPattern && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                                  <Flame className="h-4 w-4 text-amber-500" />
                                  <div>
                                    <p className="text-xs font-medium">
                                      End-day logging detected
                                    </p>
                                    <p className="text-xs">
                                      {Math.round(endDayLogPercent)}% of your logs are after 9pm
                                    </p>
                                  </div>
                                  <button 
                                    className="ml-auto text-xs text-blue-600 hover:underline"
                                    onClick={() => {
                                      setDarkPatternType('end_day_log');
                                      setShowDarkPatternAlert(true);
                                    }}
                                  >
                                    View
                                  </button>
                                </div>
                              )}
                              
                              {hasMissedConsecutiveDays && (
                                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                                  <Flame className="h-4 w-4 text-amber-500" />
                                  <div>
                                    <p className="text-xs font-medium">
                                      Consecutive missed days
                                    </p>
                                    <p className="text-xs">
                                      {maxConsecutiveMissed} days in a row with no hydration logged
                                    </p>
                                  </div>
                                  <button 
                                    className="ml-auto text-xs text-blue-600 hover:underline"
                                    onClick={() => {
                                      setDarkPatternType('missed_days');
                                      setShowDarkPatternAlert(true);
                                    }}
                                  >
                                    View
                                  </button>
                                </div>
                              )}
                              
                              {!endDayLogPattern && !hasMissedConsecutiveDays && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="text-xs font-medium">
                                      Healthy hydration pattern
                                    </p>
                                    <p className="text-xs">
                                      You're maintaining consistent hydration habits!
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <OtherDrinkModal
        isOpen={showOtherDrinkModal}
        onClose={() => setShowOtherDrinkModal(false)}
        onConfirm={handleOtherDrink}
      />

      <AIMotivationPopup
        isOpen={showMotivationPopup}
        onClose={() => setShowMotivationPopup(false)}
        motivation={aiMotivation}
        loading={loadingMotivation}
        onRefresh={() => fetchMotivationData()}
      />
      
      {/* Dark pattern alert dialog */}
      <Dialog open={showDarkPatternAlert} onOpenChange={setShowDarkPatternAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              {darkPatternType === 'end_day_log' ? 'End-of-day Logging Pattern' : 'Missed Days Pattern'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {darkPatternType === 'end_day_log' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-800 mb-2">What we noticed:</h3>
                  <p className="text-sm text-amber-800">
                    A significant portion of your hydration logs happen after 9pm. This often indicates logging water all at once at the end of the day, rather than when you actually drink it.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Why this matters:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>You may not be spreading hydration throughout the day</li>
                    <li>This can lead to less accurate tracking of your actual habits</li>
                    <li>Optimal hydration happens when water intake is distributed evenly</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Try to log water right after you drink it</li>
                    <li>Use the quick-add button throughout the day</li>
                    <li>Set reminders to drink water at regular intervals</li>
                  </ul>
                </div>
              </>
            )}
            
            {darkPatternType === 'missed_days' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-800 mb-2">What we noticed:</h3>
                  <p className="text-sm text-amber-800">
                    You have multiple consecutive days with no logged hydration. This could mean you're not tracking consistently or actually missing your hydration goals.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Why this matters:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Consistent hydration is key to wellness benefits</li>
                    <li>Gaps in tracking make it harder to see patterns</li>
                    <li>Missing multiple days can break healthy habits</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Set daily reminders to log your hydration</li>
                    <li>Try to maintain a consistent drinking schedule</li>
                    <li>Use the FAB button throughout the day for quick logging</li>
                    <li>Enable SMS reminders in settings for extra prompts</li>
                  </ul>
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDarkPatternAlert(false)}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowDarkPatternAlert(false);
                  router.push('/settings');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Adjust Settings
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
