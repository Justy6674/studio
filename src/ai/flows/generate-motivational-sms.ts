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
  userId: z.string().describe('The ID of the user.'),
  hydrationLogs: z.array(
    z.object({
      amount: z.number().describe('The amount of water logged in ml.'),
      timestamp: z.string().describe('The timestamp of the hydration log entry.'),
    })
  ).describe('The user hydration logs from the past 24-48 hours.'),
  hydrationGoal: z.number().describe('The user hydration goal in ml.'),
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
  system: `You are a motivational AI assistant that generates encouraging SMS messages based on the user's hydration data. The goal is to motivate the user to stay consistent with their hydration goals. Be friendly and supportive. Avoid shaming or negative language.

Keep messages under 160 characters for SMS compatibility.`,
  prompt: `Based on this user's hydration log:

{{#if hydrationLogs}}
Recent hydration activity:
  {{#each hydrationLogs}}
    - {{amount}}ml logged on {{timestamp}}
  {{/each}}
{{else}}
  No hydration data available for the past 24-48 hours.
{{/if}}

Their daily hydration goal is {{hydrationGoal}}ml.

Write a short, encouraging SMS message (under 160 chars) that motivates them to stay hydrated. Be specific to their data if available.`, 
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
