"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getHydrationLogs } from "@/lib/hydration";
import type { HydrationLog } from "@/lib/types";
import { format, subDays, differenceInDays } from "date-fns";
import { AuthStateDebugger } from "@/components/debug/AuthStateDebugger";
import { 
  User, 
  Droplets, 
  Award, 
  Calendar, 
  Target, 
  TrendingUp, 
  Mail, 
  Phone,
  Edit,
  Crown,
  Flame,
  Star
} from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalDays: 0,
    totalIntake: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageDailyIntake: 0,
    daysAboveGoal: 0,
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Array<{
    id: string;
    title: string;
    description: string;
    icon: any;
    earned: boolean;
    progress?: number;
    total?: number;
  }>>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      loadProfileStats();
    }
  }, [user]);

  const loadProfileStats = async () => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get all logs for comprehensive stats
      const allLogs = await getHydrationLogs();
      // Filter to last 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const logs = allLogs.filter(log => 
        log.timestamp.getTime() >= cutoffDate.getTime()
      );
      
      if (logs.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
      const totalLogs = logs.length;
      
      // Group by day
      const dayGroups = logs.reduce((acc, log) => {
        const day = format(log.timestamp, 'yyyy-MM-dd');
        if (!acc[day]) acc[day] = [];
        acc[day].push(log);
        return acc;
      }, {} as Record<string, HydrationLog[]>);

      const dailySums = Object.entries(dayGroups).map(([date, dayLogs]) => ({
        date,
        total: dayLogs.reduce((sum, log) => sum + log.amount, 0),
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalDays = dailySums.length;
      const averageDailyIntake = totalIntake / totalDays;
      const daysAboveGoal = dailySums.filter(day => day.total >= (userProfile.hydrationGoal || 2000)).length;
      
      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (let i = dailySums.length - 1; i >= 0; i--) {
        if (dailySums[i].total >= (userProfile.hydrationGoal || 2000)) {
          tempStreak++;
          if (i === dailySums.length - 1) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
          if (i === dailySums.length - 1) {
            currentStreak = 0;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      setStats({
        totalDays,
        totalIntake,
        currentStreak,
        longestStreak,
        averageDailyIntake: Math.round(averageDailyIntake),
        daysAboveGoal,
        totalLogs,
      });

      // Calculate achievements
      const achievementList = [
        {
          id: 'first-drop',
          title: 'First Drop',
          description: 'Log your first water intake',
          icon: Droplets,
          earned: totalLogs > 0,
        },
        {
          id: 'week-warrior',
          title: 'Week Warrior',
          description: 'Track water for 7 consecutive days',
          icon: Calendar,
          earned: currentStreak >= 7,
          progress: Math.min(currentStreak, 7),
          total: 7,
        },
        {
          id: 'goal-getter',
          title: 'Goal Getter',
          description: 'Meet your daily hydration goal',
          icon: Target,
          earned: daysAboveGoal > 0,
        },
        {
          id: 'streak-master',
          title: 'Streak Master',
          description: 'Maintain a 30-day streak',
          icon: Flame,
          earned: longestStreak >= 30,
          progress: Math.min(longestStreak, 30),
          total: 30,
        },
        {
          id: 'hydration-hero',
          title: 'Hydration Hero',
          description: 'Log 100 water entries',
          icon: Award,
          earned: totalLogs >= 100,
          progress: Math.min(totalLogs, 100),
          total: 100,
        },
        {
          id: 'consistency-king',
          title: 'Consistency King',
          description: 'Meet goal 10 days in a row',
          icon: Crown,
          earned: currentStreak >= 10,
          progress: Math.min(currentStreak, 10),
          total: 10,
        },
      ];

      setAchievements(achievementList);
    } catch (error) {
      console.error("Error loading profile stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const memberSince = user?.metadata?.creationTime 
    ? format(new Date(user.metadata.creationTime), 'MMMM yyyy')
    : 'Recently';

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please log in to view your profile</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Development Only */}
      <AuthStateDebugger />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Profile
        </h1>
        <p className="text-muted-foreground">Your hydration journey and achievements</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="text-xl">
                  {getInitials(userProfile?.name || user?.email)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfile?.name || user?.email?.split('@')[0] || 'User'}
                </h2>
                
                {/* DEBUG INFO - Remove after fixing */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-xs text-black">
                    <strong>🐛 DEBUG INFO:</strong><br/>
                    User Email: {user?.email || 'None'}<br/>
                    User Display Name: {user?.displayName || 'None'}<br/>
                    Profile Name: {userProfile?.name || 'None'}<br/>
                    Profile Loaded: {userProfile ? 'Yes' : 'No'}<br/>
                    Auth Loading: {loading ? 'Yes' : 'No'}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                {userProfile?.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{userProfile.phoneNumber}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {memberSince}
                </p>
              </div>
            </div>

            <div className="flex-grow" />
            
            <Button variant="outline" className="w-full md:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.totalLogs}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{stats.longestStreak}</div>
            <div className="text-sm text-muted-foreground">Longest Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">
              {((stats.totalIntake / 1000)).toFixed(1)}L
            </div>
            <div className="text-sm text-muted-foreground">Total Intake</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Active Days</span>
                <span className="font-medium">{stats.totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Above Goal</span>
                <span className="font-medium">{stats.daysAboveGoal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {stats.totalDays > 0 ? Math.round((stats.daysAboveGoal / stats.totalDays) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Daily Intake</span>
                <span className="font-medium">{stats.averageDailyIntake}ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Goal</span>
                <span className="font-medium">{userProfile?.hydrationGoal || 2000}ml</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average per Log</span>
                <span className="font-medium">
                  {stats.totalLogs > 0 ? Math.round(stats.totalIntake / stats.totalLogs) : 0}ml
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    achievement.earned
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-muted/50 border-muted'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      achievement.earned ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.earned && (
                          <Badge className="bg-green-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      
                      {achievement.progress !== undefined && achievement.total && !achievement.earned && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.total}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((achievement.progress / achievement.total) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 