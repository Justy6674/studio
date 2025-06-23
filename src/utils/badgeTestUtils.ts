/**
 * Badge Test Utilities
 * 
 * This file contains utility functions to help test the badge system functionality.
 */

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { availableBadges } from '@/components/gamification/BadgeSystem';

/**
 * Reset all badges for a user to test badge earning functionality
 * @param userId The user ID to reset badges for
 * @returns Promise that resolves when badges are reset
 */
export const resetUserBadges = async (userId: string): Promise<void> => {
  if (!userId) {
    console.error('No user ID provided for badge reset');
    return;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      badges: []
    });
    console.log('User badges reset successfully');
  } catch (error) {
    console.error('Error resetting user badges:', error);
    throw error;
  }
};

/**
 * Grant a specific badge to a user for testing
 * @param userId The user ID to grant the badge to
 * @param badgeId The ID of the badge to grant
 * @returns Promise that resolves when the badge is granted
 */
export const grantBadgeToUser = async (userId: string, badgeId: string): Promise<void> => {
  if (!userId) {
    console.error('No user ID provided for badge granting');
    return;
  }
  
  // Verify the badge ID is valid
  const badgeExists = availableBadges.some(badge => badge.id === badgeId);
  if (!badgeExists) {
    console.error(`Invalid badge ID: ${badgeId}`);
    return;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      badges: [badgeId]
    });
    console.log(`Badge ${badgeId} granted to user ${userId}`);
  } catch (error) {
    console.error('Error granting badge to user:', error);
    throw error;
  }
};
