import type { User as FirebaseUser } from "firebase/auth";

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
}

export interface HydrationLog {
  id: string;
  userId: string;
  amount: number; // in ml
  timestamp: Date;
}

export interface UserSettings {
  hydrationGoal: number;
  phoneNumber?: string;
  reminderTimes: {
    '08:00': boolean;
    '12:00': boolean;
    '16:00': boolean;
  };
}
