import { GoogleGenAI } from '@google/genai';
import { IAIProvider } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text || 'Não foi possível gerar a resposta.';
      return { text, provider: `gemini (${this.model})` };
    } catch (error: any) {
      console.warn('Erro na chamada da API Gemini:', error?.message || error);
      throw error;
    }
  }
}

