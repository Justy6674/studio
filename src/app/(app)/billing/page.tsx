"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  CheckCircle, 
  ExternalLink, 
  Droplets,
  Zap,
  TrendingUp,
  Bell,
  Settings
} from "lucide-react";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZu5kvexV0Mf3Qr3Dsf3a03";
const STRIPE_DISCOUNTED_LINK = "https://buy.stripe.com/test_discounted_link"; // Replace with your actual discounted link
const STRIPE_CUSTOMER_PORTAL = "https://billing.stripe.com/p/login/test_123"; // Replace with your actual portal link

export default function BillingPage() {
  const { user, userProfile, hasActiveSubscription, isSubscriptionLoading, logOut } = useAuth();
  const router = useRouter();

  // Redirect if user already has an active subscription
  useEffect(() => {
    if (user && !isSubscriptionLoading && hasActiveSubscription()) {
      router.push("/dashboard");
    }
  }, [user, hasActiveSubscription, isSubscriptionLoading, router]);

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-slate-400">Please log in to access billing.</p>
            <Button 
              onClick={() => router.push("/login")}
              className="mt-4 bg-hydration-500 hover:bg-hydration-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubscriptionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Skeleton className="w-16 h-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
          </div>

          {/* Subscription Card Skeleton */}
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader className="text-center border-b border-slate-700 pb-4">
              <div className="flex justify-center items-center gap-2">
                <Skeleton className="h-8 w-64 mx-auto" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-10 w-40 mx-auto" />
              </div>
              <Skeleton className="h-5 w-48 mx-auto mt-2" />
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {/* Features List Skeleton */}
              <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full mt-1" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Subscribe Button Skeleton */}
              <div className="space-y-4 pt-4">
                <Skeleton className="h-12 w-full rounded-md" />
              </div>

              {/* Manage Subscription Skeleton */}
              <div className="border-t border-slate-700 pt-4">
                <div className="text-center space-y-3">
                  <Skeleton className="h-5 w-36 mx-auto" />
                  <Skeleton className="h-10 w-48 mx-auto rounded-md" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Skeleton */}
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-5 w-64 mx-auto" />
              <Skeleton className="h-10 w-24 mx-auto rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Droplets, title: "Unlimited Water Tracking", description: "Log unlimited hydration entries with smart analytics" },
    { icon: Zap, title: "AI-Powered Motivation", description: "Personalised motivational messages with multiple tones" },
    { icon: Bell, title: "Smart Reminders", description: "SMS and push notifications to keep you hydrated" },
    { icon: TrendingUp, title: "Advanced Analytics", description: "Detailed progress tracking and streak monitoring" },
    { icon: Settings, title: "Full Customisation", description: "Personalise goals, tones, and notification preferences" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-hydration-400 rounded-full flex items-center justify-center">
              <Droplets className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-hydration-400 to-brown-400 bg-clip-text text-transparent">
            Unlock Your Full Hydration Potential
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Get access to all features and transform your hydration habits with AI-powered insights.
          </p>
        </div>

        {/* Subscription Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="text-center border-b border-slate-700 pb-4">
            <div className="flex justify-center items-center gap-2">
              <h2 className="text-2xl font-semibold text-white">Water4WeightLoss Premium</h2>
            </div>
            <div className="mt-2">
              {userProfile?.isClinicClient ? (
                <>
                  <span className="text-4xl font-bold text-white">$4.98</span>
                  <span className="text-slate-400 ml-1 line-through">$9.95</span>
                  <span className="text-slate-400 ml-1">/ month (AUD)</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">$9.95</span>
                  <span className="text-slate-400 ml-1">/ month (AUD)</span>
                </>
              )}
            </div>
            <p className="text-slate-400 mt-2">
              One simple plan. All features included.
            </p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Features List */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-4 w-4 text-hydration-400" />
                      <span className="font-medium text-slate-200">{feature.title}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscribe Button */}
            <div className="space-y-4 pt-4">
              <Button 
                onClick={() => openLink(userProfile?.isClinicClient ? STRIPE_DISCOUNTED_LINK : STRIPE_PAYMENT_LINK)}
                className="w-full bg-hydration-500 hover:bg-hydration-600 text-white text-lg py-3"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {userProfile?.isClinicClient ? 'Subscribe Now - $4.98 AUD/month (50% off)' : 'Subscribe Now - $9.95 AUD/month'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Manage Subscription for existing customers */}
            {userProfile?.stripeCustomerId && (
              <div className="border-t border-slate-700 pt-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-slate-400">Already a customer?</p>
                  <Button 
                    variant="outline" 
                    onClick={() => openLink(STRIPE_CUSTOMER_PORTAL)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <p className="text-xs text-slate-500">
                    Update payment method, view invoices, or cancel anytime
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <span>✅ Cancel anytime</span>
            <span>✅ Secure payments</span>
            <span>✅ Instant access</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Questions? Contact us at support@water4weightloss.com
            </p>
            <Button 
              variant="ghost" 
              onClick={logOut}
              className="text-slate-400 hover:text-slate-300"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 