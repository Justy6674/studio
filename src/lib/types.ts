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
  phoneNumber?: string;
  smsEnabled?: boolean;
  aiTone?: string;
  motivationTone?: string; // New: AI motivation tone preference
  motivationFrequency?: string; // New: How often to show motivational messages
  reminderTimes?: Record<string, boolean>;
  dailyStreak?: number;
  longestStreak?: number;
  lastLogDate?: string; // YYYY-MM-DD format
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
