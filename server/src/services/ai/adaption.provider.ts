import { IAiProvider, AiGenerateOptions } from './ai.interface';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export class AdaptionAiProvider implements IAiProvider {
  public readonly name = 'Adaption AI Clinical Engine';

  isAvailable(): boolean {
    return Boolean(ENV.ADAPTION_AI_API_KEY && ENV.ADAPTION_AI_API_KEY.trim() !== '');
  }

  async generateText(prompt: string, options?: AiGenerateOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Adaption AI API key is not configured in .env (ADAPTION_AI_API_KEY)');
    }

    const timeout = options?.timeoutMs || 8000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${ENV.ADAPTION_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.ADAPTION_AI_API_KEY}`
        },
        body: JSON.stringify({
          model: ENV.ADAPTION_AI_MODEL,
          messages: [
            {
              role: 'system',
              content: options?.systemInstruction || 'You are an expert geriatric clinical AI assistant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options?.temperature ?? 0.2
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Adaption AI HTTP error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('AdaptionAiProvider generateText failed:', undefined, { error: error.message });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async generateStructuredJson<T = any>(prompt: string, options?: AiGenerateOptions): Promise<T> {
    const jsonInstruction = `${options?.systemInstruction || ''}\nReturn ONLY a valid, raw JSON object matching the requested schema without markdown backticks or commentary.`;

    const rawText = await this.generateText(prompt, {
      ...options,
      systemInstruction: jsonInstruction,
      temperature: 0.1
    });

    try {
      // Clean possible markdown code fences (```json ... ```)
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (parseError: any) {
      logger.error('Failed to parse Adaption AI response as JSON:', undefined, { rawText });
      throw new Error(`Adaption AI returned malformed JSON: ${parseError.message}`);
    }
  }
}
