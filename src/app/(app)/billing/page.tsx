"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

export default function BillingPage() {
  const { user, userProfile, hasActiveSubscription, isSubscriptionLoading, logOut } = useAuth();
  const router = useRouter();
  const [isStripeBuyButtonLoaded, setIsStripeBuyButtonLoaded] = useState(false);

  // Redirect if user has active subscription
  useEffect(() => {
    if (user && !isSubscriptionLoading && hasActiveSubscription()) {
      router.push("/dashboard");
    }
  }, [user, hasActiveSubscription, isSubscriptionLoading, router]);

  // Load Stripe Buy Button script
  useEffect(() => {
    const loadStripeScript = () => {
      if (document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
        setIsStripeBuyButtonLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = "https://js.stripe.com/v3/buy-button.js";
      script.async = true;
      script.onload = () => setIsStripeBuyButtonLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Stripe Buy Button script");
        setIsStripeBuyButtonLoaded(false);
      };
      document.head.appendChild(script);
    };

    loadStripeScript();
  }, []);

  const openCustomerPortal = () => {
    // In a real implementation, you'd call your backend to create a customer portal session
    // For now, we'll just open the Stripe customer portal directly
    window.open("https://billing.stripe.com/p/login/test_123", "_blank");
  };

  const openDirectLink = () => {
    window.open("https://buy.stripe.com/fZu5kvexV0Mf3Qr3Dsf3a03", "_blank");
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
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-96 bg-slate-800" />
          <Skeleton className="h-96 bg-slate-800 rounded-xl" />
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

        {/* Subscription Status Alert */}
        {userProfile?.subscriptionStatus === 'canceled' && (
          <Alert className="bg-red-900/20 border-red-700">
            <Droplets className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Your subscription has been cancelled. Please subscribe to continue using Water4WeightLoss.
            </AlertDescription>
          </Alert>
        )}

        {!hasActiveSubscription() && (
          <Alert className="bg-blue-900/20 border-blue-700">
            <Droplets className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              You need an active subscription to access the full Water4WeightLoss experience.
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Badge className="bg-hydration-500 text-white">All Features</Badge>
            </div>
            <CardTitle className="text-2xl text-slate-100">Water4WeightLoss</CardTitle>
            <CardDescription className="text-slate-400">
              Complete hydration tracking with AI coaching
            </CardDescription>
            <div className="text-4xl font-bold text-hydration-400 mt-4">
              $9.95 AUD<span className="text-lg text-slate-400">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
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
              {isStripeBuyButtonLoaded ? (
                <div className="flex justify-center">
                  <stripe-buy-button
                    buy-button-id="buy_btn_1RUbr801xl09Ntf40fasOqrK"
                    publishable-key="pk_live_51Q8bcy01xl09Ntf4KyX7ax9zvGm8Rg4yXv0eluw1thBvHuW6NNU5eMXnkyxPfdMYkL2Nj8q51HlivCa6xxoC6TXY00CRxbXhKI"
                  ></stripe-buy-button>
                </div>
              ) : (
                <Button 
                  onClick={openDirectLink}
                  className="w-full bg-hydration-500 hover:bg-hydration-600 text-white text-lg py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Subscribe Now - $9.95 AUD/month
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {/* Fallback Direct Link */}
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Having trouble? Use our direct link:</p>
                <Button 
                  variant="outline" 
                  onClick={openDirectLink}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Direct Checkout
                </Button>
              </div>
            </div>

            {/* Manage Subscription for existing customers */}
            {userProfile?.stripeCustomerId && (
              <div className="border-t border-slate-700 pt-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-slate-400">Already a customer?</p>
                  <Button 
                    variant="outline" 
                    onClick={openCustomerPortal}
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