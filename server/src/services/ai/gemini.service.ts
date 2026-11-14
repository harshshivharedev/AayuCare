import { GoogleGenAI } from '@google/genai';
import { IAiService } from './ai.interface';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export class GeminiService implements IAiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor() {
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        logger.info('🤖 Gemini AI Service initialized successfully');
      } catch (error) {
        logger.warn('Failed to initialize GoogleGenAI client:', error);
      }
    } else {
      logger.info('ℹ️ GEMINI_API_KEY is not set. GeminiService is operating in mock/fallback mode.');
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.ai) {
      return `[Demo/Fallback AI Response]: Analysis for "${prompt}". Configure GEMINI_API_KEY for live Google Gemini calls.`;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      return response.text || '';
    } catch (error: any) {
      logger.error('Gemini generateText error:', error.message);
      throw error;
    }
  }

  async generateStructuredJson<T = any>(prompt: string, systemInstruction?: string): Promise<T> {
    if (!this.ai) {
      return {
        mock: true,
        message: 'Mock structured output. Add GEMINI_API_KEY in .env for live Gemini output.',
        analyzedPrompt: prompt
      } as unknown as T;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      return JSON.parse(text) as T;
    } catch (error: any) {
      logger.error('Gemini generateStructuredJson error:', error.message);
      throw error;
    }
  }
}

// Singleton export
export const geminiService = new GeminiService();
