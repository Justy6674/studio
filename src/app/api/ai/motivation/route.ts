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
    switch (tone.toLowerCase()) {
      case 'funny': return `🎉 You did it! ${ml_logged_today}ml logged! Your bladder probably wants to have a word with you though... 🚽💧`;
      case 'crass': return `F*ck yeah! ${ml_logged_today}ml down the hatch! You absolute hydration legend! 🏆💧`;
      case 'sarcastic': return `Congratulations, you remembered how to drink water like a functioning human. Gold star! ⭐💧`;
      case 'clinical': return `Excellent! Goal achieved: ${ml_logged_today}ml. Optimal hydration supports cellular function and metabolism! 🔬💧`;
      case 'warm': return `Amazing work! You've reached your ${goal_ml}ml goal! Your body is thanking you right now. Keep it up! 🌟💧`;
      case 'kind': return `You're absolutely amazing! Goal achieved with such dedication. I'm so proud of you! 💧❤️`;
      case 'educational': return `Goal reached! This supports kidney function, joint lubrication, and nutrient transport! 💧🎓`;
      default: return `🎉 Goal smashed! ${ml_logged_today}ml logged. You're a hydration hero! 💧`;
    }
  }
  
  // Under 50% - needs encouragement
  if (percent_of_goal < 50) {
    switch (tone.toLowerCase()) {
      case 'funny': return `${ml_logged_today}ml down, ${goal_ml - ml_logged_today}ml to go! Your kidneys are sending you reminder texts... 💧📱`;
      case 'crass': return `${percent_of_goal}%? Come on, you're drier than a nun's nasty! Time to wet your whistle! 💧😤`;
      case 'sarcastic': return `${percent_of_goal}%? Really? Your houseplants are more hydrated than you are. Step it up! 🌱💧`;
      case 'clinical': return `Currently at ${percent_of_goal}% of goal. Mild dehydration reduces performance by 10%. Time to hydrate! 📊💧`;
      case 'warm': return `You're at ${percent_of_goal}% - every sip gets you closer! Small steps lead to big changes. You can do this! 💪💧`;
      case 'kind': return `${percent_of_goal}% is a great start! Be gentle with yourself - progress, not perfection! 💧💝`;
      case 'educational': return `At ${percent_of_goal}% - dehydration affects concentration first. Let's boost that brainpower! 💧🧠`;
      default: return `${percent_of_goal}% of your goal reached! Keep going, you're building a great habit! 💧`;
    }
  }
  
  // 50-99% - good progress
  switch (tone.toLowerCase()) {
    case 'funny': return `${percent_of_goal}% there! You're like a camel, but cooler and with better hydration habits! 🐪💧`;
    case 'crass': return `${percent_of_goal}%! Not bad, you beautiful bastard! Keep that liquid flowing! 💧🔥`;
    case 'sarcastic': return `${percent_of_goal}% done. Look who's actually taking care of themselves. Shocking! 💧`;
    case 'clinical': return `Great progress at ${percent_of_goal}%! Consistent hydration optimises physical and mental performance. 🎯💧`;
    case 'warm': return `Wonderful progress! ${percent_of_goal}% complete. You're doing such a great job staying on track! 🌈💧`;
    case 'kind': return `${percent_of_goal}% - you're doing brilliantly! Your commitment to health is inspiring! 💧✨`;
    case 'educational': return `${percent_of_goal}% achieved! This hydration supports muscle function and energy levels! 💧⚡`;
    default: return `Excellent progress! ${percent_of_goal}% of your daily goal achieved. Keep it flowing! 💧`;
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
- Be specific to their actual progress
- Make it personal and actionable
- MATCH THE TONE EXACTLY - be creative and authentic to the selected style

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