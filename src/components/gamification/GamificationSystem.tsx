'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Target, Zap, Crown, Star, Award, Gift } from 'lucide-react';
import { doc, setDoc, getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface AchievementEvent {
  type: 'daily_goal' | 'streak_milestone' | 'hydration_milestone' | 'first_log' | 'perfect_week' | 'volume_milestone';
  value: number;
  milestone?: number;
  streakDays?: number;
  isFirstTime?: boolean;
  timestamp: Date;
}

export interface GamificationProps {
  onAchievement?: (event: AchievementEvent) => void;
  enableAnimations?: boolean;
  enableVibration?: boolean;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
}

const badges: BadgeDefinition[] = [
  {
    id: 'first_sip',
    name: 'First Sip',
    description: 'Logged your first hydration entry',
    icon: Target,
    color: 'text-blue-500',
    rarity: 'common',
    requirement: 'Log your first drink'
  },
  {
    id: 'daily_goal',
    name: 'Daily Champion',
    description: 'Reached your daily hydration goal',
    icon: Medal,
    color: 'text-green-500',
    rarity: 'common',
    requirement: 'Complete daily goal'
  },
  {
    id: 'streak_week',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: Zap,
    color: 'text-yellow-500',
    rarity: 'rare',
    requirement: '7 days in a row'
  },
  {
    id: 'streak_month',
    name: 'Month Master',
    description: 'Maintained a 30-day streak',
    icon: Crown,
    color: 'text-purple-500',
    rarity: 'epic',
    requirement: '30 days in a row'
  },
  {
    id: 'hydration_hero',
    name: 'Hydration Hero',
    description: 'Logged 100 litres total',
    icon: Trophy,
    color: 'text-gold-500',
    rarity: 'epic',
    requirement: '100L total hydration'
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Hit goal every day for a week',
    icon: Star,
    color: 'text-pink-500',
    rarity: 'rare',
    requirement: '7 perfect days'
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    description: 'Exceeded daily goal by 150%',
    icon: Award,
    color: 'text-orange-500',
    rarity: 'rare',
    requirement: '150% of daily goal'
  },
  {
    id: 'legend',
    name: 'Hydration Legend',
    description: 'Maintained a 100-day streak',
    icon: Gift,
    color: 'text-red-500',
    rarity: 'legendary',
    requirement: '100 days in a row'
  }
];

export function GamificationSystem({ onAchievement, enableAnimations = true, enableVibration = true }: GamificationProps) {
  const { user } = useAuth();
  const [activeAchievements, setActiveAchievements] = useState<AchievementEvent[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<BadgeDefinition | null>(null);

  // Confetti configurations for different achievements
  const confettiConfigs = {
    daily_goal: {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#059669', '#34D399']
    },
    streak_milestone: {
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#D97706', '#FCD34D']
    },
    hydration_milestone: {
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#3B82F6', '#1D4ED8', '#60A5FA']
    },
    first_log: {
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#10B981', '#059669', '#047857']
    },
    perfect_week: {
      particleCount: 300,
      spread: 160,
      origin: { y: 0.4 },
      colors: ['#8B5CF6', '#7C3AED', '#A78BFA', '#EC4899', '#F472B6']
    },
    volume_milestone: {
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#06B6D4', '#0891B2', '#67E8F9']
    }
  };

  // Trigger confetti animation
  const triggerConfetti = (achievementType: AchievementEvent['type']) => {
    if (!enableAnimations) return;

    const config = confettiConfigs[achievementType] || confettiConfigs.daily_goal;
    
    // Multiple bursts for better effect
    const burst = () => {
      confetti({
        ...config,
        angle: 60,
        origin: { x: 0.1, y: 0.6 }
      });
      confetti({
        ...config,
        angle: 120,
        origin: { x: 0.9, y: 0.6 }
      });
    };

    burst();
    setTimeout(burst, 200);
    setTimeout(burst, 400);

    // Special effects for rare achievements
    if (achievementType === 'perfect_week' || achievementType === 'streak_milestone') {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          startVelocity: 30,
          gravity: 0.5,
          ticks: 300,
          colors: config.colors,
          origin: { x: 0.5, y: 0.3 }
        });
      }, 600);
    }
  };

  // Trigger device vibration
  const triggerVibration = (achievementType: AchievementEvent['type']) => {
    if (!enableVibration || !('vibrate' in navigator)) return;

    const vibrationPatterns = {
      daily_goal: [200, 100, 200],
      streak_milestone: [300, 100, 300, 100, 300],
      hydration_milestone: [150, 50, 150, 50, 150, 50, 150],
      first_log: [100, 50, 100],
      perfect_week: [400, 200, 400, 200, 400],
      volume_milestone: [250, 150, 250]
    };

    const pattern = vibrationPatterns[achievementType] || vibrationPatterns.daily_goal;
    navigator.vibrate(pattern);
  };

  // Log analytics event to Firestore
  const logAnalyticsEvent = async (event: AchievementEvent, badgeId?: string) => {
    if (!user) return;

    try {
      const db = getFirestore(app);
      const analyticsRef = collection(db, 'analytics_events');
      
      await addDoc(analyticsRef, {
        userId: user.uid,
        type: 'achievement',
        subtype: event.type,
        value: event.value,
        milestone: event.milestone,
        streakDays: event.streakDays,
        isFirstTime: event.isFirstTime,
        badgeId,
        timestamp: event.timestamp,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        metadata: {
          enableAnimations,
          enableVibration,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height
        }
      });

      console.log('Analytics event logged:', event.type);
    } catch (error) {
      console.error('Error logging analytics event:', error);
    }
  };

  // Award badge and save to user profile
  const awardBadge = async (badgeId: string, event: AchievementEvent) => {
    if (!user) return;

    try {
      const db = getFirestore(app);
      const badgeRef = doc(db, 'user_badges', `${user.uid}_${badgeId}`);
      
      await setDoc(badgeRef, {
        userId: user.uid,
        badgeId,
        awardedAt: event.timestamp,
        achievementEvent: event,
        isFirstTime: event.isFirstTime || false
      });

      console.log('Badge awarded:', badgeId);
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  // Process achievement event
  const processAchievement = async (event: AchievementEvent) => {
    if (!enableAnimations) return;

    // Add to active achievements
    setActiveAchievements(prev => [...prev, event]);

    // Trigger confetti and vibration
    triggerConfetti(event.type);
    triggerVibration(event.type);

    // Determine badge to award
    let badgeToAward: BadgeDefinition | null = null;
    
    switch (event.type) {
      case 'first_log':
        badgeToAward = badges.find(b => b.id === 'first_sip') || null;
        break;
      case 'daily_goal':
        badgeToAward = badges.find(b => b.id === 'daily_goal') || null;
        break;
      case 'streak_milestone':
        if (event.streakDays === 7) {
          badgeToAward = badges.find(b => b.id === 'streak_week') || null;
        } else if (event.streakDays === 30) {
          badgeToAward = badges.find(b => b.id === 'streak_month') || null;
        } else if (event.streakDays === 100) {
          badgeToAward = badges.find(b => b.id === 'legend') || null;
        }
        break;
      case 'perfect_week':
        badgeToAward = badges.find(b => b.id === 'perfect_week') || null;
        break;
      case 'volume_milestone':
        if (event.value >= 100000) { // 100L in ml
          badgeToAward = badges.find(b => b.id === 'hydration_hero') || null;
        }
        break;
    }

    // Award badge if applicable
    if (badgeToAward) {
      setCurrentBadge(badgeToAward);
      await awardBadge(badgeToAward.id, event);
    }

    // Log analytics
    await logAnalyticsEvent(event, badgeToAward?.id);

    // Show celebration modal
    setShowCelebration(true);

    // Callback to parent component
    if (onAchievement) {
      onAchievement(event);
    }

    // Auto-hide celebration after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setCurrentBadge(null);
      setActiveAchievements(prev => prev.filter(a => a !== event));
    }, 5000);
  };

  // Public method to trigger achievements
  const triggerAchievement = (event: AchievementEvent) => {
    processAchievement(event);
  };

  const getRarityColor = (rarity: BadgeDefinition['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getAchievementTitle = (event: AchievementEvent) => {
    switch (event.type) {
      case 'daily_goal':
        return '🎯 Daily Goal Achieved!';
      case 'streak_milestone':
        return `🔥 ${event.streakDays} Day Streak!`;
      case 'hydration_milestone':
        return `💧 ${event.value}ml Milestone!`;
      case 'first_log':
        return '🎉 Welcome Aboard!';
      case 'perfect_week':
        return '⭐ Perfect Week!';
      case 'volume_milestone':
        return `🏆 ${(event.value / 1000).toFixed(1)}L Total!`;
      default:
        return '🎊 Achievement Unlocked!';
    }
  };

  return (
    <>
      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && activeAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="mx-4 max-w-md"
            >
              <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-2xl">
                <CardContent className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <div className="mb-4 text-6xl">🎉</div>
                  </motion.div>
                  
                  <h2 className="mb-2 text-2xl font-bold text-yellow-800">
                    {getAchievementTitle(activeAchievements[0])}
                  </h2>
                  
                  {currentBadge && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className={`mx-auto mb-4 w-fit rounded-lg border-2 p-4 ${getRarityColor(currentBadge.rarity)}`}
                    >
                      <currentBadge.icon className={`h-12 w-12 ${currentBadge.color} mx-auto mb-2`} />
                      <Badge variant="secondary" className="mb-1">
                        {currentBadge.rarity.toUpperCase()}
                      </Badge>
                      <p className="font-semibold">{currentBadge.name}</p>
                      <p className="text-sm text-muted-foreground">{currentBadge.description}</p>
                    </motion.div>
                  )}
                  
                  <p className="mb-4 text-yellow-700">
                    Keep up the amazing work! 💪
                  </p>
                  
                  <Button
                    onClick={() => {
                      setShowCelebration(false);
                      setCurrentBadge(null);
                      setActiveAchievements([]);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Continue Hydrating! 💧
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Forward ref for external trigger access
export const GamificationSystemRef = React.forwardRef<
  { triggerAchievement: (event: AchievementEvent) => void },
  GamificationProps
>((props, ref) => {
  const internalRef = React.useRef<{ triggerAchievement: (event: AchievementEvent) => void } | null>(null);

  React.useImperativeHandle(ref, () => ({
    triggerAchievement: (event: AchievementEvent) => {
      if (internalRef.current) {
        internalRef.current.triggerAchievement(event);
      }
    }
  }));

  return (
    <GamificationSystem 
      {...props} 
      onAchievement={(event) => {
        // Store the trigger function when component mounts
        if (props.onAchievement) {
          props.onAchievement(event);
        }
      }} 
    />
  );
});

GamificationSystemRef.displayName = 'GamificationSystemRef'; 