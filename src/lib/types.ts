
import type { User as FirebaseUser } from "firebase/auth";

export type MotivationTone = "funny" | "crass" | "rude" | "sarcastic" | "kind" | "motivational" | "clinical" | "default";

export const availableTones: MotivationTone[] = ["default", "funny", "crass", "rude", "sarcastic", "kind", "motivational", "clinical"];


export interface UserPreferences {
  tone?: MotivationTone;
  // other preferences can go here
}

export interface UserProfile extends FirebaseUser {
  name?: string;
  hydrationGoal?: number; // in ml
  phoneNumber?: string;
  reminderTimes?: {
    '08:00'?: boolean;
    '12:00'?: boolean;
    '16:00'?: boolean;
  };
  dailyStreak?: number;
  longestStreak?: number;
  lastLogDate?: string; // YYYY-MM-DD
  preferences?: UserPreferences;
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
  reminderTimes: {
    '08:00': boolean;
    '12:00': boolean;
    '16:00': boolean;
  };
  preferences?: UserPreferences;
}
