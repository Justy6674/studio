import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase'; // Assuming firebase admin is initialized here
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth'; // If using Firebase Admin for user auth server-side
import { app as adminApp } from '@/lib/firebase-admin'; // Your Firebase Admin App instance

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const MAX_SMS_PER_DAY = 2;

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // This is a placeholder. Implement actual user ID retrieval from session/token.
  // For example, if using Firebase Authentication with a session cookie or Bearer token:
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return null;
    }
  }
  // Fallback or other auth methods
  return null; 
}

export async function POST(request: NextRequest) {
  try {
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

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    // Update count in Firestore
    if (smsCountSnap.exists()) {
      await updateDoc(smsCountRef, { count: currentCount + 1, lastSent: serverTimestamp() });
    } else {
      await setDoc(smsCountRef, { count: 1, date: today, firstSent: serverTimestamp(), lastSent: serverTimestamp() });
    }

    return NextResponse.json({ 
      success: true, 
      messageSid: message.sid,
      message: 'SMS reminder sent successfully!'
    });

  } catch (error) {
    console.error('Error sending SMS reminder:', error);
    const details = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ 
      error: 'Failed to send SMS reminder',
      details
    }, { status: 500 });
  }
}
