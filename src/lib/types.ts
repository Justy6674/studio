export type MotivationTone = "funny" | "kind" | "motivational" | "sarcastic" | "strict" | "supportive" | "crass" | "weightloss";

export const availableTones: MotivationTone[] = ["funny", "kind", "motivational", "sarcastic", "strict", "supportive", "crass", "weightloss"];

export type NotificationFrequency = "minimal" | "moderate" | "frequent";

export const notificationFrequencies: NotificationFrequency[] = ["minimal", "moderate", "frequent"];

export interface UserPreferences {
  tone?: MotivationTone;
  notificationFrequency?: NotificationFrequency;
  fcmEnabled?: boolean;
  vibrationEnabled?: boolean;
  smartwatchEnabled?: boolean;
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
  motivationTone?: MotivationTone; // AI motivation tone preference
  motivationFrequency?: string; // How often to show motivational messages
  pushNotifications?: boolean; // Enable device push notifications
  fcmEnabled?: boolean; // Firebase Cloud Messaging enabled
  fcmToken?: string; // FCM registration token
  notificationFrequency?: NotificationFrequency; // Notification frequency setting
  vibrationEnabled?: boolean; // Device vibration enabled
  smartwatchEnabled?: boolean; // Smartwatch notifications enabled
  reminderTimes?: Record<string, boolean>;
  customMilestones?: number[]; // New: Custom milestone percentages (e.g., [25, 50, 75, 100])
  milestoneAnimations?: boolean; // New: Enable/disable milestone animations
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
  amount: number;
  drinkType?: 'water' | 'soda_water' | 'protein_water' | 'herbal_tea' | 'soup_broth' | 'fruit' | 'other';
  drinkName?: string; // For custom drinks or specific names
  hydrationPercentage?: number; // Defaults to 100% for water, can be different for other drinks
  hydrationValue?: number; // Calculated amount that counts toward hydration goal
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

// New: Body Metrics Interfaces
export interface BodyMetrics {
  id: string;
  userId: string;
  weight_kg: number;
  waist_cm: number;
  timestamp: Date;
  notes?: string;
}

export interface BodyMetricsEntry {
  weight_kg: number;
  waist_cm: number;
  notes?: string;
}

export interface BodyMetricsStats {
  latest: BodyMetrics | null;
  earliest: BodyMetrics | null;
  total_entries: number;
  weight_change_kg: number;
  waist_change_cm: number;
  avg_weight_kg: number;
  avg_waist_cm: number;
  trend_period_days: number;
}

export interface DrinkType {
  id: string;
  name: string;
  icon: string;
  hydrationPercentage: number;
  description?: string;
}

export interface DrinkCelebration {
  drinkType: string;
  isFirstTime: boolean;
  timestamp: Date;
}
