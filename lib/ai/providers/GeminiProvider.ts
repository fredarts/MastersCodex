import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || 'Não foi possível gerar a resposta.';
      return { text, provider: 'gemini' };
    } catch (error: any) {
      console.warn('Erro na chamada da API Gemini:', error?.message || error);
      throw error;
    }
  }
}
