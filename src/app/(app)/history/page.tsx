'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getHydrationLogs } from '@/app/actions/hydration';
import { HydrationLog } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { InteractiveBarChart } from '@/components/history/InteractiveBarChart';
import { VirtualizedLogList } from '@/components/history/VirtualizedLogList';

export default function HistoryPage() {
  const { user } = useAuth();
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    try {
      const logs = await getHydrationLogs(user.uid);
      setHydrationLogs(logs);
      return logs;
    } catch (error) {
      console.error("Error fetching hydration logs:", error);
      toast({
        title: "Failed to load hydration data",
        description: "Please pull down to refresh or try again later",
        variant: "destructive"
      });
      throw error;
    }
  }, [user, toast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchLogs();
      toast({
        title: "Refreshed",
        description: "Your hydration data has been updated",
        duration: 2000,
      });
    } catch (error) {
      // Error already handled in fetchLogs
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchLogs, toast]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchLogs()
        .then(() => setIsLoading(false))
        .catch(() => setIsLoading(false));
    }
  }, [user, fetchLogs]);

  // Process data for daily view with enhanced information
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dayLogs = hydrationLogs.filter(log => isSameDay(new Date(log.timestamp), date));
    const totalAmount = dayLogs.reduce((sum, log) => sum + log.amount, 0);
    
    return {
      date: format(date, 'dd MMM'),
      amount: totalAmount,
      rawDate: date, // Store the actual date for detailed view
    };
  }).reverse();

  // Process data for logs list
  const sortedLogs = [...hydrationLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Enhanced skeleton loading state for improved UX
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hydration History</h1>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        
        <div className="grid w-full grid-cols-2 p-1 bg-secondary/80 rounded-md">
          <Skeleton className="py-2 px-4 text-center h-10 rounded-md" />
          <Skeleton className="py-2 px-4 text-center h-10 rounded-md" />
        </div>
        
        {/* Daily Summary Tab Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <div className="flex items-end justify-between h-full w-full px-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 w-1/8">
                    <Skeleton className={`w-full rounded-md`} 
                      style={{ 
                        height: `${Math.max(20, Math.random() * 150)}px`,
                      }} 
                    />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center">
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          </CardContent>
        </Card>
        
        {/* Individual Logs Tab Skeleton */}
        <Card className="mt-4">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-3">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container mx-auto px-4 py-8 space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hydration History</h1>
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh hydration data"
            className="h-9 w-9 rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Daily Summary</TabsTrigger>
            <TabsTrigger value="logs">Individual Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>7-Day Overview</CardTitle>
                <CardDescription>Your hydration intake for the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <InteractiveBarChart data={dailyData} logs={hydrationLogs} />
                </div>
                
                <div className="mt-4 text-xs text-center text-muted-foreground">
                  <p>Tap on any bar to see detailed entries for that day</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your individual hydration logs</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Virtualized list for performance optimization */}
                <VirtualizedLogList 
                  logs={sortedLogs} 
                  height={Math.min(60 * sortedLogs.length, 400)} // Adapt height based on number of logs
                  className="pr-2" 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}
