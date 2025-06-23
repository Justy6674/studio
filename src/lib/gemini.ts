import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('GEMINI_API_KEY environment variable is not set. Motivational messages will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

const generationConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 150,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface MotivationDetails {
  tone: string;
  name: string;
  currentIntake: number;
  goal: number;
  streak: number;
}

export async function getMotivation(details: MotivationDetails): Promise<string> {
  const { tone, name, currentIntake, goal, streak } = details;
  const userName = name || 'there';

  if (!model) {
    return `Hey ${userName}, it's time for a water break! Stay hydrated.`;
  }

  const progressPercentage = goal > 0 ? Math.min((currentIntake / goal) * 100, 100) : 0;

  const prompt = `
    Generate a short, motivational message for a hydration tracking app user.
    The user's name is ${userName}.
    Their tone preference is "${tone}".

    User's current stats:
    - Today's water intake: ${currentIntake}ml
    - Daily goal: ${goal}ml
    - Progress: ${progressPercentage.toFixed(0)}%
    - Current streak: ${streak} days

    Guidelines:
    - Keep the message under 150 characters.
    - Be very ${tone}.
    - Make it personal and actionable.
    - Use water/hydration related emojis sparingly (1-2 max).
    - Do NOT use markdown.

    Contextual hints for the tone:
    ${progressPercentage < 25 ? 'User needs encouragement to get started.' : ''}
    ${progressPercentage >= 25 && progressPercentage < 75 ? 'User is making good progress, motivate them to keep going.' : ''}
    ${progressPercentage >= 75 ? 'User is close to their goal, cheer them on to the finish line.' : ''}
    ${streak > 7 ? 'Acknowledge their impressive streak of over a week!' : ''}
  `;

  try {
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    let text = '';
    for await (const chunk of result.stream) {
      text += chunk.text();
    }

    return text.trim().replace(/"/g, ''); // Clean up response

  } catch (error) {
    console.error('Error generating motivational message from Gemini:', error);
    return `Hey ${userName}, it's time for a water break! Stay hydrated.`;
  }
}
