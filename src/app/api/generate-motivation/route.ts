
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId, currentIntake, goal, streak, preferences } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const progressPercentage = Math.min((currentIntake / goal) * 100, 100);
    const tone = preferences?.tone || 'encouraging';

    const prompt = `Generate a short, ${tone} motivational message for a hydration tracking app user.
    
    User details:
    - Current water intake: ${currentIntake}ml
    - Daily goal: ${goal}ml  
    - Progress: ${progressPercentage.toFixed(1)}%
    - Current streak: ${streak} days
    
    Guidelines:
    - Keep it under 100 words
    - Be ${tone} and supportive
    - Include relevant hydration tips or health benefits
    - Use water/hydration related emojis sparingly
    - Make it personal and actionable
    
    ${progressPercentage < 25 ? 'User needs encouragement to start drinking more.' : ''}
    ${progressPercentage >= 25 && progressPercentage < 75 ? 'User is making progress but needs motivation to continue.' : ''}
    ${progressPercentage >= 75 ? 'User is doing well, acknowledge their progress.' : ''}
    ${streak > 7 ? 'Acknowledge their impressive streak.' : ''}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text();

    return NextResponse.json({ message: message.trim() });
  } catch (error) {
    console.error('Error generating motivation:', error);
    return NextResponse.json(
      { error: 'Failed to generate motivation' },
      { status: 500 }
    );
  }
}
