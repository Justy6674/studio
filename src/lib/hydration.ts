'use client';

import { auth, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import type { HydrationLog } from "@/lib/types";

// Enhanced hydration logging using Firebase Functions
export async function logHydration(amount: number): Promise<{ success?: string; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { error: "User not authenticated." };
  }
  if (amount <= 0) {
    return { error: "Amount must be positive." };
  }

  try {
    const logHydrationFunction = httpsCallable(functions, 'logHydration');
    console.debug('🔥 Firebase Function Call - logHydration:', { amount });
    
    const result = await logHydrationFunction({ amount });
    console.debug('✅ Firebase Function Response - logHydration:', result.data);
    
    return { success: (result.data as any).message || "Hydration logged successfully!" };
  } catch (error: unknown) {
    console.error("❌ Error logging hydration:", error);
    return { error: (error as Error).message || "Failed to log hydration." };
  }
}

export async function logOtherDrink(
  amount: number, 
  drinkType: string, 
  drinkName: string, 
  hydrationPercentage: number
): Promise<{ success?: string; error?: string; isFirstTime?: boolean }> {
  const user = auth.currentUser;
  if (!user) {
    return { error: "User not authenticated." };
  }

  try {
    const logHydrationFunction = httpsCallable(functions, 'logHydration');
    console.debug('🔥 Firebase Function Call - logOtherDrink:', { 
      amount, drinkType, drinkName, hydrationPercentage 
    });
    
    const result = await logHydrationFunction({ 
      amount, 
      drinkType, 
      drinkName, 
      hydrationPercentage 
    });
    console.debug('✅ Firebase Function Response - logOtherDrink:', result.data);
    
    const successMessage = drinkType === 'water' 
      ? "Hydration logged successfully!" 
      : `${drinkName} logged successfully!`;

    return { 
      success: (result.data as any).message || successMessage,
      isFirstTime: (result.data as any).isFirstTime || false
    };
  } catch (error: unknown) {
    console.error("❌ Error logging other drink:", error);
    return { error: (error as Error).message || "Failed to log drink." };
  }
}

export async function getHydrationLogs(): Promise<HydrationLog[]> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user for getHydrationLogs");
    return [];
  }

  try {
    const fetchHydrationLogsFunction = httpsCallable(functions, 'fetchHydrationLogs');
    console.debug('🔥 Firebase Function Call - fetchHydrationLogs');
    
    const result = await fetchHydrationLogsFunction({});
    console.debug('✅ Firebase Function Response - fetchHydrationLogs:', result.data);
    
    const logs = (result.data as any).logs || [];
    return logs.map((log: any) => ({
      id: log.id,
      userId: log.userId,
      amount: log.amount,
      drinkType: log.drinkType || 'water',
      drinkName: log.drinkName || 'Water',
      hydrationPercentage: log.hydrationPercentage || 100,
      hydrationValue: log.hydrationValue || log.amount,
      timestamp: new Date(log.timestamp),
    }));
  } catch (error: unknown) {
    console.error('❌ Error fetching hydration logs:', error);
    return [];
  }
}

export async function getAIMotivation(hydrationGoal: number, debugMode = false): Promise<{ message: string; error?: string; source?: string; tone?: string; debug?: unknown }> {
  const user = auth.currentUser;
  if (!user) {
    return { message: "Login to get personalised motivation.", error: "Not authenticated" };
  }

  try {
    const generateMotivationalMessageFunction = httpsCallable(functions, 'generateMotivationalMessage');
    console.debug('🔥 Firebase Function Call - generateMotivationalMessage:', { hydrationGoal, debugMode });
    
    const result = await generateMotivationalMessageFunction({ 
      hydrationGoal, 
      debugMode 
    });
    console.debug('✅ Firebase Function Response - generateMotivationalMessage:', result.data);
    
    return { 
      message: (result.data as any).message || "Keep hydrating! 💧", 
      source: (result.data as any).source,
      tone: (result.data as any).tone,
      debug: (result.data as any).debug
    };
    
  } catch (error) {
    console.error("❌ Error generating AI motivation:", error);
    
    // Enhanced fallback messages
    const fallbacks = [
      "Every drop counts! Keep building that healthy habit! 💧",
      "Hydration hero in training! You're doing great! 🌟💧",
      "Water is your body's best friend. Keep it flowing! 💙💧",
      "Small sips, big impact! Your health thanks you! 🚿💧",
      "Stay consistent, stay hydrated! You've got this! 💪💧"
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return { message: randomFallback, error: "AI service unavailable", source: "client_fallback" };
  }
}