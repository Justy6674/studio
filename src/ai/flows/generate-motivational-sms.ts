'use server';

/**
 * @fileOverview Generates a motivational SMS message based on the user's recent hydration log.
 *
 * - generateMotivationalSms - A function that generates the motivational SMS message.
 * - GenerateMotivationalSmsInput - The input type for the generateMotivationalSms function.
 * - GenerateMotivationalSmsOutput - The return type for the generateMotivationalSms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotivationalSmsInputSchema = z.object({
  tone: z.string().describe('The tone of the message (e.g., funny, kind, crass).'),
  ml_logged_today: z.number().describe("The total amount of water in ml the user has logged today."),
  goal_ml: z.number().describe('The user daily hydration goal in ml.'),
  current_streak: z.number().describe('The user current daily hydration streak in days.'),
});
export type GenerateMotivationalSmsInput = z.infer<typeof GenerateMotivationalSmsInputSchema>;

const GenerateMotivationalSmsOutputSchema = z.object({
  message: z.string().describe('The motivational SMS message to send to the user.'),
});
export type GenerateMotivationalSmsOutput = z.infer<typeof GenerateMotivationalSmsOutputSchema>;

export async function generateMotivationalSms(input: GenerateMotivationalSmsInput): Promise<GenerateMotivationalSmsOutput> {
  return generateMotivationalSmsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalSmsPrompt',
  input: {schema: GenerateMotivationalSmsInputSchema},
  output: {schema: GenerateMotivationalSmsOutputSchema},
  system: `You are a motivational AI assistant. Your goal is to generate an encouraging message for a user of a hydration tracking app.

The user has specified a preferred tone for messages: {{tone}}. You MUST strictly adhere to this tone.

Keep messages under 160 characters for SMS compatibility.`, 
  prompt: `The user's daily hydration goal is {{goal_ml}}ml.
They have logged {{ml_logged_today}}ml so far today.
They are on a {{current_streak}}-day streak.

Write a short, encouraging message in a '{{tone}}' tone (under 160 chars) that motivates them to stay hydrated. Be specific to their data.`,  
});

const generateMotivationalSmsFlow = ai.defineFlow(
  {
    name: 'generateMotivationalSmsFlow',
    inputSchema: GenerateMotivationalSmsInputSchema,
    outputSchema: GenerateMotivationalSmsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
