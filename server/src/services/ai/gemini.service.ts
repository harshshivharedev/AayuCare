import { aiService } from './ai.service';

// Backward compatibility export redirecting to hardened AiService
export const geminiService = {
  generateText: (prompt: string, instruction?: string) =>
    aiService.generateText(prompt, { systemInstruction: instruction }).then((res) => res.result),
  generateStructuredJson: <T = any>(prompt: string, instruction?: string) =>
    aiService.generateStructuredJson<T>(prompt, { systemInstruction: instruction }).then((res) => res.result)
};
