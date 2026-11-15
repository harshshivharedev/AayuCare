import { IAiProvider, AiGenerateOptions, AiExecutionResult } from './ai.interface';
import { AdaptionAiProvider } from './adaption.provider';
import { GeminiAiProvider } from './gemini.provider';
import { MockAiProvider } from './mock.provider';
import { logger } from '../../utils/logger';

export class AiService {
  constructor(
    private readonly primaryProvider: IAiProvider = new AdaptionAiProvider(),
    private readonly secondaryProvider: IAiProvider = new GeminiAiProvider(),
    private readonly fallbackProvider: IAiProvider = new MockAiProvider()
  ) {}

  async generateText(
    prompt: string,
    options?: AiGenerateOptions,
    requestId?: string
  ): Promise<AiExecutionResult<string>> {
    const startTime = Date.now();

    // 1. Try Primary Provider (Adaption AI)
    if (this.primaryProvider.isAvailable()) {
      try {
        const text = await this.primaryProvider.generateText(prompt, options);
        const latencyMs = Date.now() - startTime;
        logger.info(`AI text generated via [${this.primaryProvider.name}] in ${latencyMs}ms`, requestId);
        return { result: text, provider: this.primaryProvider.name, latencyMs };
      } catch (error: any) {
        logger.warn(`Primary provider [${this.primaryProvider.name}] failed: ${error.message}. Engaging secondary...`, requestId);
      }
    }

    // 2. Try Secondary Provider (Gemini)
    if (this.secondaryProvider.isAvailable()) {
      try {
        const text = await this.secondaryProvider.generateText(prompt, options);
        const latencyMs = Date.now() - startTime;
        logger.info(`AI text generated via secondary [${this.secondaryProvider.name}] in ${latencyMs}ms`, requestId);
        return { result: text, provider: this.secondaryProvider.name, latencyMs };
      } catch (error: any) {
        logger.warn(`Secondary provider [${this.secondaryProvider.name}] failed: ${error.message}. Engaging fallback...`, requestId);
      }
    }

    // 3. Deterministic Offline Fallback
    const text = await this.fallbackProvider.generateText(prompt, options);
    const latencyMs = Date.now() - startTime;
    return { result: text, provider: this.fallbackProvider.name, latencyMs };
  }

  async generateStructuredJson<T = any>(
    prompt: string,
    options?: AiGenerateOptions,
    requestId?: string
  ): Promise<AiExecutionResult<T>> {
    const startTime = Date.now();

    // 1. Try Primary Provider (Adaption AI)
    if (this.primaryProvider.isAvailable()) {
      try {
        const data = await this.primaryProvider.generateStructuredJson<T>(prompt, options);
        const latencyMs = Date.now() - startTime;
        logger.info(`AI JSON generated via [${this.primaryProvider.name}] in ${latencyMs}ms`, requestId);
        return { result: data, provider: this.primaryProvider.name, latencyMs };
      } catch (error: any) {
        logger.warn(`Primary provider [${this.primaryProvider.name}] JSON failed: ${error.message}. Engaging secondary...`, requestId);
      }
    }

    // 2. Try Secondary Provider (Gemini)
    if (this.secondaryProvider.isAvailable()) {
      try {
        const data = await this.secondaryProvider.generateStructuredJson<T>(prompt, options);
        const latencyMs = Date.now() - startTime;
        logger.info(`AI JSON generated via secondary [${this.secondaryProvider.name}] in ${latencyMs}ms`, requestId);
        return { result: data, provider: this.secondaryProvider.name, latencyMs };
      } catch (error: any) {
        logger.warn(`Secondary provider [${this.secondaryProvider.name}] JSON failed: ${error.message}. Engaging fallback...`, requestId);
      }
    }

    // 3. Fallback
    const data = await this.fallbackProvider.generateStructuredJson<T>(prompt, options);
    const latencyMs = Date.now() - startTime;
    return { result: data, provider: this.fallbackProvider.name, latencyMs };
  }
}

export const aiService = new AiService();
