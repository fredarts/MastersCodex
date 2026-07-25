import { IAIProvider } from './IAIProvider';

export class OpenRouterProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'meta-llama/llama-3.3-70b-instruct:free') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://masterscodex.app',
          'X-Title': 'Masters Codex RPG',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || 'Sem resposta do OpenRouter.';
        return { text, provider: `openrouter (${this.model})` };
      } else {
        const errText = await res.text();
        console.warn('Erro OpenRouter HTTP:', res.status, errText);
        throw new Error(`OpenRouter HTTP Error: ${res.status}`);
      }
    } catch (error: any) {
      console.warn('Erro na chamada OpenRouter API:', error?.message || error);
      throw error;
    }
  }
}
