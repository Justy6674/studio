"use server";

import { auth } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { revalidatePath } from "next/cache";
import type { HydrationLog } from "@/lib/types";

// Enhanced hydration logging using Firebase Functions
export async function logHydration(userId: string, amount: number) {
  if (!userId) {
    return { error: "User not authenticated." };
  }
  if (amount <= 0) {
    return { error: "Amount must be positive." };
  }

  try {
    const logHydrationFunction = httpsCallable(functions, 'logHydration');
    console.debug('🔥 Firebase Function Call - logHydration (Server Action):', { amount });
    
    const result = await logHydrationFunction({ amount });
    console.debug('✅ Firebase Function Response - logHydration (Server Action):', result.data);
    
    const data = result.data as any;
    
    revalidatePath("/dashboard");
    return { 
      success: data.success || "Hydration logged successfully.",
      achievements: data.achievements || [],
      newTotal: data.newTotal || 0,
      goalReached: data.goalReached || false
    };
  } catch (error) {
    console.error("Error logging hydration:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to log hydration.";
    return { error: errorMessage };
  }
}

// Get hydration logs using Firebase Functions
export async function getHydrationLogs(userId: string): Promise<HydrationLog[]> {
  if (!userId) {
    return [];
  }

  try {
    const fetchHydrationLogsFunction = httpsCallable(functions, 'fetchHydrationLogs');
    console.debug('🔥 Firebase Function Call - fetchHydrationLogs (Server Action)');
    
    const result = await fetchHydrationLogsFunction({});
    console.debug('✅ Firebase Function Response - fetchHydrationLogs (Server Action):', result.data);
    
    const data = result.data as any;
    return data.logs || [];
  } catch (error) {
    console.error("Error fetching hydration logs:", error);
    return [];
  }
}

// Get AI motivation using Firebase Functions
export async function getAIMotivation(userId: string, hydrationGoal: number): Promise<string> {
  if (!userId) {
    return "Stay hydrated! 💧";
  }

  try {
    const generateMotivationalMessageFunction = httpsCallable(functions, 'generateMotivationalMessage');
    console.debug('🔥 Firebase Function Call - generateMotivationalMessage (Server Action)');
    
    const result = await generateMotivationalMessageFunction({ 
      context: 'general',
      hydrationGoal 
    });
    console.debug('✅ Firebase Function Response - generateMotivationalMessage (Server Action):', result.data);
    
    const data = result.data as any;
    return data.message || "Stay hydrated! 💧";
  } catch (error) {
    console.error("Error generating AI motivation:", error);
    return "Stay hydrated! 💧";
  }
}
