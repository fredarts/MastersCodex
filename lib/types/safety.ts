export type XCardAlertType = 'x_card' | 'pause' | 'o_card';

export interface CampaignSafetySettings {
  lines: string[]; // Proibido na mesa (não acontece nem é mencionado)
  veils: string[]; // Acontece fora de cena / "Fade to Black"
  askFirst: string[]; // Perguntar antes de incluir na narrativa
  allowAnonymousXCard: boolean;
  notifySound: boolean;
}

export interface XCardAlertPayload {
  id: string;
  campaignId: string;
  type: XCardAlertType;
  senderName?: string;
  isAnonymous: boolean;
  note?: string;
  timestamp: number;
}

export const DEFAULT_SAFETY_SETTINGS: CampaignSafetySettings = {
  lines: [
    'Tortura explícita',
    'Violência contra animais ou crianças',
    'Assédio sexual ou agressão sexual',
  ],
  veils: [
    'Romance / Cenas íntimas (Fade to Black)',
    'Descrições gráficas excessivas de ferimentos',
    'Fobias extremas (Aracnofobia/Claustrofobia)',
  ],
  askFirst: [
    'Conflito severo entre personagens (PvP)',
    'Mutilação ou perda permanente de membros',
    'Controle mental severo entre jogadores',
  ],
  allowAnonymousXCard: true,
  notifySound: true,
};

export const SAFETY_PRESETS: { name: string; description: string; settings: CampaignSafetySettings }[] = [
  {
    name: 'Fantasia Heroica (PG-13)',
    description: 'Ideal para campanhas épicas, amigáveis e com foco em aventura clássica.',
    settings: {
      lines: [
        'Tortura e sadismo',
        'Violência contra crianças ou animais',
        'Agressão sexual ou discriminação real',
      ],
      veils: [
        'Romance e intimidade (Fade to Black)',
        'Gore excessivo / decapitações gráficas',
      ],
      askFirst: [
        'PvP (ataque entre aliados)',
        'Traições entre o grupo de heróis',
      ],
      allowAnonymousXCard: true,
      notifySound: true,
    },
  },
  {
    name: 'Horror / Grimdark Seguro',
    description: 'Para campanhas de terror e mistério, mantendo o respeito aos limites dos jogadores.',
    settings: {
      lines: [
        'Violência sexual de qualquer tipo',
        'Crueldade gratuita com vulneráveis',
        'Fobias graves de membros específicos da mesa',
      ],
      veils: [
        'Autolesão e suicídio',
        'Horror corporal extremo (Body Horror explícito)',
        'Cenas íntimas',
      ],
      askFirst: [
        'Loucura e perda de agência do personagem',
        'Morte definitiva sem aviso prévio',
        'Isolamento prolongado de um jogador',
      ],
      allowAnonymousXCard: true,
      notifySound: true,
    },
  },
  {
    name: 'Mesa Aberta / Iniciantes',
    description: 'Ambiente acolhedor, leve e seguro para novos jogadores.',
    settings: {
      lines: [
        'Qualquer violência explícita',
        'Tortura ou crueldade',
        'Conflito interno no grupo (PvP proibido)',
      ],
      veils: [
        'Romance (Fade to Black)',
        'Descrições de sangue',
      ],
      askFirst: [
        'Temas de luto ou perda familiar',
        'Pesadelos ou ilusões mágicas',
      ],
      allowAnonymousXCard: true,
      notifySound: true,
    },
  },
];
