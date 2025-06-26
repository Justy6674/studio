import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 FCM Test Mode - Testing notification system');
    
    const body = await request.json();
    const { 
      testType = 'all', 
      tone = 'funny', 
      userId = 'test-user', 
      notificationType = 'drink' 
    } = body;
    
    // Mock test data for development
    const mockResults = {
      fcm: {
        success: true,
        message: `✅ Testing ${notificationType} notification with ${tone} tone`,
        details: {
          notificationType,
          tone,
          emoji: getEmojiForType(notificationType),
          sampleMessage: getSampleMessage(tone, notificationType)
        }
      },
      gemini: {
        success: true,
        message: `✅ Testing Gemini AI for ${tone} tone with ${notificationType} context`,
        prompt: `Generate a ${tone}-toned ${notificationType} reminder for hydration`,
        sampleResponse: getSampleMessage(tone, notificationType)
      },
      gamification: {
        success: true,
        message: '🎮 Testing Gamification System...',
        confetti: notificationType === 'milestone',
        badges: ['hydration_hero', 'streak_master'],
        celebration: notificationType === 'milestone' ? 'Milestone celebration triggered!' : 'Standard gamification active'
      },
      daySplit: {
        success: true,
        message: '🎯 Testing Day-Splitting Logic...',
        milestones: [
          { time: '10:00', target: 1000, label: 'Morning Target', confetti: true },
          { time: '15:00', target: 2000, label: 'Afternoon Target', confetti: true },
          { time: '20:00', target: 3000, label: 'Evening Target', confetti: true }
        ],
        currentStatus: 'Ready for milestone tracking'
      }
    };

    const results: any = {};
    
    if (testType === 'fcm' || testType === 'all') {
      console.log('🔔 Testing FCM Push Notifications...');
      results.fcm = mockResults.fcm;
    }
    
    if (testType === 'gemini' || testType === 'all') {
      console.log(`✅ Testing Gemini AI for ${tone} tone with ${notificationType} context`);
      results.gemini = mockResults.gemini;
    }
    
    if (testType === 'gamification' || testType === 'all') {
      console.log('🎮 Testing Gamification System...');
      results.gamification = mockResults.gamification;
    }

    if (testType === 'day-split' || testType === 'all') {
      console.log('🎯 Testing Day-Splitting Logic...');
      results.daySplit = mockResults.daySplit;
    }

    return NextResponse.json({
      success: true,
      testType,
      notificationType,
      tone,
      timestamp: new Date().toISOString(),
      results,
      message: `All ${testType} tests completed successfully`,
      mockMode: true,
      note: 'This is a test endpoint demonstrating the enhanced notification system'
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getEmojiForType(type: string): string {
  const emojis = {
    sip: '💧',
    glass: '🥤', 
    walk: '🚶‍♂️',
    drink: '🥛',
    herbal_tea: '🍵',
    milestone: '🎯'
  };
  return emojis[type as keyof typeof emojis] || '💧';
}

function getSampleMessage(tone: string, notificationType: string): string {
  const messages = {
    funny: {
      sip: "Your cells are texting me... they want water! 💧",
      glass: "Time for a glass break! Your body will send thank-you notes! 🥤",
      walk: "Walk it off... with water! Double win! 🚶‍♂️💧",
      drink: "Hydration station calling! All aboard the water train! 🥛",
      herbal_tea: "Tea time for some zen hydration vibes! 🍵",
      milestone: "🎯 BOOM! You've absolutely crushed this milestone!"
    },
    kind: {
      sip: "A gentle reminder for a small, refreshing sip 💧",
      glass: "How about a lovely glass of water? 🥤", 
      walk: "A peaceful walk with some water sounds wonderful 🚶‍♂️",
      drink: "Time for some gentle hydration, dear friend 🥛",
      herbal_tea: "Perhaps a soothing herbal tea break? 🍵",
      milestone: "🎯 Wonderful! You've reached your hydration milestone!"
    },
    motivational: {
      sip: "Every sip counts! You've got this! 💧",
      glass: "Power up with a full glass! Champion mode! 🥤",
      walk: "Move and hydrate! Double the victory! 🚶‍♂️💧", 
      drink: "Fuel your success with hydration! 🥛",
      herbal_tea: "Energize with herbal goodness! 🍵",
      milestone: "🎯 INCREDIBLE! You're smashing your goals!"
    },
    sarcastic: {
      sip: "Oh look, your water bottle misses you... shocking 💧",
      glass: "Another glass? What a revolutionary concept 🥤",
      walk: "Walk AND drink water? Mind = blown 🚶‍♂️",
      drink: "Drinking water... because apparently that's a thing 🥛", 
      herbal_tea: "Herbal tea... because regular water is too mainstream 🍵",
      milestone: "🎯 Well well, look who actually hit their target"
    },
    strict: {
      sip: "Drink. Water. Now. Small sip. Do it. 💧",
      glass: "Full glass. No excuses. Your body demands it. 🥤",
      walk: "Walk. Drink. Move. Hydrate. Execute. 🚶‍♂️",
      drink: "Hydration is mandatory. Drink now. 🥛",
      herbal_tea: "Herbal tea break. Immediate compliance required. 🍵", 
      milestone: "🎯 Target achieved. Continue. No celebration."
    },
    supportive: {
      sip: "You're doing amazing! Just a tiny sip to keep going 💧",
      glass: "I believe in you! One glass closer to your goal 🥤",
      walk: "You've got this! Walk and hydrate together 🚶‍♂️",
      drink: "I'm here for you! Time for some supportive hydration 🥛",
      herbal_tea: "You deserve this peaceful tea moment 🍵",
      milestone: "🎯 I'm so proud of you! Milestone achieved!"
    },
    crass: {
      sip: "Mate, your hydration game is weaker than my WiFi! 💧",
      glass: "Seriously? When did you last drink a proper glass? 🥤",
      walk: "Get off your arse and walk with some water! 🚶‍♂️",
      drink: "Your body's crying for water louder than a baby! 🥛",
      herbal_tea: "Even fancy tea beats your current nothing! 🍵",
      milestone: "🎯 Holy shit, you actually did it! Respect!"
    },
    weightloss: {
      sip: "Every sip boosts metabolism! Weight loss wins! 💧",
      glass: "Water = appetite control = weight goals! 🥤",
      walk: "Walking + water = fat burning combo! 🚶‍♂️",
      drink: "Hydration accelerates weight loss! Drink up! 🥛",
      herbal_tea: "Herbal tea supports healthy weight management! 🍵",
      milestone: "🎯 Milestone hit! Your weight loss journey rocks!"
    }
  };
  
  const toneMessages = messages[tone as keyof typeof messages] || messages.kind;
  return toneMessages[notificationType as keyof typeof toneMessages] || "Time to hydrate!";
} 