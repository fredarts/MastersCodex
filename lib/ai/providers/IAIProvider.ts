export interface IAIProvider {
  /**
   * Generates a narrative/response based on the given prompt context.
   * @param prompt The full prompt context to send to the AI
   * @returns A promise resolving to the text response and the provider identifier
   */
  generateNarrative(prompt: string): Promise<{ text: string; provider: string }>;
}
