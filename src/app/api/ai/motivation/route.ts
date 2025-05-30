import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// Enhanced input interface for contextual AI motivation
interface MotivationRequest {
  userId: string;
  ml_logged_today: number;
  goal_ml: number;
  percent_of_goal: number;
  current_streak: number;
  best_streak: number;
  last_log_time?: string;
  is_first_log: boolean;
  day_of_week?: string;
  time_of_day?: string;
}

// Contextual fallback messages based on user status
const getContextualFallback = (stats: MotivationRequest, tone: string = "Default"): string => {
  const { percent_of_goal, current_streak, is_first_log, ml_logged_today, goal_ml } = stats;
  
  // First log ever
  if (is_first_log) {
    switch (tone.toLowerCase()) {
      case 'funny': return "🎉 Welcome to the hydration station! Your first drop in the bucket - literally! 💧";
      case 'sarcastic': return "Oh wow, your first log. I'm impressed you remembered water exists. 💧";
      case 'clinical': return "Welcome! Proper hydration improves cognitive function by 15%. Great first step! 🧠💧";
      case 'warm': return "Welcome to your hydration journey! Every great habit starts with a single sip. You've got this! 💧❤️";
      default: return "🎉 Welcome! Great first step on your hydration journey. Every sip counts! 💧";
    }
  }
  
  // Goal achieved (100%+)
  if (percent_of_goal >= 100) {
    switch (tone.toLowerCase()) {
      case 'funny': return `🎉 You did it! ${ml_logged_today}ml logged! Your bladder probably wants to have a word with you though... 🚽💧`;
      case 'sarcastic': return `Congratulations, you remembered how to drink water like a functioning human. Gold star! ⭐💧`;
      case 'clinical': return `Excellent! Goal achieved: ${ml_logged_today}ml. Optimal hydration supports cellular function and metabolism! 🔬💧`;
      case 'warm': return `Amazing work! You've reached your ${goal_ml}ml goal! Your body is thanking you right now. Keep it up! 🌟💧`;
      default: return `🎉 Goal smashed! ${ml_logged_today}ml logged. You're a hydration hero! 💧`;
    }
  }
  
  // Under 50% - needs encouragement
  if (percent_of_goal < 50) {
    switch (tone.toLowerCase()) {
      case 'funny': return `${ml_logged_today}ml down, ${goal_ml - ml_logged_today}ml to go! Your kidneys are sending you reminder texts... 💧📱`;
      case 'sarcastic': return `${percent_of_goal}%? Really? Your houseplants are more hydrated than you are. Step it up! 🌱💧`;
      case 'clinical': return `Currently at ${percent_of_goal}% of goal. Mild dehydration reduces performance by 10%. Time to hydrate! 📊💧`;
      case 'warm': return `You're at ${percent_of_goal}% - every sip gets you closer! Small steps lead to big changes. You can do this! 💪💧`;
      default: return `${percent_of_goal}% of your goal reached! Keep going, you're building a great habit! 💧`;
    }
  }
  
  // 50-99% - good progress
  switch (tone.toLowerCase()) {
    case 'funny': return `${percent_of_goal}% there! You're like a camel, but cooler and with better hydration habits! 🐪💧`;
    case 'sarcastic': return `${percent_of_goal}% done. Look who's actually taking care of themselves. Shocking! 💧`;
    case 'clinical': return `Great progress at ${percent_of_goal}%! Consistent hydration optimises physical and mental performance. 🎯💧`;
    case 'warm': return `Wonderful progress! ${percent_of_goal}% complete. You're doing such a great job staying on track! 🌈💧`;
    default: return `Excellent progress! ${percent_of_goal}% of your daily goal achieved. Keep it flowing! 💧`;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MotivationRequest;
    const { 
      userId, 
      ml_logged_today, 
      goal_ml, 
      percent_of_goal, 
      current_streak, 
      best_streak, 
      last_log_time, 
      is_first_log,
      day_of_week,
      time_of_day 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's motivation tone preference
    let motivationTone = "Default";
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        motivationTone = userData.motivationTone || "Default";
      }
    } catch (error) {
      console.warn("Could not fetch user motivation tone, using default:", error);
    }

    // Try Gemini API with enhanced contextual prompt
    try {
      const contextualPrompt = `Generate a motivational hydration message for a user. Here is their current status:

📊 HYDRATION STATS:
- Daily Goal: ${goal_ml}ml
- Logged Today: ${ml_logged_today}ml (${percent_of_goal}%)
- Current Streak: ${current_streak} days
- Best Streak: ${best_streak} days
- Last Log: ${last_log_time || 'Not available'}
- First Ever Log: ${is_first_log ? 'Yes' : 'No'}
${day_of_week ? `- Day: ${day_of_week}` : ''}
${time_of_day ? `- Time: ${time_of_day}` : ''}

🎯 CONTEXT GUIDELINES:
- If they just hit their goal (100%+): CELEBRATE! 🎉
- If they're under 50%: Be encouraging but motivating
- If it's their first log: Welcome them warmly
- If they have a good streak: Acknowledge their consistency
- If it's early morning: Consider "good morning" energy
- If it's evening: Consider end-of-day motivation

🗣️ TONE: ${motivationTone}
- Default: Balanced, friendly and encouraging
- Clinical: Professional, educational with health facts and scientific benefits
- Funny: Crass/funny with humour, puns and playful language
- Sarcastic: Witty, clever and cheeky motivation (but still supportive)
- Warm: Caring, supportive, encouraging and nurturing

📝 FORMAT:
- Keep under 160 characters for mobile
- Include relevant emoji
- Be specific to their actual progress
- Make it personal and actionable

Generate ONE motivational message now:`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: contextualPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (message && message.length > 0) {
          return NextResponse.json({ 
            message: message.trim(),
            source: 'gemini',
            tone: motivationTone,
            stats: { ml_logged_today, percent_of_goal, current_streak }
          });
        }
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
    }

    // Fallback to contextual built-in message
    const fallbackMessage = getContextualFallback(body, motivationTone);
    
    return NextResponse.json({ 
      message: fallbackMessage,
      source: 'fallback',
      tone: motivationTone,
      stats: { ml_logged_today, percent_of_goal, current_streak }
    });

  } catch (error: any) {
    console.error('Error generating AI motivation:', error);
    
    return NextResponse.json({ 
      message: "Keep hydrating! Every sip counts towards your health! 💧",
      source: 'error_fallback',
      error: error.message 
    }, { status: 200 }); // Return 200 so frontend gets the fallback message
  }
} 