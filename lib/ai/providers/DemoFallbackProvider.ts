import { IAIProvider } from './IAIProvider';

export class DemoFallbackProvider implements IAIProvider {
  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    if (prompt.includes('formato JSON') || prompt.includes('JSON')) {
      return {
        text: JSON.stringify({
          name: "Entidade Gerada (Modo Demo)",
          subType: "Mistério Ancestral",
          shortDesc: "Uma criação mística aguardando detalhamento.",
          fullContent: "Para ativar a geração com Inteligência Artificial avançada, adicione sua chave de API nas Configurações do Mestre (Gemini ou OpenRouter).",
          extraAttr1: "Desconhecido",
          extraAttr2: "Lendário"
        }),
        provider: 'demo-fallback'
      };
    }
    
    const originalPrompt = prompt.split('--- Narração Gerada Simulada ---').pop() || prompt;
    
    return {
      text: `[MODO DEMO - NENHUMA CHAVE DE IA CONFIGURADA]\n\nPara ativar a inteligência artificial real do Gemini ou OpenRouter, adicione a chave no arquivo .env.local ou nas Configurações do Mestre.\n\n--- Narração Gerada Simulada ---\n${originalPrompt}`,
      provider: 'demo-fallback',
    };
  }
}

