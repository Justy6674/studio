
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
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { currentHydration, goal, percentage } = await request.json();

    // Simple motivation generation based on progress
    const motivations = [
      {
        condition: (p: number) => p >= 100,
        messages: [
          '🎉 Incredible! You\'ve crushed your hydration goal! Your body is thanking you right now!',
          '🌟 Goal achieved! You\'re a hydration champion! Keep this amazing momentum going!',
          '💧 Outstanding! You\'ve reached your target! Your cells are dancing with joy!'
        ]
      },
      {
        condition: (p: number) => p >= 75,
        messages: [
          '🚀 You\'re so close! Just a few more sips to reach your goal!',
          '💪 Amazing progress! You\'re in the final stretch - keep going!',
          '⭐ Three-quarters there! Your dedication is paying off!'
        ]
      },
      {
        condition: (p: number) => p >= 50,
        messages: [
          '🌊 Halfway there! You\'re building great hydration habits!',
          '📈 Great momentum! Keep this steady pace and you\'ll hit your goal!',
          '💧 Solid progress! Your body is loving this consistent hydration!'
        ]
      },
      {
        condition: (p: number) => p >= 25,
        messages: [
          '🌱 Nice start! Every sip is a step towards better health!',
          '💫 You\'re on your way! Small consistent steps lead to big results!',
          '🎯 Good beginning! Remember, your goal is totally achievable!'
        ]
      },
      {
        condition: (p: number) => p < 25,
        messages: [
          '🌅 It\'s a new day! Start strong with some refreshing water!',
          '💧 Your body is ready for hydration! Let\'s make today count!',
          '🎉 Every journey starts with a single sip! You\'ve got this!'
        ]
      }
    ];

    const matchingCategory = motivations.find(cat => cat.condition(percentage));
    const randomMessage = matchingCategory?.messages[Math.floor(Math.random() * matchingCategory.messages.length)] || 
                         'Stay hydrated and keep pushing towards your goal! 💧';

    return NextResponse.json({
      motivation: randomMessage,
      currentHydration,
      goal,
      percentage
    });

  } catch (error) {
    console.error('Error generating motivation:', error);
    return NextResponse.json(
      { error: 'Failed to generate motivation', motivation: 'Keep up the great work with your hydration! 💧' },
      { status: 500 }
    );
  }
}
