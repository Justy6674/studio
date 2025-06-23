'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHydration } from '@/contexts/HydrationContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Award, Calendar, Activity, Settings, Loader2 } from 'lucide-react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { BadgeSystem } from '@/components/gamification/BadgeSystem';
import { BadgeCelebration } from '@/components/celebrations/BadgeCelebration';
import { BadgeTester } from '@/components/gamification/BadgeTester';
import { BodyMetricsForm } from '@/components/BodyMetricsForm';
import { BodyMetricsDisplay } from '@/components/BodyMetricsDisplay';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const { hydrationPercentage } = useHydration();
  const router = useRouter();
  const { toast } = useToast();
  const [joinDate, setJoinDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newBadge, setNewBadge] = useState<any>(null);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  useEffect(() => {
    if (user?.metadata?.creationTime) {
      setJoinDate(format(new Date(user.metadata.creationTime), 'dd MMM yyyy'));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <div className="space-y-6">
          {/* User info card skeleton */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-24 mt-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardFooter>
          </Card>
          
          {/* Achievements card skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          
          {/* Body metrics display skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
          
          {/* Body metrics form skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    
    try {
      // Force reload the page to refresh data
      window.location.reload();
      
      // Success message
      toast({
        title: "Profile refreshed",
        description: "Your profile data has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!user || isRefreshing}>
      <div className="container mx-auto px-4 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="space-y-6">
        {/* User info card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback>{user.displayName?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.displayName || 'User'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="mt-1">
                <Badge variant="outline">{userProfile?.subscriptionStatus === 'active' ? 'Premium' : 'Free'} Account</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center justify-center p-3 bg-secondary/30 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{joinDate || 'Recently'}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-secondary/30 rounded-lg">
                <Activity className="h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-sm text-muted-foreground">Hydration Today</p>
                <p className="font-medium">{hydrationPercentage}%</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </CardFooter>
        </Card>
        
        {/* Streak card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Streaks
            </CardTitle>
            <CardDescription>Your hydration journey stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-primary">{userProfile?.dailyStreak || 0}</p>
                <p className="text-sm text-muted-foreground text-center">Current Streak (days)</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
                <p className="text-3xl font-bold text-primary">{userProfile?.longestStreak || 0}</p>
                <p className="text-sm text-muted-foreground text-center">Best Streak (days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Badges & Achievements */}
        <BadgeSystem 
          userProfile={userProfile} 
          onBadgeEarned={(badge) => {
            setNewBadge(badge);
            setShowBadgeCelebration(true);
          }} 
        />
        
        {/* Badge Tester - For development only */}
        <div className="mt-8">
          <BadgeTester />
        </div>
        
        {/* Badge celebration modal */}
        {showBadgeCelebration && newBadge && (
          <BadgeCelebration 
            badge={newBadge} 
            onDismiss={() => setShowBadgeCelebration(false)} 
          />
        )}
        
        <BodyMetricsDisplay />
        <BodyMetricsForm />
      </div>
      </div>
    </PullToRefresh>
  );
}
