import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase'; // Assuming firebase admin is initialized here
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth'; // If using Firebase Admin for user auth server-side
import { app as adminApp } from '@/lib/firebase-admin'; // Your Firebase Admin App instance

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const MAX_SMS_PER_DAY = 2;

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Check if we're in a build environment (no actual Firebase Admin)
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    console.log('Development/Preview mode: Using placeholder user ID');
    return 'build-placeholder-user-id';
  }

  // This is a placeholder. Implement actual user ID retrieval from session/token.
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      // Safely check if Firebase Admin is initialized before using it
      if (adminApp && typeof adminApp.auth === 'function') {
        const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
        return decodedToken.uid;
      } else {
        console.error('Firebase Admin not properly initialized');
        return null;
      }
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return null;
    }
  }
  // Fallback or other auth methods
  return null; 
}

export async function POST(request: NextRequest) {
  // Check if this is a build/preview environment and bypass actual functionality
  const isBuildOrPreview = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview'; 

  try {
    // During build/preview, we'll return mock responses
    if (isBuildOrPreview) {
      console.log('Build/preview environment detected - returning mock response');
      return NextResponse.json({
        success: true,
        message: 'SMS reminder simulated successfully (build/preview environment)',
        messageSid: 'mock-message-sid',
        mockMode: true
      });
    }

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, messageBody } = await request.json();

    if (!phoneNumber || !messageBody) {
      return NextResponse.json({ error: 'Phone number and message body are required' }, { status: 400 });
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials');
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
    }

    // Safely handle Firestore operations
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const smsCountRef = doc(db, `smsCounts/${userId}/dailyCounts`, today);
      const smsCountSnap = await getDoc(smsCountRef);

      let currentCount = 0;
      if (smsCountSnap.exists()) {
        currentCount = smsCountSnap.data().count || 0;
      }

      if (currentCount >= MAX_SMS_PER_DAY) {
        return NextResponse.json({ 
          success: false, 
          limitReached: true, 
          message: 'Daily SMS limit reached. Fallback to in-app notification.' 
        }, { status: 429 }); // 429 Too Many Requests
      }
    } catch (firestoreError) {
      console.error('Error accessing Firestore:', firestoreError);
      // Continue with SMS sending even if Firestore fails
    }

    // Send SMS via Twilio
    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });

      // Try to update count in Firestore, but continue if it fails
      try {
        const today = new Date().toISOString().split('T')[0];
        const smsCountRef = doc(db, `smsCounts/${userId}/dailyCounts`, today);
        const smsCountSnap = await getDoc(smsCountRef);
  
        if (smsCountSnap.exists()) {
          await updateDoc(smsCountRef, { count: smsCountSnap.data().count + 1 || 1, lastSent: serverTimestamp() });
        } else {
          await setDoc(smsCountRef, { count: 1, date: today, firstSent: serverTimestamp(), lastSent: serverTimestamp() });
        }
      } catch (updateError) {
        console.error('Error updating SMS count in Firestore:', updateError);
        // Continue even if Firestore update fails
      }

      return NextResponse.json({ 
        success: true, 
        messageSid: message.sid,
        message: 'SMS reminder sent successfully!'
      });
    } catch (twilioError) {
      console.error('Error sending SMS via Twilio:', twilioError);
      const details = twilioError instanceof Error ? twilioError.message : "An unknown error occurred with Twilio";
      return NextResponse.json({ 
        error: 'Failed to send SMS reminder',
        details
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in SMS reminder route:', error);
    const details = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ 
      error: 'Failed to process SMS reminder request',
      details
    }, { status: 500 });
  }
}
