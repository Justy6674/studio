"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/contexts/AuthContext";
import { LogWaterForm } from "@/components/water/LogWaterForm";
import { HydrationProgressRing } from "@/components/water/HydrationProgressRing";
import { AIMotivationPopup } from "@/components/water/AIMotivationPopup";
import { BodyMetricsTracker } from "@/components/metrics/BodyMetricsTracker";
import { getHydrationLogs, getAIMotivation, logHydration, logOtherDrink } from "@/lib/hydration";
import type { HydrationLog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Droplets, Target, Scale, FileText, BookOpen, Flame, Lock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { OnboardingTip } from "@/components/onboarding/OnboardingTip";
import { StreakCelebration } from "@/components/celebrations/StreakCelebration";
import { MilestoneCelebration } from "@/components/celebrations/MilestoneCelebration";
import { HydrationCelebration } from "@/components/celebrations/HydrationCelebration";
import OtherDrinkModal from '@/components/OtherDrinkModal';
import DrinkCelebration from '@/components/celebrations/DrinkCelebration';
import { InfoCards } from '@/components/info/InfoCards';
import ExportCenter from "@/components/export/ExportCenter";
import { StreakTracker } from "@/components/water/StreakTracker";

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
  const [aiMotivation, setAIMotivation] = useState<string>("");
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [milestoneCelebrated, setMilestoneCelebrated] = useState(0);
  const [showMotivationPopup, setShowMotivationPopup] = useState(false);

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

  const userName = userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';
  const hydrationGoal = userProfile?.hydrationGoal || 2000;

  const hydrationPercentage = useMemo(() => {
    if (hydrationGoal === 0) return 0;
    return (currentIntake / hydrationGoal) * 100;
  }, [currentIntake, hydrationGoal]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      const logs = await getHydrationLogs();
      setHydrationLogs(logs);
      
      const today = startOfDay(new Date());
      const todayLogs = logs.filter(log => {
        const logDate = startOfDay(new Date(log.timestamp));
        return isSameDay(logDate, today);
      });
      
      const todayIntake = todayLogs.reduce((sum, log) => sum + (log.hydrationValue || log.amount), 0);
      setCurrentIntake(todayIntake);
      
      // Calculate streaks using deployed Firebase Function
      try {
        const streakResponse = await fetch('https://us-central1-hydrateai-ayjow.cloudfunctions.net/getStreaks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid
          }),
        });

        if (streakResponse.ok) {
          const streakData = await streakResponse.json();
          const currentStreak = streakData.currentStreak || 0;
          const maxStreak = streakData.longestStreak || 0;
          
          // Celebrate streak milestones
          if (currentStreak > 0 && (currentStreak === 3 || currentStreak === 7 || currentStreak % 10 === 0)) {
            setShowStreakCelebration(true);
            setTimeout(() => setShowStreakCelebration(false), 3000);
          }
          
          setDailyStreak(currentStreak);
          setLongestStreak(maxStreak);
        } else {
          // Fallback to client-side calculation if Firebase Function fails
          const dailyTotals = calculateDailyTotals(logs);
          const { currentStreak, longestStreak: maxStreak } = calculateStreaks(dailyTotals, hydrationGoal);
          
          setDailyStreak(currentStreak);
          setLongestStreak(maxStreak);
        }
      } catch (streakError) {
        console.error('Error fetching streaks from Firebase Function, falling back to client-side calculation:', streakError);
        // Fallback to client-side calculation
        const dailyTotals = calculateDailyTotals(logs);
        const { currentStreak, longestStreak: maxStreak } = calculateStreaks(dailyTotals, hydrationGoal);
        
        setDailyStreak(currentStreak);
        setLongestStreak(maxStreak);
      }
      
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error('Error fetching dashboard data:', error);
      } else {
        console.error('Error fetching dashboard data:', error);
      }
    }
  }, [user, hydrationGoal]);

  const fetchMotivation = useCallback(async () => {
    if (!user) return;
    
    setLoadingMotivation(true);
    try {
      const result = await getAIMotivation(hydrationGoal);
      setAIMotivation(result.message);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error('Error fetching AI motivation:', error);
      } else {
        console.error('Error fetching AI motivation:', error);
      }
    } finally {
      setLoadingMotivation(false);
    }
  }, [user, hydrationGoal]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Effect to automatically refresh data at midnight
  useEffect(() => {
    const calculateMsUntilMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime() - now.getTime();
    };

    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, calculateMsUntilMidnight());

    return () => clearTimeout(timeoutId);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (currentIntake > 0) {
      fetchMotivation();
    }
  }, [fetchMotivation, currentIntake]);

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

  if (isSubscriptionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 space-y-4">
          <Skeleton className="w-3/4 h-8 mx-auto" />
          <Skeleton className="w-full h-48" />
          <div className="flex justify-between">
            <Skeleton className="w-1/3 h-12" />
            <Skeleton className="w-1/3 h-12" />
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
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 mx-auto">
      
      {/* Celebrations Layer */}
      {showStreakCelebration && <StreakCelebration streak={dailyStreak} isNewRecord={longestStreak === dailyStreak && dailyStreak > 0} onDismiss={() => setShowStreakCelebration(false)} />}
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
            <span className="hidden xs:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden xs:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden xs:inline">Export</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden xs:inline">Info</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="w-full rounded-2xl p-4 space-y-4">
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
            <Card className="w-full rounded-2xl p-4 space-y-4">
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

          <Card className="w-full rounded-2xl p-4 space-y-4">
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

          <Card className="w-full rounded-2xl p-4 space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
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
        <TabsContent value="metrics" className="space-y-4">
          <div className="w-full">
            <BodyMetricsTracker />
          </div>
        </TabsContent>
        <TabsContent value="exports" className="space-y-4">
          <div className="w-full">
            <ExportCenter
              userName={userName}
              hydrationLogs={hydrationLogs}
            />
          </div>
        </TabsContent>
        <TabsContent value="info" className="space-y-4">
          <div className="w-full">
            <InfoCards />
          </div>
        </TabsContent>
      </Tabs>

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
        onRefresh={fetchMotivation}
      />
    </div>
  );
}
