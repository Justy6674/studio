import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials');
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: '💧 Test message from Water4WeightLoss! Your SMS reminders are working perfectly. Stay hydrated! 🌟',
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return NextResponse.json({ 
      success: true, 
      messageSid: message.sid,
      message: 'Test SMS sent successfully!'
    });
  } catch (error: any) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json({ 
      error: 'Failed to send test SMS',
      details: error.message 
    }, { status: 500 });
  }
} 