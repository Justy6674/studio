import { NextResponse } from 'next/server';
import { firestore as db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import twilio from 'twilio';
import { getMotivation } from '@/lib/gemini';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const MAX_SMS_PER_DAY = 2;

async function sendSms(to: string, body: string) {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials are not configured');
  }
  const client = twilio(accountSid, authToken);
  return client.messages.create({ to, from: twilioPhoneNumber, body });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, '0') + ':00';

  try {
    const usersRef = db.collection('users');
    const q = usersRef.where('smsEnabled', '==', true);

    const querySnapshot = await q.get();
    const reminderJobs = [];

    for (const userDoc of querySnapshot.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;

      if (!user.reminderTimes || !user.reminderTimes[currentHour]) {
        continue;
      }

      const today = new Date().toISOString().split('T')[0];
      const smsCountRef = db.doc(`smsCounts/${userId}/dailyCounts/${today}`);
      const smsCountSnap = await smsCountRef.get();
      const sentCount = smsCountSnap.exists ? smsCountSnap.data()?.count ?? 0 : 0;

      if (sentCount >= MAX_SMS_PER_DAY) {
        reminderJobs.push({ userId, status: 'skipped_limit_reached' });
        continue;
      }

      const hydrationLogRef = db.collection(`users/${userId}/hydration`);
      const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const recentLogQuery = hydrationLogRef.where('timestamp', '>=', last2Hours);
      const recentLogs = await recentLogQuery.get();

      if (recentLogs.empty) {
        if (!user.phoneNumber || !user.reminders.motivationTone) {
            reminderJobs.push({ userId, status: 'skipped_missing_data' });
            continue;
        }
        
        // Fetch today's hydration total for the user
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const hydrationQuery = await db.collection(`users/${userId}/hydration`)
          .where('timestamp', '>=', startOfDay)
          .where('timestamp', '<=', endOfDay)
          .get();

        const currentIntake = hydrationQuery.docs.reduce((total, doc) => total + doc.data().amount, 0);

        // Fetch current streak
        const streakDoc = await db.collection(`users/${userId}/streaks`).orderBy('date', 'desc').limit(1).get();
        const currentStreak = streakDoc.empty ? 0 : streakDoc.docs[0].data().streakLength;

        // Generate a personalized motivational message
        const motivation = await getMotivation({
          tone: user.reminders.motivationTone,
          name: user.name || '',
          currentIntake,
          goal: user.hydrationGoal || 2000,
          streak: currentStreak,
        });
        await sendSms(user.phoneNumber, motivation);
        
        if (smsCountSnap.exists) {
          await smsCountRef.update({ count: sentCount + 1, lastSent: FieldValue.serverTimestamp() });
        } else {
          await smsCountRef.set({ count: 1, date: today, firstSent: FieldValue.serverTimestamp(), lastSent: FieldValue.serverTimestamp() });
        }
        reminderJobs.push({ userId, status: 'sent' });
      } else {
        reminderJobs.push({ userId, status: 'skipped_recent_log' });
      }
    }

    return NextResponse.json({ success: true, reminders: reminderJobs });
  } catch (error) {
    console.error('Cron job failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ success: false, error: 'Internal Server Error', details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
