'use client';

import { auth } from "@/lib/firebase";
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
    const requestPayload = {
      userId: user.uid,
      amount
    };
    
    const url = 'https://us-central1-hydrateai-ayjow.cloudfunctions.net/logHydration';
    console.debug('🔥 Firebase Function Call - logHydration:', { url, payload: requestPayload });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to log hydration: ${response.statusText}`);
    }

    const result = await response.json();
    console.debug('✅ Firebase Function Response - logHydration:', result);
    
    return { success: result.message || "Hydration logged successfully!" };
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
    const requestPayload = {
      userId: user.uid,
      amount,
      drinkType,
      drinkName,
      hydrationPercentage
    };
    
    const url = 'https://us-central1-hydrateai-ayjow.cloudfunctions.net/logHydration';
    console.debug('🔥 Firebase Function Call - logOtherDrink:', { url, payload: requestPayload });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to log drink: ${response.statusText}`);
    }

    const result = await response.json();
    console.debug('✅ Firebase Function Response - logOtherDrink:', result);
    
    const successMessage = drinkType === 'water' 
      ? "Hydration logged successfully!" 
      : `${drinkName} logged successfully!`;

    return { 
      success: result.message || successMessage,
      isFirstTime: result.isFirstTime || false
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
    const requestPayload = {
      userId: user.uid
    };
    
    const url = 'https://us-central1-hydrateai-ayjow.cloudfunctions.net/fetchHydrationLogs';
    console.debug('🔥 Firebase Function Call - fetchHydrationLogs:', { url, payload: requestPayload });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hydration logs: ${response.statusText}`);
    }

    const result = await response.json();
    console.debug('✅ Firebase Function Response - fetchHydrationLogs:', result);
    
    return (result.logs || []).map((log: any) => ({
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
    const requestPayload = {
      userId: user.uid,
      hydrationGoal,
      debugMode
    };
    
    const url = 'https://us-central1-hydrateai-ayjow.cloudfunctions.net/generateMotivationalMessage';
    console.debug('🔥 Firebase Function Call - generateMotivationalMessage:', { url, payload: requestPayload });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.debug('✅ Firebase Function Response - generateMotivationalMessage:', result);
    
    return { 
      message: result.message || "Keep hydrating! 💧", 
      source: result.source,
      tone: result.tone,
      debug: result.debug
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