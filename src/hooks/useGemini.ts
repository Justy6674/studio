import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useGemini() {
  const { toast } = useToast();

  const triggerGeminiMotivation = useCallback(async (amount: number) => {
    try {
      // TODO: Replace with actual Gemini API call
      console.log(`Triggering Gemini AI motivation for ${amount}ml`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, show a toast with a motivational message
      const messages = [
        `Great job! You've logged ${amount}ml of water. Every drop counts! 💧`,
        `${amount}ml logged! Your body thanks you for staying hydrated. 🚰`,
        `Well done! ${amount}ml of water is a step closer to your daily goal. 🌟`,
        `Hydration win! You've added ${amount}ml to your daily intake. 💦`,
      ];
      
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
  }, [toast]);

  return {
    triggerGeminiMotivation,
  };
}
