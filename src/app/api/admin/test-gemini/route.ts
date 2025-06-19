import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tone = "Default",
      ml_logged_today = 500,
      goal_ml = 2000,
      current_streak = 3,
    } = body;

    const percent_of_goal = Math.round((ml_logged_today / goal_ml) * 100);

    // Enhanced test prompt
    const testPrompt = `Generate a motivational hydration message for a user. Here is their current status:

📊 HYDRATION STATS:
- Daily Goal: ${goal_ml}ml
- Logged Today: ${ml_logged_today}ml (${percent_of_goal}%)
- Current Streak: ${current_streak} days
- Best Streak: ${current_streak + 2} days
- Last Log: ${new Date().toISOString()}
- First Ever Log: No
- Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}
- Time: ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}

🎯 CONTEXT GUIDELINES:
- If they just hit their goal (100%+): CELEBRATE! 🎉
- If they're under 50%: Be encouraging but motivating
- If it's their first log: Welcome them warmly
- If they have a good streak: Acknowledge their consistency

🗣️ TONE: ${tone}
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

    const startTime = Date.now();

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        }
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Gemini API error: ${response.status} ${response.statusText}`,
        response_time_ms: responseTime,
        prompt: testPrompt,
        test_params: { tone, ml_logged_today, goal_ml, percent_of_goal, current_streak }
      }, { status: 500 });
    }

    const result = await response.json();
    const message = result.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      success: true,
      message: message?.trim() || "No message generated",
      raw_response: result,
      prompt: testPrompt,
      response_time_ms: responseTime,
      test_params: {
        tone,
        ml_logged_today,
        goal_ml,
        percent_of_goal,
        current_streak
      },
      gemini_config: {
        model: "gemini-1.5-flash-latest",
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 150
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 