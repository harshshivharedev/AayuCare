export interface AiGenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface AiExecutionResult<T = string> {
  result: T;
  provider: string;
  latencyMs: number;
  cached?: boolean;
}

export interface IAiProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateText(prompt: string, options?: AiGenerateOptions): Promise<string>;
  generateStructuredJson<T = any>(prompt: string, options?: AiGenerateOptions): Promise<T>;
}
