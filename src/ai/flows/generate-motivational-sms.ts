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

const includeSpecificLogsTool = ai.defineTool({
  name: 'includeSpecificLogs',
  description: 'Decide whether or not to include specific logged details in the SMS message.',
  inputSchema: z.object({
    shouldInclude: z.boolean().describe('Whether or not to include specific logged details.'),
  }),
  outputSchema: z.boolean(),
}, async (input) => {
  return input.shouldInclude;
});

const prompt = ai.definePrompt({
  name: 'generateMotivationalSmsPrompt',
  input: {schema: GenerateMotivationalSmsInputSchema},
  output: {schema: GenerateMotivationalSmsOutputSchema},
  tools: [includeSpecificLogsTool],
  system: `You are a motivational AI assistant that generates encouraging SMS messages based on the user's hydration data. The goal is to motivate the user to stay consistent with their hydration goals. Be friendly and supportive. Avoid shaming or negative language.

  You have access to the user's hydration logs from the past 24-48 hours, their hydration goal, and a tool to decide whether or not to include specific logged details.`,
  prompt: `Based on this user's hydration log:

{{#if hydrationLogs}}
  {{#each hydrationLogs}}
    - Logged {{amount}}ml on {{timestamp}}
  {{/each}}
{{else}}
  No hydration data available for the past 24-48 hours.
{{/if}}

Their hydration goal is {{hydrationGoal}}ml.

{{~#tool_call includeSpecificLogsTool~}}
{{~#if (eq name \"includeSpecificLogs\")~}}
{{~#with parameters~}}
{{~#if shouldInclude~}}
Include specific details from the logs
{{~else}}
Do not include specific details from the logs
{{~/if~}}
{{~/with~}}
{{~/if~}}
{{~/tool_call~}}

Write a short, kind motivational message.`, 
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
