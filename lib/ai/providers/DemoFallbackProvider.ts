import { IAIProvider } from './IAIProvider';

export class DemoFallbackProvider implements IAIProvider {
  async generateNarrative(prompt: string): Promise<{ text: string; provider: string }> {
    if (prompt.includes('houseName') || prompt.includes('árvore genealógica') || prompt.includes('linhagem')) {
      return {
        text: JSON.stringify({
          houseName: "Casa Valerius do Norte (Modo Demonstração)",
          houseMotto: "Pelo Aço e pela Honra Antiga",
          description: "Uma nobre dinastia de guerreiros e lordes que guardam as fortalezas do reino há gerações.",
          members: [
            {
              id: "mem_demo_1",
              name: "Lorde Alistair Valerius",
              title: "Grão-Duque Fundador",
              houseOrDynasty: "Casa Valerius",
              generation: 0,
              gender: "male",
              birthEra: "Ano 120 da 2ª Era",
              deathEra: "Ano 185 da 2ª Era",
              isAlive: false,
              successionStatus: "deceased",
              notes: "Herói de guerra que unificou as províncias do norte.",
              secrets: "Tinha um pacto secreto com uma linhagem de dragões antigos.",
              customBadge: "👑 Patriarca"
            },
            {
              id: "mem_demo_2",
              name: "Duquesa Lyanna Ashford",
              title: "Matriarca",
              houseOrDynasty: "Casa Valerius",
              generation: 0,
              gender: "female",
              birthEra: "Ano 125 da 2ª Era",
              deathEra: "Ano 192 da 2ª Era",
              isAlive: false,
              successionStatus: "deceased",
              notes: "Diplomata lendária da corte.",
              customBadge: "Matriarca"
            },
            {
              id: "mem_demo_3",
              name: "Rei Theron Valerius II",
              title: "Atual Soberano",
              houseOrDynasty: "Casa Valerius",
              generation: 1,
              gender: "male",
              birthEra: "Ano 158 da 2ª Era",
              isAlive: true,
              successionStatus: "ruling",
              notes: "Governa o reino com sabedoria, mas enfrenta conspirações na corte.",
              secrets: "Possui uma doença mágica oculta mantida em segredo.",
              customBadge: "👑 Rei Atual"
            },
            {
              id: "mem_demo_4",
              name: "Príncipe Vaelen Valerius",
              title: "Príncipe Herdeiro",
              houseOrDynasty: "Casa Valerius",
              generation: 2,
              gender: "male",
              birthEra: "Ano 188 da 2ª Era",
              isAlive: true,
              successionStatus: "heir_apparent",
              notes: "Comandante da guarda real e campeão dos torneios.",
              customBadge: "🛡️ 1º Herdeiro"
            },
            {
              id: "mem_demo_5",
              name: "Doran 'O Corvo'",
              title: "Filho Bastardo",
              houseOrDynasty: "Casa Valerius",
              generation: 2,
              gender: "male",
              birthEra: "Ano 190 da 2ª Era",
              isAlive: true,
              successionStatus: "claimant",
              notes: "Líder de mercenários que questiona a legitimidade da coroa.",
              secrets: "Tem apoio secreto da Guilda de Espiões para tomar o trono.",
              customBadge: "⚔️ Reivindicante"
            }
          ],
          relationships: [
            {
              id: "rel_demo_1",
              fromId: "mem_demo_1",
              toId: "mem_demo_2",
              type: "spouse",
              details: "Casamento de aliança real"
            },
            {
              id: "rel_demo_2",
              fromId: "mem_demo_1",
              toId: "mem_demo_3",
              type: "parent",
              details: "Primogênito legítimo"
            },
            {
              id: "rel_demo_3",
              fromId: "mem_demo_3",
              toId: "mem_demo_4",
              type: "parent",
              details: "Herdeiro do trono"
            },
            {
              id: "rel_demo_4",
              fromId: "mem_demo_3",
              toId: "mem_demo_5",
              type: "bastard",
              details: "Filho ilegítimo",
              isSecret: true
            }
          ]
        }),
        provider: 'demo-fallback'
      };
    }

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

