import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request (you'll need to implement auth)
    // For now, using a test user ID
    const userId = 'test-user'; // TODO: Get from auth token
    
    // Get settings from Firestore
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Return default settings if user doesn't exist
      const defaultSettings = {
        fcmEnabled: false,
        vibrationEnabled: true,
        vibrationIntensity: 'medium',
        motivationTone: 'kind',
        notificationFrequency: 'moderate',
        timeWindows: ['morning', 'afternoon'],
        smsEnabled: false,
        smsMaxPerDay: 1
      };
      
      return NextResponse.json({ 
        success: true,
        settings: defaultSettings,
        isDefault: true
      });
    }
    
    const userData = userDoc.data();
    const settings = userData?.notificationSettings || {};
    
    console.log('📖 Settings retrieved from Firebase for user:', userId);
    
    return NextResponse.json({ 
      success: true,
      settings: settings,
      isDefault: false
    });
    
  } catch (error) {
    console.error('❌ Error retrieving settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request (you'll need to implement auth)
    // For now, using a test user ID
    const userId = 'test-user'; // TODO: Get from auth token
    
    // Parse the settings from request body
    const settings = await request.json();
    
    // Validate and set defaults for all settings to prevent undefined values
    const validatedSettings = {
      fcmEnabled: settings.fcmEnabled ?? false,
      vibrationEnabled: settings.vibrationEnabled ?? true,
      vibrationIntensity: settings.vibrationIntensity ?? 'medium',
      motivationTone: settings.motivationTone ?? 'kind',
      notificationFrequency: settings.notificationFrequency ?? 'moderate',
      timeWindows: settings.timeWindows ?? ['morning', 'afternoon'],
      smsEnabled: settings.smsEnabled ?? false,
      smsMaxPerDay: settings.smsMaxPerDay ?? 1,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore - use set with merge to create or update
    await firestore.collection('users').doc(userId).set({
      notificationSettings: validatedSettings
    }, { merge: true });
    
    console.log('🔥 Settings saved to Firebase for user:', userId, validatedSettings);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully',
      settings: validatedSettings
    });
    
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 