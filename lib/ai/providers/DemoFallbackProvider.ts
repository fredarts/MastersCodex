import { IAIProvider } from './IAIProvider';

export class DemoFallbackProvider implements IAIProvider {
  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    const originalPrompt = prompt.split('--- Narração Gerada Simulada ---').pop() || prompt;
    
    return {
      text: `[MODO DEMO - NENHUMA CHAVE DE IA CONFIGURADA]\n\nPara ativar a inteligência artificial real do Gemini ou OpenRouter, adicione a chave no arquivo .env.local:\n\nGEMINI_API_KEY=sua_chave_aqui\nOU\nOPENROUTER_API_KEY=sua_chave_aqui\n\n--- Narração Gerada Simulada ---\n${originalPrompt}`,
      provider: 'demo-fallback',
    };
  }
}
