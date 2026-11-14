import { GoogleGenAI } from '@google/genai';
import { IAiService } from './ai.interface';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export class GeminiService implements IAiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor() {
    if (ENV.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        logger.info('🤖 Gemini AI Service initialized successfully');
      } catch (error) {
        logger.warn('Failed to initialize GoogleGenAI client:', error);
      }
    } else {
      logger.warn('⚠️ GEMINI_API_KEY is not set. GeminiService will run in mock/fallback mode.');
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.ai) {
      return `[Mock AI Response - Set GEMINI_API_KEY in .env to enable live AI]: Processed prompt: "${prompt.slice(0, 50)}..."`;
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
        message: 'Mock JSON response. Add GEMINI_API_KEY for real AI processing.',
        originalPrompt: prompt
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
