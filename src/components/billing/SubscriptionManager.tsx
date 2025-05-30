'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Droplets, Zap, MessageCircle, Phone, Award } from 'lucide-react';

interface SubscriptionManagerProps {
  currentTier: 'free' | 'premium';
  subscriptionStatus?: string;
  onUpgrade: () => void;
  onManage: () => void;
  className?: string;
}

const features = {
  free: [
    'Basic hydration tracking',
    'Manual water logging',
    'Daily intake summary',
    'Basic progress tracking'
  ],
  premium: [
    'All free features',
    'AI-powered motivation messages',
    'Smart SMS reminders',
    'Advanced analytics & insights',
    'Weekly AI coaching',
    'Customizable reminder tones',
    'Progress charts & trends',
    'Goal adjustment recommendations'
  ]
};

export function SubscriptionManager({ 
  currentTier, 
  subscriptionStatus,
  onUpgrade, 
  onManage,
  className = '' 
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade();
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = currentTier === 'premium';
  const isActive = subscriptionStatus === 'active';

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Choose Your Hydration Journey
        </h2>
        <p className="text-muted-foreground text-center text-lg">
          Unlock AI-powered insights and personalised coaching to accelerate your weight loss through proper hydration
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <Card className="bg-[#1e293b] border-[#b68a71]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#5271ff]" />
                  Basic Hydration
                </CardTitle>
                <CardDescription className="text-white/70">
                  Perfect for getting started
                </CardDescription>
              </div>
              {!isPremium && (
                <Badge variant="secondary" className="bg-[#b68a71] text-white">
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-white">Free</span>
              <span className="text-white/70 ml-2">forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#5271ff]" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Tier */}
        <Card className={`border-2 ${isPremium ? 'border-[#5271ff] bg-[#5271ff]/5' : 'border-[#5271ff]/50'} bg-[#1e293b] relative overflow-hidden`}>
          {/* Premium Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-[#5271ff] to-[#b68a71] text-white px-4 py-2 text-xs font-bold transform rotate-12 translate-x-8 translate-y-2">
            PREMIUM
          </div>
          
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#5271ff]" />
                  Premium Hydration
                </CardTitle>
                <CardDescription className="text-white/70">
                  AI-powered weight loss support
                </CardDescription>
              </div>
              {isPremium && isActive && (
                <Badge className="bg-[#5271ff] text-white">
                  Active
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-white">$6.99</span>
              <span className="text-white/70 ml-2">AUD/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#5271ff]" />
                  <span className="text-white/80 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#5271ff]/10 border border-[#5271ff]/30 rounded-lg p-3">
                <MessageCircle className="w-6 h-6 text-[#5271ff] mb-2" />
                <div className="text-white text-sm font-medium">AI Coaching</div>
                <div className="text-white/60 text-xs">Personalised daily motivation</div>
              </div>
              <div className="bg-[#5271ff]/10 border border-[#5271ff]/30 rounded-lg p-3">
                <Phone className="w-6 h-6 text-[#5271ff] mb-2" />
                <div className="text-white text-sm font-medium">SMS Reminders</div>
                <div className="text-white/60 text-xs">Smart hydration alerts</div>
              </div>
              <div className="bg-[#5271ff]/10 border border-[#5271ff]/30 rounded-lg p-3">
                <Zap className="w-6 h-6 text-[#5271ff] mb-2" />
                <div className="text-white text-sm font-medium">Analytics</div>
                <div className="text-white/60 text-xs">Advanced progress insights</div>
              </div>
              <div className="bg-[#5271ff]/10 border border-[#5271ff]/30 rounded-lg p-3">
                <Award className="w-6 h-6 text-[#5271ff] mb-2" />
                <div className="text-white text-sm font-medium">Priority Support</div>
                <div className="text-white/60 text-xs">Dedicated assistance</div>
              </div>
            </div>

            {/* Action Button */}
            {isPremium && isActive ? (
              <Button 
                onClick={onManage}
                variant="outline" 
                className="w-full border-[#b68a71] text-[#b68a71] hover:bg-[#b68a71] hover:text-white"
              >
                Manage Subscription
              </Button>
            ) : (
              <Button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#5271ff] to-[#b68a71] hover:from-[#4153cc] hover:to-[#9a6b5a] text-white font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `Upgrade to Premium - $6.99 AUD/month`
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Money Back Guarantee */}
      <div className="text-center mt-8 p-6 bg-[#1e293b]/50 border border-[#b68a71]/30 rounded-lg">
        <h3 className="text-white font-semibold mb-2">30-Day Money-Back Guarantee</h3>
        <p className="text-white/70 text-sm">
          Not satisfied with your hydration journey? Get a full refund within 30 days, no questions asked.
        </p>
      </div>
    </div>
  );
} 