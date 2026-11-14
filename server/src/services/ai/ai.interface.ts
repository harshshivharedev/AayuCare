export interface IAiService {
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateStructuredJson<T = any>(prompt: string, systemInstruction?: string): Promise<T>;
}
