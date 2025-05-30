import type { User as FirebaseUser } from "firebase/auth";

export type MotivationTone = "funny" | "crass" | "rude" | "sarcastic" | "kind" | "motivational" | "clinical" | "default" | "friendly" | "professional" | "encouraging";

export const availableTones: MotivationTone[] = ["default", "funny", "crass", "rude", "sarcastic", "kind", "motivational", "clinical", "friendly", "professional", "encouraging"];

export interface UserPreferences {
  tone?: MotivationTone;
  // other preferences can go here
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  name?: string;
  hydrationGoal?: number; // in ml
  sipAmount?: number; // in ml - customizable amount for quick sip logging
  phoneNumber?: string;
  smsEnabled?: boolean;
  aiTone?: string;
  motivationTone?: string; // New: AI motivation tone preference
  motivationFrequency?: string; // New: How often to show motivational messages
  pushNotifications?: boolean; // New: Enable device push notifications
  reminderTimes?: Record<string, boolean>;
  dailyStreak?: number;
  longestStreak?: number;
  lastLogDate?: string; // YYYY-MM-DD format
  // Stripe subscription fields
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | null;
  subscriptionEndDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HydrationLog {
  id: string;
  userId: string;
  amount: number; // in ml
  timestamp: Date;
}

export interface UserSettings {
  name?: string; // Added name to UserSettings as it's often updated here
  hydrationGoal: number;
  phoneNumber?: string;
  smsEnabled?: boolean;
  aiTone?: string;
  reminderTimes: Record<string, boolean>;
  preferences?: UserPreferences;
}
