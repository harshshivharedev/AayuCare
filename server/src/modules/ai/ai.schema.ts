import { z } from 'zod';

export const aiAnalyzeSchema = z.object({
  body: z.object({
    prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(5000),
    systemInstruction: z.string().optional()
  })
});

export type AiAnalyzeInput = z.infer<typeof aiAnalyzeSchema>['body'];
