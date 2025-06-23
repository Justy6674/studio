"use client";

import { useState, useEffect } from 'react';
import { Award, Droplets, Zap, Target, Crown, Medal, Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

export interface HydrationBadge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof badgeIcons;
  criteria: string;
  unlockedAt?: string;
  color: string;
}

// Badge icons mapping
const badgeIcons = {
  Award: Award,
  Droplets: Droplets,
  Zap: Zap,
  Target: Target,
  Crown: Crown,
  Medal: Medal,
  Star: Star,
  Trophy: Trophy,
};

// Available badges definition
export const availableBadges: HydrationBadge[] = [
  {
    id: 'first-drink',
    name: 'First Sip',
    description: 'Logged your first drink',
    icon: 'Droplets',
    criteria: 'Log your first drink',
    color: 'bg-blue-500',
  },
  {
    id: 'daily-goal',
    name: 'Goal Crusher',
    description: 'Reached your daily hydration goal',
    icon: 'Target',
    criteria: 'Reach 100% of your daily goal',
    color: 'bg-green-500',
  },
  {
    id: 'streak-3',
    name: 'Consistency Starter',
    description: 'Maintained a 3-day hydration streak',
    icon: 'Zap',
    criteria: 'Reach your goal for 3 consecutive days',
    color: 'bg-yellow-500',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintained a 7-day hydration streak',
    icon: 'Medal',
    criteria: 'Reach your goal for 7 consecutive days',
    color: 'bg-orange-500',
  },
  {
    id: 'streak-30',
    name: 'Hydration Master',
    description: 'Maintained a 30-day hydration streak',
    icon: 'Crown',
    criteria: 'Reach your goal for 30 consecutive days',
    color: 'bg-purple-500',
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Logged water before 9am',
    icon: 'Star',
    criteria: 'Log water before 9am',
    color: 'bg-cyan-500',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Logged water after 9pm',
    icon: 'Star',
    criteria: 'Log water after 9pm',
    color: 'bg-indigo-500',
  },
  {
    id: 'variety',
    name: 'Variety Seeker',
    description: 'Logged 5 different drink types',
    icon: 'Award',
    criteria: 'Log 5 different types of drinks',
    color: 'bg-pink-500',
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Reached 100% goal every day for a week',
    icon: 'Trophy',
    criteria: 'Reach 100% of your goal every day for a week',
    color: 'bg-amber-500',
  },
];

interface BadgeDisplayProps {
  badge: HydrationBadge;
  unlocked: boolean;
  onClick?: () => void;
}

export function BadgeDisplay({ badge, unlocked, onClick }: BadgeDisplayProps) {
  const Icon = badgeIcons[badge.icon];
  
  return (
    <div 
      className={`relative cursor-pointer transition-transform hover:scale-105 ${unlocked ? '' : 'opacity-50'}`}
      onClick={onClick}
    >
      <div className={`rounded-full p-4 ${unlocked ? badge.color : 'bg-gray-400'} flex items-center justify-center mb-2`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{badge.name}</p>
        {unlocked && (
          <Badge variant="outline" className="mt-1 text-xs">
            Unlocked
          </Badge>
        )}
      </div>
    </div>
  );
}

interface BadgeSystemProps {
  userProfile: any;
  onBadgeEarned?: (badge: HydrationBadge) => void;
}

export function BadgeSystem({ userProfile, onBadgeEarned }: BadgeSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<HydrationBadge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.badges) {
      setUserBadges(userProfile.badges);
    } else {
      setUserBadges([]);
    }
  }, [userProfile]);

  const handleBadgeClick = (badge: HydrationBadge) => {
    setSelectedBadge(badge);
    setIsDialogOpen(true);
  };

  const checkAndAwardBadge = async (badgeId: string) => {
    if (!user?.uid || userBadges.includes(badgeId)) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        badges: arrayUnion(badgeId)
      });
      
      // Update local state
      setUserBadges(prev => [...prev, badgeId]);
      
      // Find the badge details
      const earnedBadge = availableBadges.find(b => b.id === badgeId);
      if (earnedBadge) {
        // Show toast notification
        toast({
          title: "New Badge Unlocked!",
          description: `You've earned the "${earnedBadge.name}" badge!`,
          variant: "default",
        });
        
        // Call the callback if provided
        if (onBadgeEarned) {
          onBadgeEarned(earnedBadge);
        }
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Badges & Achievements
          </CardTitle>
          <CardDescription>Collect badges by meeting hydration goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {availableBadges.slice(0, 6).map((badge) => (
              <BadgeDisplay 
                key={badge.id}
                badge={badge}
                unlocked={userBadges.includes(badge.id)}
                onClick={() => handleBadgeClick(badge)}
              />
            ))}
          </div>
          
          {userBadges.length === 0 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Start logging your hydration to earn badges!
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedBadge && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">{selectedBadge.name}</DialogTitle>
              <DialogDescription className="text-center">
                {userBadges.includes(selectedBadge.id) ? 'Badge Unlocked!' : 'Badge Locked'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <div className={`rounded-full p-6 ${userBadges.includes(selectedBadge.id) ? selectedBadge.color : 'bg-gray-400'} mb-4`}>
                {(() => {
                  const Icon = badgeIcons[selectedBadge.icon];
                  return <Icon className="h-10 w-10 text-white" />;
                })()}
              </div>
              
              <p className="text-center mb-2">{selectedBadge.description}</p>
              
              <div className="bg-muted p-2 rounded-md w-full text-center mt-2">
                <p className="text-sm font-medium">How to earn</p>
                <p className="text-xs text-muted-foreground">{selectedBadge.criteria}</p>
              </div>
              
              {userBadges.includes(selectedBadge.id) && (
                <Badge className="mt-4" variant="outline">
                  Unlocked
                </Badge>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

// Utility function to check and award badges based on user activity
export async function checkAndAwardBadges(userId: string, logs: any[], streak: number, dailyGoal: number, currentIntake: number) {
  if (!userId) return;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const userBadges = userData?.badges || [];
    const newBadges: string[] = [];
    
    // Check for first drink badge
    if (logs.length > 0 && !userBadges.includes('first-drink')) {
      newBadges.push('first-drink');
    }
    
    // Check for daily goal badge
    if (currentIntake >= dailyGoal && !userBadges.includes('daily-goal')) {
      newBadges.push('daily-goal');
    }
    
    // Check for streak badges
    if (streak >= 3 && !userBadges.includes('streak-3')) {
      newBadges.push('streak-3');
    }
    
    if (streak >= 7 && !userBadges.includes('streak-7')) {
      newBadges.push('streak-7');
    }
    
    if (streak >= 30 && !userBadges.includes('streak-30')) {
      newBadges.push('streak-30');
    }
    
    // Check for time-based badges
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => {
      if (typeof log.timestamp === 'string') {
        return log.timestamp.split('T')[0] === today;
      }
      return false;
    });
    
    const earlyMorningLog = todayLogs.some(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 9;
    });
    
    if (earlyMorningLog && !userBadges.includes('early-bird')) {
      newBadges.push('early-bird');
    }
    
    const lateNightLog = todayLogs.some(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= 21;
    });
    
    if (lateNightLog && !userBadges.includes('night-owl')) {
      newBadges.push('night-owl');
    }
    
    // Check for variety badge
    const drinkTypes = new Set(logs.map(log => log.type));
    if (drinkTypes.size >= 5 && !userBadges.includes('variety')) {
      newBadges.push('variety');
    }
    
    // If any new badges, update user document
    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: [...userBadges, ...newBadges]
      });
      
      return {
        awarded: true,
        newBadges: newBadges.map(id => availableBadges.find(b => b.id === id)).filter(Boolean)
      };
    }
    
    return { awarded: false };
  } catch (error) {
    console.error("Error checking badges:", error);
    return { awarded: false, error };
  }
}
