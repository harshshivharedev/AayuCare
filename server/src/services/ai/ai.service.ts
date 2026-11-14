import { IAiProvider, AiGenerateOptions, AiExecutionResult } from './ai.interface';
import { GeminiAiProvider } from './gemini.provider';
import { MockAiProvider } from './mock.provider';
import { logger } from '../../utils/logger';

export class AiService {
  constructor(
    private readonly primaryProvider: IAiProvider = new GeminiAiProvider(),
    private readonly fallbackProvider: IAiProvider = new MockAiProvider()
  ) {}

  async generateText(
    prompt: string,
    options?: AiGenerateOptions,
    requestId?: string
  ): Promise<AiExecutionResult<string>> {
    const startTime = Date.now();

    // 1. Try Primary Provider (Gemini)
    if (this.primaryProvider.isAvailable()) {
      try {
        const text = await this.primaryProvider.generateText(prompt, options);
        const latencyMs = Date.now() - startTime;

        logger.info(
          `AI GenerateText succeeded via [${this.primaryProvider.name}] in ${latencyMs}ms`,
          requestId
        );

        return {
          result: text,
          provider: this.primaryProvider.name,
          latencyMs
        };
      } catch (error: any) {
        logger.warn(
          `Primary AI provider [${this.primaryProvider.name}] failed, engaging fallback: ${error.message}`,
          requestId
        );
      }
    }

    // 2. Resilient Fallback Provider
    const text = await this.fallbackProvider.generateText(prompt, options);
    const latencyMs = Date.now() - startTime;

    return {
      result: text,
      provider: this.fallbackProvider.name,
      latencyMs
    };
  }

  async generateStructuredJson<T = any>(
    prompt: string,
    options?: AiGenerateOptions,
    requestId?: string
  ): Promise<AiExecutionResult<T>> {
    const startTime = Date.now();

    if (this.primaryProvider.isAvailable()) {
      try {
        const data = await this.primaryProvider.generateStructuredJson<T>(prompt, options);
        const latencyMs = Date.now() - startTime;

        logger.info(
          `AI StructuredJson succeeded via [${this.primaryProvider.name}] in ${latencyMs}ms`,
          requestId
        );

        return {
          result: data,
          provider: this.primaryProvider.name,
          latencyMs
        };
      } catch (error: any) {
        logger.warn(
          `Primary AI provider failed structured JSON, engaging fallback: ${error.message}`,
          requestId
        );
      }
    }

    const data = await this.fallbackProvider.generateStructuredJson<T>(prompt, options);
    const latencyMs = Date.now() - startTime;

    return {
      result: data,
      provider: this.fallbackProvider.name,
      latencyMs
    };
  }
}

// Default Singleton instance
export const aiService = new AiService();
