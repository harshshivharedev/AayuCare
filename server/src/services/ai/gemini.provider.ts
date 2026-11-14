import { GoogleGenAI } from '@google/genai';
import { IAiProvider, AiGenerateOptions } from './ai.interface';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export class GeminiAiProvider implements IAiProvider {
  public readonly name = 'Google Gemini 2.5 Flash';
  private client: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor() {
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
      try {
        this.client = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        logger.info('✅ GeminiAiProvider successfully initialized');
      } catch (err: any) {
        logger.warn('Failed to construct GoogleGenAI client:', undefined, { error: err.message });
      }
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async generateText(prompt: string, options?: AiGenerateOptions): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API client not configured (GEMINI_API_KEY missing)');
    }

    const timeout = options?.timeoutMs || 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: options?.systemInstruction,
          temperature: options?.temperature ?? 0.7
        }
      });

      return response.text || '';
    } finally {
      clearTimeout(timer);
    }
  }

  async generateStructuredJson<T = any>(prompt: string, options?: AiGenerateOptions): Promise<T> {
    if (!this.client) {
      throw new Error('Gemini API client not configured (GEMINI_API_KEY missing)');
    }

    const timeout = options?.timeoutMs || 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: options?.systemInstruction,
          responseMimeType: 'application/json',
          temperature: options?.temperature ?? 0.2
        }
      });

      const text = response.text || '{}';
      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
