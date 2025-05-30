'use client';

import React, { useState } from 'react';
import { SubscriptionManager } from '@/components/billing/SubscriptionManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Crown, CreditCard, Clock, CheckCircle } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Mock user subscription data - replace with actual Firebase query
  const currentTier = 'free' as 'free' | 'premium';
  const subscriptionStatus = 'inactive';

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Redirect to Stripe checkout
      window.open('https://buy.stripe.com/7sIg1FgK8fPv5hGaEF', '_blank');
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // Redirect to Stripe customer portal
      // TODO: Implement customer portal redirect
      console.log('Manage subscription');
    } catch (error) {
      console.error('Manage subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-hydration-400" />
            <h1 className="text-4xl font-bold text-white">
              Subscription & Billing
            </h1>
          </div>
          <p className="text-cream-300 text-lg max-w-2xl mx-auto">
            Unlock AI-powered hydration coaching and accelerate your weight loss journey
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="bg-slate-700 border-brown-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-hydration-400" />
                  Current Plan
                </CardTitle>
                <CardDescription className="text-cream-300">
                  Your subscription status and billing information
                </CardDescription>
              </div>
              <Badge 
                variant={currentTier === 'premium' ? 'default' : 'secondary'}
                className={currentTier === 'premium' ? 'bg-hydration-400 text-white' : 'bg-brown-500 text-white'}
              >
                {currentTier === 'premium' ? 'Premium' : 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-600/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-hydration-400" />
                  <span className="text-sm font-medium text-white">Status</span>
                </div>
                <div className="text-cream-300">
                  {currentTier === 'premium' ? subscriptionStatus : 'Free Plan'}
                </div>
              </div>
              
              <div className="bg-slate-600/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-hydration-400" />
                  <span className="text-sm font-medium text-white">Billing</span>
                </div>
                <div className="text-cream-300">
                  {currentTier === 'premium' ? '$4.99 AUD/month' : 'No charges'}
                </div>
              </div>

              <div className="bg-slate-600/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-hydration-400" />
                  <span className="text-sm font-medium text-white">Features</span>
                </div>
                <div className="text-cream-300">
                  {currentTier === 'premium' ? 'AI + SMS + Analytics' : 'Basic tracking'}
                </div>
              </div>
            </div>

            {currentTier === 'premium' && (
              <div className="mt-4 p-4 bg-hydration-400/10 border border-hydration-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Premium Subscription Active</h3>
                    <p className="text-cream-300 text-sm">
                      Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline"
                    className="border-hydration-400 text-hydration-400 hover:bg-hydration-400 hover:text-white"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Manager */}
        <SubscriptionManager
          currentTier={currentTier}
          subscriptionStatus={subscriptionStatus}
          onUpgrade={handleUpgrade}
          onManage={handleManageSubscription}
        />

        {/* Billing History */}
        <Card className="bg-slate-700 border-brown-500/30">
          <CardHeader>
            <CardTitle className="text-white">Billing History</CardTitle>
            <CardDescription className="text-cream-300">
              Your recent transactions and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-brown-500 mx-auto mb-4" />
              <p className="text-cream-300">No billing history available</p>
              <p className="text-cream-400 text-sm mt-2">
                Transactions will appear here after your first payment
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="bg-slate-700 border-brown-500/30">
          <CardHeader>
            <CardTitle className="text-white">Need Help?</CardTitle>
            <CardDescription className="text-cream-300">
              Billing questions and support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-hydration-400 mt-1" />
                <div>
                  <h4 className="text-white font-medium">30-Day Money-Back Guarantee</h4>
                  <p className="text-cream-300 text-sm">
                    Not satisfied? Get a full refund within 30 days, no questions asked.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-hydration-400 mt-1" />
                <div>
                  <h4 className="text-white font-medium">Cancel Anytime</h4>
                  <p className="text-cream-300 text-sm">
                    No long-term commitments. Cancel your subscription anytime from your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-hydration-400 mt-1" />
                <div>
                  <h4 className="text-white font-medium">Secure Payments</h4>
                  <p className="text-cream-300 text-sm">
                    All payments processed securely through Stripe. We never store your card details.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 