"use client";

import { useState, useEffect } from "react";
import { SettingsForm } from "@/components/SettingsForm";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, userProfile, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Force reload the page to refresh settings
      window.location.reload();
      
      toast({
        title: "Settings refreshed",
        description: "Your settings have been updated.",
      });
    } catch (error) {
      console.error("Error refreshing settings:", error);
      toast({
        title: "Error",
        description: "Failed to refresh your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Skeleton loading state for improved UX
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and notification preferences.</p>
        </div>
        
        {/* Profile & Goals Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications & Reminders Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* App Settings Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
        
        {/* Legal & Support Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
        
        {/* Save Button Skeleton */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
      <div className="container mx-auto px-4 py-8 space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and notification preferences.</p>
        </div>
        <SettingsForm />
      </div>
    </PullToRefresh>
  );
}
