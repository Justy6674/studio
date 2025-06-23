import { NextRequest, NextResponse } from 'next/server';
import { getMotivation } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { currentIntake, goal, streak, preferences, name } = await request.json();

    if (
      currentIntake === undefined ||
      goal === undefined ||
      streak === undefined ||
      !preferences?.tone
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: currentIntake, goal, streak, preferences.tone' },
        { status: 400 }
      );
    }

    const message = await getMotivation({
      currentIntake,
      goal,
      streak,
      tone: preferences.tone,
      name: name || 'there',
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error in /api/generate-motivation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to generate motivation', details: errorMessage },
      { status: 500 }
    );
  }
}