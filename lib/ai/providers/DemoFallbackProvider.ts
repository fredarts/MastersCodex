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

    if (prompt.includes('TIPO DO DOCUMENTO') || prompt.includes('manuscrito') || prompt.includes('generate-lore-document') || prompt.includes('readableType')) {
      let docType = 'letter';
      if (prompt.includes('tipo: diary') || prompt.includes('diário')) docType = 'diary';
      else if (prompt.includes('tipo: book') || prompt.includes('livro')) docType = 'book';
      else if (prompt.includes('tipo: tome') || prompt.includes('tomo') || prompt.includes('grimório')) docType = 'tome';
      else if (prompt.includes('tipo: note') || prompt.includes('bilhete')) docType = 'note';
      else if (prompt.includes('tipo: scroll') || prompt.includes('pergaminho')) docType = 'scroll';

      const userIdeaMatch = prompt.match(/IDEIA \/ INSTRUÇÃO DO MESTRE:\s*"?([^"\n]+)"?/i);
      const userIdea = userIdeaMatch ? userIdeaMatch[1].trim() : '';

      const loreLibraries: Record<string, any> = {
        diary: {
          name: userIdea ? `Diário: ${userIdea.slice(0, 30)}` : "Diário Secreto do Alquimista Roderick",
          documentType: "diary",
          author: "Alquimista Roderick de Oakhaven",
          dateOrHeader: "Ano 1492 CV - 14 de Alturiak",
          language: "Comum",
          notes: userIdea || "Relato perturbador sobre as escavações proibidas e o cofre sob o templo.",
          pages: [
            userIdea 
              ? `Página 1:\n${userIdea}\n\nAs sombras começaram a se mover nas margens da nossa visão. Ninguém que se aventurou além da terceira câmara retornou ileso.`
              : "Dia 14: As escavações sob o monastério revelaram algo que não deveria pertencer a este mundo. Uma pedra de ônix pulsante, gravada com inscrições pré-humanas.\n\nTodos os operários que tocaram no artefato relataram os mesmos pesadelos: uma cidade submersa sob águas escuras.",
            userIdea
              ? `Página 2:\nSe você encontrou este diário, o destino deste local está selado. A chave do segredo repousa sob as cinzas do altar.`
              : "Dia 22: Os sussurros começaram a ecoar pelas paredes do laboratório. Não consigo mais dormir sem ouvir passos no teto.\n\nEscondi a chave do cofre nas catacumbas sob a terceira estátua do santo sem cabeça. Se alguém encontrar estas páginas, não confie no prior da abadia!"
          ],
          content: userIdea 
            ? `${userIdea}\n\nAs sombras começaram a se mover nas margens da nossa visão...` 
            : "Dia 14: As escavações sob o monastério revelaram algo que não deveria pertencer a este mundo...\n\nDia 22: Os sussurros começaram a ecoar pelas paredes do laboratório..."
        },
        letter: {
          name: userIdea ? `Carta: ${userIdea.slice(0, 30)}` : "Carta Confidencial do Arquiduque",
          documentType: "letter",
          author: "Lorde Varis Morne",
          dateOrHeader: "Ao Cair da Noite, Forte do Penedo",
          language: "Comum",
          notes: userIdea || "Ordem secreta para preparar emboscada na estrada real.",
          pages: [
            userIdea 
              ? `Saudações,\n\n${userIdea}\n\nTome as devidas precauções antes do amanhecer. Queime esta carta após a leitura.`
              : "Meu caro irmão,\n\nNossos espiões na corte confirmaram: a caravana partirá ao amanhecer sem a escolta dos cavaleiros.\n\nPosicione seus homens no Desfiladeiro dos Corvos antes do nascer do sol. Não deixe testemunhas que possam levar a culpa até nossa linhagem. Queime esta carta após a leitura."
          ],
          content: userIdea 
            ? `Saudações,\n\n${userIdea}\n\nTome as devidas precauções antes do amanhecer.`
            : "Meu caro irmão,\n\nNossos espiões na corte confirmaram: a caravana partirá ao amanhecer sem a escolta dos cavaleiros.\n\nPosicione seus homens no Desfiladeiro dos Corvos antes do nascer do sol. Não deixe testemunhas que possam levar a culpa até nossa linhagem. Queime esta carta após a leitura."
        },
        note: {
          name: userIdea ? `Bilhete: ${userIdea.slice(0, 25)}` : "Bilhete Apressado da Guilda das Sombras",
          documentType: "note",
          author: "A Mão Oculta",
          dateOrHeader: "Taverna do Javali Caolho",
          language: "Gíria dos Ladrões",
          notes: userIdea || "Aviso de emergência sobre a patrulha e senha dos esgotos.",
          pages: [
            userIdea ? `${userIdea}\n\nEncontre-nos no local combinado antes da terceira badalada.` : "A guarda aumentou a ronda nos portões da cidade. O contato no cais mudou a senha para 'Lua de Sangue'. Encontre o grupo nos esgotos sob o velho moinho antes da meia-noite."
          ],
          content: userIdea ? `${userIdea}\n\nEncontre-nos no local combinado antes da terceira badalada.` : "A guarda aumentou a ronda nos portões da cidade. O contato no cais mudou a senha para 'Lua de Sangue'. Encontre o grupo nos esgotos sob o velho moinho antes da meia-noite."
        },
        book: {
          name: userIdea ? `Crônicas de ${userIdea.slice(0, 25)}` : "Crônicas da Queda de Valyria Antiga",
          documentType: "book",
          author: "Mestre Erudito Eldrin",
          dateOrHeader: "Capítulo VI - O Fim dos Reis",
          language: "Comum",
          notes: userIdea || "Registro histórico sobre a lenda contada.",
          pages: [
            userIdea ? `Registro Histórico:\n\n${userIdea}` : "Capítulo VI: O Crepúsculo dos Campeões\n\nNo ápice do inverno de 1142, os exércitos se chocaram no Vale dos Lamentos. A névoa mágica cobria os campos enquanto os magos invocavam chamas celestiais.",
            "Quando o silêncio finalmente caiu sobre o vale, a antiga dinastia havia tombado. A coroa de platina foi dividida em três fragmentos e escondida nos quatro cantos do mundo conhecido."
          ],
          content: userIdea ? `Registro Histórico:\n\n${userIdea}` : "Capítulo VI: O Crepúsculo dos Campeões\n\nNo ápice do inverno de 1142, os exércitos se chocaram no Vale dos Lamentos..."
        },
        tome: {
          name: userIdea ? `Tomo: ${userIdea.slice(0, 25)}` : "Tomo dos Encantamentos Ancestrais",
          documentType: "tome",
          author: "Arquimago Malakor",
          dateOrHeader: "Círculo de Evocação Primordial",
          language: "Dracônico Arcaico",
          notes: userIdea || "Grimório esotérico com fórmulas arcanas e invocações de poder.",
          pages: [
            userIdea ? `Fórmula Arcana:\n\n${userIdea}\n\nPara canalizar esta energia, trace o octograma com cinzas de prata e recite as palavras de poder.` : "Primeiro Rito: A Harmonização Elemental\n\nPara canalizar a essência cósmica sem romper os canais de mana da alma, o conjurador deve desenhar o octograma sagrado com pó de lápis-lazúli e prata fundida.",
            "Segundo Rito: O Selamento do Vazio\n\nQuando a fenda astral for aberta, recite o cântico 'Mor-Drakkar-Vael'. Nunca olhe diretamente nos olhos das entidades convocadas sem o amuleto de proteção."
          ],
          content: userIdea ? `Fórmula Arcana:\n\n${userIdea}` : "Primeiro Rito: A Harmonização Elemental...\n\nSegundo Rito: O Selamento do Vazio..."
        },
        scroll: {
          name: userIdea ? `Pergaminho: ${userIdea.slice(0, 25)}` : "Pergaminho com Profecia dos Quatro Guardiões",
          documentType: "scroll",
          author: "Oráculo de Selûne",
          dateOrHeader: "Visão do Décimo Ciclo",
          language: "Celestial",
          notes: userIdea || "Profecia ancestral sobre os quatro campeões e a espada solar.",
          pages: [
            userIdea ? `Eis o Édito:\n\n${userIdea}` : "Quando a sombra da montanha engolir o sol e as cinzas cobrirem os rios de prata, quatro viajantes despertarão a chama da espada que não projeta sombra, selando a besta nas profundezas eternas."
          ],
          content: userIdea ? `Eis o Édito:\n\n${userIdea}` : "Quando a sombra da montanha engolir o sol e as cinzas cobrirem os rios de prata..."
        }
      };

      const selectedFallback = loreLibraries[docType] || loreLibraries.letter;
      return {
        text: JSON.stringify(selectedFallback),
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

