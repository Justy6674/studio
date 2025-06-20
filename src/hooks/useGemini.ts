import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

  const triggerGeminiMotivation = useCallback(async (amount: number) => {
    try {
      // TODO: Replace with actual Gemini API call
      console.log(`Triggering Gemini AI motivation for ${amount}ml`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use selected tone or default
      const tone = (userProfile?.motivationTone || 'Default').toLowerCase();
      const key = ['kind','strict','funny','kick'].includes(tone) ? tone : 'Default';
      const messages = toneMessages[key](amount);
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      toast({
        title: 'Stay Hydrated!',
        description: randomMessage,
        duration: 5000,
      });
      
      return true;
    } catch (error) {
      console.error('Error triggering Gemini motivation:', error);
      // Don't show error toast to user for this non-critical feature
      return false;
    }
  }, [toast, userProfile]);

  return {
    triggerGeminiMotivation,
  };
}
