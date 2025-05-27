
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Heart, Target, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-water-50 via-cream-50 to-earth-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-water-500 rounded-full">
              <Droplets className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            AI-Powered Hydration Tracker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Stay perfectly hydrated with personalized reminders, AI motivation, and intelligent insights 
            tailored to your lifestyle.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="bg-water-500 hover:bg-water-600">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-water-200 dark:border-gray-700">
            <CardHeader>
              <div className="p-3 bg-water-100 dark:bg-water-900 rounded-lg w-fit">
                <Zap className="h-6 w-6 text-water-600 dark:text-water-400" />
              </div>
              <CardTitle>AI Motivation</CardTitle>
              <CardDescription>
                Get personalized motivational messages powered by Google Gemini AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Smart coaching that adapts to your progress and keeps you motivated throughout the day.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cream-200 dark:border-gray-700">
            <CardHeader>
              <div className="p-3 bg-cream-100 dark:bg-cream-900 rounded-lg w-fit">
                <Target className="h-6 w-6 text-cream-600 dark:text-cream-400" />
              </div>
              <CardTitle>Smart Reminders</CardTitle>
              <CardDescription>
                Intelligent SMS reminders via Twilio based on your schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Never miss your hydration goals with timely, contextual reminders.
              </p>
            </CardContent>
          </Card>

          <Card className="border-earth-200 dark:border-gray-700">
            <CardHeader>
              <div className="p-3 bg-earth-100 dark:bg-earth-900 rounded-lg w-fit">
                <Heart className="h-6 w-6 text-earth-600 dark:text-earth-400" />
              </div>
              <CardTitle>Health Insights</CardTitle>
              <CardDescription>
                Track your progress with beautiful visualizations and streaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Understand your hydration patterns and celebrate your achievements.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to optimize your hydration?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users who have transformed their health with AI-powered hydration tracking.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-water-500 to-water-600 hover:from-water-600 hover:to-water-700">
            <Link href="/dashboard">Try Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
