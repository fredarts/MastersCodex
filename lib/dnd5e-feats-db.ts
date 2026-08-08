import { CharacterFeat, CharacterSheet, AttributeKey } from './types';
import { getAttributeModifier } from './dnd5e-calculator';

export const DND5E_FEATS_DB: Omit<CharacterFeat, 'id'>[] = [
  {
    name: 'Alert',
    namePt: 'Alerta',
    description: 'Sempre atento ao perigo. Você recebe +5 de bônus na Iniciativa, não pode ser surpreendido enquanto consciente e criaturas invisíveis não recebem vantagem em ataques contra você por estarem ocultas.',
    category: 'combat',
    benefits: {
      initiativeBonus: 5
    }
  },
  {
    name: 'Tough',
    namePt: 'Robusto',
    description: 'Seu máximo de Pontos de Vida aumenta em um valor igual a duas vezes o seu nível atual. Sempre que você subir de nível após escolher este talento, seu máximo de PV aumenta em 2 adicionais.',
    category: 'general',
    benefits: {
      hpPerLevelBonus: 2
    }
  },
  {
    name: 'Mobile',
    namePt: 'Móvel',
    description: 'Sua velocidade de deslocamento aumenta em +10ft (+3m). Quando usa a ação Disparar, terreno difícil não custa movimento extra. Ao realizar um ataque corpo a corpo contra uma criatura, você não provoca ataques de oportunidade dela pelo resto do turno.',
    category: 'combat',
    benefits: {
      speedBonus: 10
    }
  },
  {
    name: 'Sharpshooter',
    namePt: 'Atirador de Elite',
    description: 'Mestre em armas à distância. Atacar no alcance longo não impõe desvantagem. Seus ataques à distância ignoram meia cobertura e três quartos de cobertura. Antes de fazer um ataque com arma à distância, você pode escolher sofrer -5 na jogada de ataque para causar +10 no dano.',
    category: 'combat',
    benefits: {}
  },
  {
    name: 'Great Weapon Master',
    namePt: 'Mestre de Armas Grandes',
    description: 'Você aprendeu a usar o peso de sua arma a seu favor. No seu turno, quando acertar um acerto crítico ou reduzir uma criatura a 0 PV com arma corpo a corpo, pode fazer um ataque adicional como ação bônus. Com armas pesadas, pode sofrer -5 no ataque para ganhar +10 de dano.',
    category: 'combat',
    prerequisite: 'Proficiência com Armas Pesadas',
    benefits: {}
  },
  {
    name: 'War Caster',
    namePt: 'Conjurador de Combate',
    description: 'Você ganha vantagem em testes de resistência de Constituição para manter a Concentração em magias. Pode realizar os componentes somáticos de magias mesmo com armas/escudo nas mãos. Quando uma criatura provocar ataque de oportunidade, você pode usar sua Reação para conjurar uma magia direcionada a ela.',
    category: 'magic',
    prerequisite: 'Capacidade de conjurar ao menos uma magia',
    benefits: {}
  },
  {
    name: 'Lucky',
    namePt: 'Sortudo',
    description: 'Você tem uma sorte inexplicável que o salva no momento certo. Você possui 3 Pontos de Sorte por dia. Sempre que fizer uma jogada de ataque, teste de habilidade ou teste de resistência, pode gastar 1 ponto para rolar 1d20 adicional e escolher qual usar.',
    category: 'general',
    benefits: {}
  },
  {
    name: 'Sentinel',
    namePt: 'Sentinela',
    description: 'Mestre em vigiar e impedir a fuga de oponentes. Quando acertar uma criatura com um ataque de oportunidade, a velocidade dela se torna 0 pelo resto do turno. Criaturas provocam ataque de oportunidade de você mesmo se usarem a ação Desengajar.',
    category: 'combat',
    benefits: {}
  },
  {
    name: 'Resilient',
    namePt: 'Resiliente',
    description: 'Escolha um atributo. Você ganha +1 no valor desse atributo (até o máximo de 20) e ganha proficiência nos Testes de Resistência (Saving Throws) desse atributo.',
    category: 'utility',
    benefits: {
      attributeBonus: {}
    }
  },
  {
    name: 'Elemental Adept',
    namePt: 'Adepto Elemental',
    description: 'Suas magias superam a resistência elemental. Escolha um tipo de dano: Ácido, Frio, Fogo, Elétrico ou Trovão. Magias que você conjurar ignoram a resistência a esse tipo de dano. Ao rolar dano desse tipo, qualquer 1 rolled é tratado como 2.',
    category: 'magic',
    prerequisite: 'Capacidade de conjurar ao menos uma magia',
    benefits: {}
  },
  {
    name: 'Observant',
    namePt: 'Observador',
    description: 'Rápido em notar detalhes. Aumente Inteligência ou Sabedoria em +1. Se puder ver a boca de quem fala uma língua que você conhece, pode ler seus lábios. Você ganha +5 de bônus em sua Percepção Passiva e Investigação Passiva.',
    category: 'utility',
    benefits: {}
  },
  {
    name: 'Heavy Armor Master',
    namePt: 'Mestre em Armaduras Pesadas',
    description: 'Sua armadura absorve golpes letais. Aumente seu valor de Força em +1 (até o máximo de 20). Enquanto usar armadura pesada, qualquer dano de Concussão, Perfurante ou Cortante não-mágico que você receber é reduzido em 3.',
    category: 'combat',
    prerequisite: 'Proficiência com Armaduras Pesadas',
    benefits: {
      attributeBonus: { str: 1 }
    }
  },
  {
    name: 'Medium Armor Master',
    namePt: 'Mestre em Armaduras Médias',
    description: 'Você domina o movimento em armadura média. Vestir armadura média não impõe desvantagem em seus testes de Furtividade. Além disso, o bônus máximo de Destreza na CA fornecido por armaduras médias passa de +2 para +3.',
    category: 'combat',
    prerequisite: 'Proficiência com Armaduras Médias',
    benefits: {}
  },
  {
    name: 'Fey Touched',
    namePt: 'Tocado pela Fada',
    description: 'Sua exposição à Fevild te transformou. Aumente Inteligência, Sabedoria ou Carisma em +1. Você aprende a magia Passo Nebuloso (Misty Step) e 1 magia de 1º nível de Adivinhação/Encantamento. Você pode conjurar cada uma 1 vez por descanso longo sem gastar slots.',
    category: 'magic',
    benefits: {}
  },
  {
    name: 'Shadow Touched',
    namePt: 'Tocado pela Sombra',
    description: 'Sua exposição ao Parassombra te transformou. Aumente Inteligência, Sabedoria ou Carisma em +1. Você aprende a magia Invisibilidade e 1 magia de 1º nível de Ilusão/Necromancia. Pode conjurar cada uma 1 vez por descanso longo.',
    category: 'magic',
    benefits: {}
  },
  {
    name: 'Athlete',
    namePt: 'Atleta',
    description: 'Treinamento físico intensivo. Aumente Força ou Destreza em +1. Levantar-se da posição caído custa apenas 5ft de movimento. Escalada não custa movimento extra. Você pode fazer um salto em distância/altura com corrida após andar apenas 5ft.',
    category: 'utility',
    benefits: {}
  },
  {
    name: 'Crossbow Expert',
    namePt: 'Especialista em Besta',
    description: 'Você ignora a propriedade Recarga em bestas em que possui proficiência. Estar a 5ft de uma criatura hostil não impõe desvantagem em suas jogadas de ataque à distância. Ao atacar com arma de uma mão, pode usar Ação Bônus para atacar com besta de mão.',
    category: 'combat',
    benefits: {}
  },
  {
    name: 'Polearm Master',
    namePt: 'Mestre de Armas de Haste',
    description: 'Ao atacar com Glaive, Alabarda, Bordão ou Lança, pode usar Ação Bônus para fazer um ataque com o cabo da arma (1d4 de dano de concussão). Criaturas provocam ataque de oportunidade ao entrarem no seu alcance enquanto você empunhar a arma.',
    category: 'combat',
    benefits: {}
  },
  {
    name: 'Shield Master',
    namePt: 'Mestre dos Escudos',
    description: 'Você usa o escudo como arma defensiva e ofensiva. Se fizer a ação Atacar no seu turno, pode usar Ação Bônus para empurrar uma criatura a 5ft com o escudo. Se não estiver incapacitado, adiciona o bônus de CA do escudo a testes de resistência de Destreza contra magias.',
    category: 'combat',
    benefits: {}
  }
];

export function checkFeatPrerequisites(sheet: CharacterSheet, feat: Omit<CharacterFeat, 'id'>): { met: boolean; reason?: string } {
  if (!feat.prerequisite) return { met: true };

  const prereq = feat.prerequisite.toLowerCase();

  if (prereq.includes('capaz de conjurar') || prereq.includes('magia')) {
    const isSpellcaster = ['mago', 'bruxo', 'feiticeiro', 'clérigo', 'druida', 'bardo', 'paladino', 'patrulheiro'].some(c => 
      sheet.className.toLowerCase().includes(c)
    );
    if (!isSpellcaster) {
      return { met: false, reason: 'Requer capacidade de conjurar magias' };
    }
  }

  if (prereq.includes('armaduras pesadas')) {
    const hasHeavy = sheet.otherProficienciesAndLanguages?.toLowerCase().includes('pesadas') ||
      ['guerreiro', 'paladino'].some(c => sheet.className.toLowerCase().includes(c));
    if (!hasHeavy) {
      return { met: false, reason: 'Requer Proficiência com Armaduras Pesadas' };
    }
  }

  if (prereq.includes('armaduras médias')) {
    const hasMedium = sheet.otherProficienciesAndLanguages?.toLowerCase().includes('médias') ||
      ['guerreiro', 'paladino', 'clérigo', 'druida', 'patrulheiro', 'bárbaro'].some(c => sheet.className.toLowerCase().includes(c));
    if (!hasMedium) {
      return { met: false, reason: 'Requer Proficiência com Armaduras Médias' };
    }
  }

  return { met: true };
}
