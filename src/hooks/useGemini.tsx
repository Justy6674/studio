import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMotivationPreferences } from './useMotivationPreferences';

// Time-specific contextual messages map
const timeContextMessages: Record<string, string[]> = {
  morning: [
    "Good morning! Starting your day with hydration is perfect. 🌅",
    "Morning hydration sets you up for success today! 🌞",
    "Drinking water first thing improves your metabolism for the day. ⏰"
  ],
  afternoon: [
    "Afternoon slump? Water helps more than caffeine! ☕",
    "Mid-day hydration keeps your energy levels stable. ⚡",
    "Taking a water break is perfect for your afternoon productivity. 📈"
  ],
  evening: [
    "Evening hydration helps your body recover from the day. 🌙",
    "Staying hydrated in the evening improves sleep quality. 😴",
    "Great job hydrating before bedtime! Your body repairs while you sleep. 🛏️"
  ],
  late: [
    "Late night hydration? Your commitment is impressive! 🌃",
    "Even at this hour, your body appreciates the hydration. 🌜",
    "Night owl with healthy habits - impressive! 🦉"
  ]
};

// Progress-specific contextual messages
const progressContextMessages: Record<string, string[]> = {
  starting: [
    "First drink of the day - you're on your way! 🏁",
    "Starting your hydration journey for today! 🚶‍♂️",
    "The first step toward your daily goal! 🎯"
  ],
  halfway: [
    "You're halfway to your goal! Keep it flowing! 🏆",
    "50% complete! Your body is thanking you! 💪",
    "Halfway there and feeling great! 🎉"
  ],
  almost: [
    "Almost there! Just a little more to reach your goal! 🔜",
    "The finish line is in sight! Keep going! 🏁",
    "So close to your daily target! 🎯"
  ],
  complete: [
    "Goal achieved! Anything more is bonus hydration! 🎊",
    "You did it! Daily hydration goal complete! 🏆",
    "Hydration champion! Goal reached! 🥇"
  ],
  exceeded: [
    "Overachiever! You've exceeded your goal! 🌊",
    "Above and beyond! Your body loves the extra hydration! 💦",
    "Hydration superstar! You've gone past your goal! ⭐"
  ]
};

// Tone-specific messages (original implementation)
const toneMessages: Record<string, (amount: number) => string[]> = {
  kind: (amount) => [
    `You're doing amazing! ${amount}ml more to a healthier you. 💙`,
    `Gentle reminder: every sip counts. ${amount}ml logged! 🌱`,
    `Kindness to yourself is hydration. ${amount}ml added. 🫧`,
  ],
  strict: (amount) => [
    `No excuses! ${amount}ml logged. Get back to it! 💪`,
    `Discipline = results. ${amount}ml down, keep going. 🚨`,
    `Strict mode: ${amount}ml is good, but you can do better!`,
  ],
  funny: (amount) => [
    `If you were a plant, you'd be thriving! ${amount}ml logged. 🌵`,
    `Your bladder called. It says thanks for the ${amount}ml! 😂`,
    `You drink water better than a goldfish. ${amount}ml! 🐟`,
  ],
  kick: (amount) => [
    `Move it! ${amount}ml is nothing. Drink more! 🥊`,
    `You want results? Then chug, don't shrug! ${amount}ml.`,
    `No mercy! ${amount}ml down, but you better not stop! 🔥`,
  ],
  Default: (amount) => [
    `Great job! You've logged ${amount}ml of water. Every drop counts! 💧`,
    `${amount}ml logged! Your body thanks you for staying hydrated. 🚰`,
    `Well done! ${amount}ml of water is a step closer to your daily goal. 🌟`,
    `Hydration win! You've added ${amount}ml to your daily intake. 💦`,
  ],
};

export function useGemini() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { isHiddenToday, hideForToday, addToFavorites, isFavorite } = useMotivationPreferences();

  const triggerGeminiMotivation = useCallback(async (amount: number, hydrationPercentage?: number) => {
    try {
      // Check if user has hidden motivational messages for today
      if (isHiddenToday()) {
        console.log('Motivational messages hidden for today, skipping');
        return true; // Successfully skipped (not an error)
      }
      
      // TODO: Replace with actual Gemini API call
      console.log(`Triggering Gemini AI motivation for ${amount}ml`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get time of day for context
      const hour = new Date().getHours();
      let timeContext = '';
      
      if (hour >= 5 && hour < 12) {
        timeContext = 'morning';
      } else if (hour >= 12 && hour < 18) {
        timeContext = 'afternoon';
      } else if (hour >= 18 && hour < 22) {
        timeContext = 'evening';
      } else {
        timeContext = 'late';
      }
      
      // Determine progress context
      let progressContext = '';
      if (hydrationPercentage !== undefined) {
        if (hydrationPercentage < 10) {
          progressContext = 'starting';
        } else if (hydrationPercentage >= 40 && hydrationPercentage < 60) {
          progressContext = 'halfway';
        } else if (hydrationPercentage >= 80 && hydrationPercentage < 100) {
          progressContext = 'almost';
        } else if (hydrationPercentage === 100) {
          progressContext = 'complete';
        } else if (hydrationPercentage > 100) {
          progressContext = 'exceeded';
        }
      }
      
      // Use selected tone or default
      const tone = (userProfile?.motivationTone || 'Default').toLowerCase();
      const key = ['kind','strict','funny','kick'].includes(tone) ? tone : 'Default';
      
      // Get a tone-based message
      const toneBasedMessages = toneMessages[key](amount);
      const randomToneMessage = toneBasedMessages[Math.floor(Math.random() * toneBasedMessages.length)];
      
      // Get contextual messages when applicable
      let contextualMessage = '';
      if (timeContext) {
        const timeMessages = timeContextMessages[timeContext];
        contextualMessage += timeMessages[Math.floor(Math.random() * timeMessages.length)] + ' ';
      }
      
      if (progressContext) {
        const progressMessages = progressContextMessages[progressContext];
        contextualMessage += progressMessages[Math.floor(Math.random() * progressMessages.length)] + ' ';
      }
      
      // Combine messages (if we have contextual messages, otherwise use just the tone message)
      const finalMessage = contextualMessage ? 
        `${contextualMessage}\n\n${randomToneMessage}` : 
        randomToneMessage;
      
      // Check if this message is already a favorite
      const isFavoriteMessage = isFavorite(finalMessage);
      
      // Show toast with additional actions
      toast({
        title: 'Stay Hydrated!',
        description: finalMessage,
        duration: 6000, // Increased duration to give time for action buttons
        action: (
          <div className="flex flex-row gap-2 mt-2">
            <button 
              onClick={() => hideForToday()}
              className="text-xs text-muted-foreground underline"
            >
              Don't show again today
            </button>
            <button 
              onClick={() => isFavoriteMessage ? null : addToFavorites(finalMessage)}
              className={`text-xs ${isFavoriteMessage ? 'text-amber-500' : 'text-muted-foreground underline'}`}
            >
              {isFavoriteMessage ? '★ Favorited' : 'Save as favorite'}
            </button>
          </div>
        ),
      });
      
      return true;
    } catch (error) {
      console.error('Error triggering Gemini motivation:', error);
      // Don't show error toast to user for this non-critical feature
      return false;
    }
  }, [toast, userProfile, isHiddenToday, hideForToday, addToFavorites, isFavorite]);

  return {
    triggerGeminiMotivation,
  };
}
