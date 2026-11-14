import { IAiProvider, AiGenerateOptions } from './ai.interface';

export class MockAiProvider implements IAiProvider {
  public readonly name = 'Offline Fallback Mock Provider';

  isAvailable(): boolean {
    return true;
  }

  async generateText(prompt: string, options?: AiGenerateOptions): Promise<string> {
    return `[Mock AI Analysis]: Processed prompt "${prompt.slice(0, 60)}..." successfully with simulated parameters.`;
  }

  async generateStructuredJson<T = any>(prompt: string, options?: AiGenerateOptions): Promise<T> {
    return {
      status: 'success',
      mock: true,
      provider: this.name,
      promptReceived: prompt,
      recommendation: 'System is operating reliably in fallback mode.',
      timestamp: new Date().toISOString()
    } as unknown as T;
  }
}
