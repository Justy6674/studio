
"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, ArrowRight, User, Clock } from "lucide-react";

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Droplets className="h-8 w-8 text-blue-500 animate-pulse" />
          <div className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (user) {
    // Welcome back screen for returning users
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <Droplets className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Back!
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                {userProfile?.displayName || user.email || "Hydration Champion"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <User className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.email}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ready to track your hydration
              </span>
            </div>

            <Link href="/dashboard" className="block">
              <Button className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Welcome screen for new users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <Droplets className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Water4WeightLoss
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Track your hydration journey and achieve your wellness goals
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/signup" className="block">
            <Button className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white">
              Sign Up
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full h-12 text-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
