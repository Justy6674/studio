import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  debug_mode?: boolean; // New: For admin debugging
}

// Logging interface for debugging
interface MotivationLog {
  timestamp: Date;
  userId: string;
  request_data: MotivationRequest;
  user_tone: string;
  generated_prompt: string;
  gemini_response?: string;
  final_message: string;
  source: 'gemini' | 'fallback' | 'error_fallback';
  success: boolean;
  error?: string;
}

// Contextual fallback messages based on user status
const getContextualFallback = (stats: MotivationRequest, tone: string = "Default"): string => {
  const { percent_of_goal, current_streak, is_first_log, ml_logged_today, goal_ml } = stats;
  
  // Determine streak status
  const hasRealStreak = current_streak >= 2;
  const isFreshStart = current_streak === 1;
  const noStreak = current_streak === 0;
  
  // First log ever
  if (is_first_log) {
    switch (tone.toLowerCase()) {
      case 'funny': return "🎉 Welcome to the hydration station! Your first drop in the bucket - literally! 💧";
      case 'crass': return "Holy sh*t, you actually remembered water exists! Welcome to not being a desert, mate! 💧😂";
      case 'sarcastic': return "Oh wow, your first log. I'm impressed you remembered water exists. Revolutionary! 💧";
      case 'clinical': return "Welcome! Proper hydration improves cognitive function by 15%. Excellent initial step! 🧠💧";
      case 'warm': return "Welcome to your hydration journey! Every great habit starts with a single sip. You've got this! 💧❤️";
      case 'kind': return "What a wonderful start! You're taking such good care of yourself. I'm proud of you! 💧🌟";
      case 'educational': return "Welcome! Did you know 60% of your body is water? You're supporting every cell! 💧📚";
      default: return "🎉 Welcome! Great first step on your hydration journey. Every sip counts! 💧";
    }
  }
  
  // Goal achieved (100%+)
  if (percent_of_goal >= 100) {
    let streakMessage = "";
    if (hasRealStreak) {
      streakMessage = ` Day ${current_streak} strong!`;
    } else if (isFreshStart) {
      streakMessage = " Great fresh start!";
    }
    
    switch (tone.toLowerCase()) {
      case 'funny': return `🎉 Goal smashed! ${ml_logged_today}ml logged!${streakMessage} Your bladder probably wants to chat... 🚽💧`;
      case 'crass': return `F*ck yeah! ${ml_logged_today}ml down!${streakMessage} You absolute hydration legend! 🏆💧`;
      case 'sarcastic': return `${ml_logged_today}ml logged. Look who remembered how to be a functional human.${streakMessage} ⭐💧`;
      case 'clinical': return `Goal achieved: ${ml_logged_today}ml/${goal_ml}ml.${streakMessage} Optimal hydration supports cellular function! 🔬💧`;
      case 'warm': return `Amazing! ${ml_logged_today}ml logged!${streakMessage} Your body is thanking you right now! 🌟💧`;
      case 'kind': return `You're amazing! Goal reached with ${ml_logged_today}ml!${streakMessage} So proud of you! 💧❤️`;
      case 'educational': return `Goal reached: ${ml_logged_today}ml!${streakMessage} This supports kidney function and nutrient transport! 💧🎓`;
      default: return `🎉 Goal achieved! ${ml_logged_today}ml logged!${streakMessage} You're a hydration hero! 💧`;
    }
  }
  
  // Under 50% - needs encouragement
  if (percent_of_goal < 50) {
    const remaining = goal_ml - ml_logged_today;
    let streakMessage = "";
    if (hasRealStreak) {
      streakMessage = ` Keep that ${current_streak}-day streak alive!`;
    } else if (isFreshStart) {
      streakMessage = " Build on yesterday's good start!";
    }
    
    switch (tone.toLowerCase()) {
      case 'funny': return `${ml_logged_today}ml down, ${remaining}ml to go!${streakMessage} Your kidneys are sending reminder texts... 💧📱`;
      case 'crass': return `${percent_of_goal.toFixed(0)}%? Come on, you're drier than stale toast!${streakMessage} Time to wet your whistle! 💧😤`;
      case 'sarcastic': return `${percent_of_goal.toFixed(0)}%? Really? Your houseplants are more hydrated.${streakMessage} Step it up! 🌱💧`;
      case 'clinical': return `${percent_of_goal.toFixed(0)}% of goal.${streakMessage} Mild dehydration reduces performance by 10%. Time to hydrate! 📊💧`;
      case 'warm': return `You're at ${percent_of_goal.toFixed(0)}%!${streakMessage} Every sip gets you closer. You can do this! 💪💧`;
      case 'kind': return `${percent_of_goal.toFixed(0)}% is progress!${streakMessage} Be gentle with yourself - you're doing great! 💧💝`;
      case 'educational': return `At ${percent_of_goal.toFixed(0)}% - dehydration affects concentration first.${streakMessage} Let's boost brainpower! 💧🧠`;
      default: return `${percent_of_goal.toFixed(0)}% of goal reached!${streakMessage} Keep going, you're building a great habit! 💧`;
    }
  }
  
  // 50-99% - good progress
  let streakMessage = "";
  if (hasRealStreak) {
    streakMessage = ` ${current_streak} days and counting!`;
  } else if (isFreshStart) {
    streakMessage = " Great momentum from yesterday!";
  }
  
  switch (tone.toLowerCase()) {
    case 'funny': return `${percent_of_goal.toFixed(0)}% there!${streakMessage} You're like a camel, but cooler and with better habits! 🐪💧`;
    case 'crass': return `${percent_of_goal.toFixed(0)}%!${streakMessage} Not bad, you beautiful hydration beast! Keep it flowing! 💧🔥`;
    case 'sarcastic': return `${percent_of_goal.toFixed(0)}% done.${streakMessage} Look who's actually taking care of themselves. Shocking! 💧`;
    case 'clinical': return `Great progress: ${percent_of_goal.toFixed(0)}%!${streakMessage} Consistent hydration optimises performance. 🎯💧`;
    case 'warm': return `Wonderful! ${percent_of_goal.toFixed(0)}% complete!${streakMessage} You're doing such a great job! 🌈💧`;
    case 'kind': return `${percent_of_goal.toFixed(0)}% achieved!${streakMessage} Your commitment to health is so inspiring! 💧✨`;
    case 'educational': return `${percent_of_goal.toFixed(0)}% done!${streakMessage} This hydration supports muscle function and energy! 💧⚡`;
    default: return `Excellent! ${percent_of_goal.toFixed(0)}% of goal!${streakMessage} Keep the momentum flowing! 💧`;
  }
};

// Enhanced logging function
async function logMotivationRequest(logData: MotivationLog): Promise<void> {
  try {
    await addDoc(collection(db, "motivation_logs"), {
      ...logData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log motivation request:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logData: Partial<MotivationLog> = {};
  
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
      time_of_day,
      debug_mode = false
    } = body;

    // Initialize log data
    logData = {
      timestamp: new Date(),
      userId,
      request_data: body,
      success: false,
    };

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
        motivationTone = userData.motivationTone || userData.aiTone || "Default";
      }
    } catch (error) {
      console.warn("Could not fetch user motivation tone, using default:", error);
    }

    logData.user_tone = motivationTone;

    // Enhanced contextual prompt with more tone examples
    const contextualPrompt = `Generate a motivational hydration message for a user. Here is their current status:

📊 HYDRATION STATS (DO NOT INVENT OR CHANGE THESE):
- Daily Goal: ${goal_ml}ml
- Logged Today: ${ml_logged_today}ml (${percent_of_goal}%)
- Current Streak: ${current_streak} days
- Best Streak: ${best_streak} days
- Last Log: ${last_log_time || 'Not available'}
- First Ever Log: ${is_first_log ? 'Yes' : 'No'}
${day_of_week ? `- Day: ${day_of_week}` : ''}
${time_of_day ? `- Time: ${time_of_day}` : ''}

🚨 CRITICAL RULES:
- DO NOT INVENT STREAKS OR GOAL DATA - only use the exact numbers provided above
- If current_streak is 0: DO NOT mention any streak
- If current_streak is 1: Call it a "fresh start" or "just beginning" - NOT a streak
- If current_streak is 2+: You can celebrate the actual streak
- Only mention goal achievement if percent_of_goal is 100% or more
- Use the EXACT ml_logged_today and goal_ml numbers provided
- Be truthful about their actual progress

🎯 CONTEXT GUIDELINES:
- If they just hit their goal (100%+): CELEBRATE! 🎉
- If they're under 50%: Be encouraging but motivating
- If it's their first log: Welcome them warmly
- If they have a real streak (2+ days): Acknowledge their consistency
- If it's early morning: Consider "good morning" energy
- If it's evening: Consider end-of-day motivation

🗣️ TONE: ${motivationTone}
TONE EXAMPLES:
- Default: Balanced, friendly and encouraging
- Clinical: Professional, educational with health facts and scientific benefits
- Funny: Humorous with puns, playful language, and comedic observations
- Crass: Raw, unfiltered, cheeky language (but still supportive) - use mild profanity if appropriate
- Sarcastic: Witty, clever and cheeky motivation (but still supportive)
- Warm: Caring, supportive, encouraging and nurturing
- Kind: Gentle, compassionate, understanding and loving
- Educational: Informative with health facts, statistics, and learning

📝 FORMAT:
- Keep under 160 characters for mobile
- Include relevant emoji
- Be specific to their actual progress (use exact numbers provided)
- Make it personal and actionable
- MATCH THE TONE EXACTLY - be creative and authentic to the selected style
- NEVER invent data or exaggerate achievements

Generate ONE motivational message now:`;

    logData.generated_prompt = contextualPrompt;

    // Try Gemini API with enhanced contextual prompt
    let geminiMessage = null;
    try {
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
            temperature: 0.9, // Increased for more creative/varied responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        geminiMessage = result.candidates?.[0]?.content?.parts?.[0]?.text;
        logData.gemini_response = geminiMessage;
        
        if (geminiMessage && geminiMessage.length > 0) {
          logData.final_message = geminiMessage.trim();
          logData.source = 'gemini';
          logData.success = true;
          
          // Log the successful request
          await logMotivationRequest(logData as MotivationLog);
          
          const responseData: any = { 
            message: geminiMessage.trim(),
            source: 'gemini',
            tone: motivationTone,
            stats: { ml_logged_today, percent_of_goal, current_streak },
            response_time_ms: Date.now() - startTime
          };
          
          // Add debug info if requested
          if (debug_mode) {
            responseData.debug = {
              prompt: contextualPrompt,
              raw_response: result,
              user_tone: motivationTone,
              timestamp: new Date().toISOString()
            };
          }
          
          return NextResponse.json(responseData);
        }
      } else {
        console.error('Gemini API non-OK response:', response.status, response.statusText);
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      logData.error = geminiError instanceof Error ? geminiError.message : String(geminiError);
    }

    // Fallback to contextual built-in message
    const fallbackMessage = getContextualFallback(body, motivationTone);
    logData.final_message = fallbackMessage;
    logData.source = 'fallback';
    logData.success = true;
    
    // Log the fallback request
    await logMotivationRequest(logData as MotivationLog);
    
    const responseData: any = { 
      message: fallbackMessage,
      source: 'fallback',
      tone: motivationTone,
      stats: { ml_logged_today, percent_of_goal, current_streak },
      response_time_ms: Date.now() - startTime
    };
    
    // Add debug info if requested
    if (debug_mode) {
      responseData.debug = {
        prompt: contextualPrompt,
        fallback_used: true,
        user_tone: motivationTone,
        timestamp: new Date().toISOString()
      };
    }
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error generating AI motivation:', error);
    
    const errorMessage = "Keep hydrating! Every sip counts towards your health! 💧";
    logData.final_message = errorMessage;
    logData.source = 'error_fallback';
    logData.success = false;
    logData.error = error.message;
    
    // Log the error
    try {
      await logMotivationRequest(logData as MotivationLog);
    } catch (logError) {
      console.error('Failed to log error case:', logError);
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      source: 'error_fallback',
      error: error.message,
      response_time_ms: Date.now() - startTime
    }, { status: 200 }); // Return 200 so frontend gets the fallback message
  }
} 