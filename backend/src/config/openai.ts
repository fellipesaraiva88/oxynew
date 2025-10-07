import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey
});

// Default models
export const AI_MODELS = {
  CLIENT: 'gpt-4o-mini', // Cliente usa GPT-4o-mini para otimização de custo
  OXY_ASSISTANT: 'gpt-4o-mini', // OxyAssistant usa GPT-4o-mini para otimização de custo
  FALLBACK: 'gpt-3.5-turbo'
} as const;

// Token pricing (in cents per 1K tokens)
export const TOKEN_PRICING = {
  'gpt-4-turbo-preview': { input: 1.0, output: 3.0 },
  'gpt-4o-mini': { input: 0.015, output: 0.06 }, // Preços do GPT-4o-mini
  'gpt-3.5-turbo': { input: 0.05, output: 0.15 }
} as const;

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING['gpt-3.5-turbo'];
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return Math.round((inputCost + outputCost) * 100); // Return cents
}
