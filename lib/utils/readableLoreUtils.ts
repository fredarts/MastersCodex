import { ReadableContent, ReadableItemType } from '@/lib/types';

export const READABLE_KEYWORDS = [
  'diário',
  'diario',
  'livro',
  'carta',
  'bilhete',
  'tomo',
  'manuscrito',
  'pergaminho',
  'nota',
  'grimório',
  'grimorio',
  'caderno',
  'relatório',
  'relatorio',
  'epístola',
  'epistola',
];

/**
 * Verifica se um item é legível (livro, carta, diário, bilhete, etc.)
 */
export function isItemReadable(item: { name: string; readableContent?: ReadableContent }): boolean {
  if (item.readableContent?.isReadable) return true;
  const lower = item.name.toLowerCase();
  return READABLE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Determina o tipo de suporte de leitura com base no nome
 */
export function detectReadableType(name: string): ReadableItemType {
  const lower = name.toLowerCase();
  if (lower.includes('carta') || lower.includes('epístola') || lower.includes('epistola')) return 'letter';
  if (lower.includes('bilhete') || lower.includes('nota')) return 'note';
  if (lower.includes('diário') || lower.includes('diario') || lower.includes('caderno')) return 'diary';
  if (lower.includes('tomo') || lower.includes('grimório') || lower.includes('grimorio')) return 'tome';
  if (lower.includes('pergaminho')) return 'scroll';
  return 'book';
}

/**
 * Cria ou recupera o conteúdo de leitura completo de um item
 */
export function getOrCreateReadableContent(item: {
  name: string;
  notes?: string;
  readableContent?: ReadableContent;
}): ReadableContent {
  if (item.readableContent) {
    return item.readableContent;
  }

  const type = detectReadableType(item.name);
  const lower = item.name.toLowerCase();

  if (lower.includes('pequeno diário empoeirado') || lower.includes('diario empoeirado') || lower.includes('diário')) {
    return {
      isReadable: true,
      readableType: 'diary',
      title: item.name,
      author: 'Eldrin, o Escriba da Expedição',
      dateOrHeader: 'Ano de 1492 CV - Mês de Flamerule',
      language: 'Comum',
      pages: [
        `### Página 1 — A Chegada ao Calabouço\n\n*As tochas mal conseguem dissipar a umidade e a penumbra destes corredores de pedra antiga. Nossos passos ecoam com um presságio ruim.*\n\n*Encontramos os primeiros mecanismos perto da entrada principal. Algo me diz que o mestre deste lugar nunca planejou permitir que estranhos saíssem vivos.*`,
        `### Página 2 — O Segredo da Grade de Ferro\n\n*Descobrimos que a placa de pressão no piso central destranca a grade de ferro que leva à câmara do tesouro.*\n\n*Contudo, cuidado com as lajes falsas. Aldous quase perdeu o pé em um fosso de estacas oculto sob o pó cinzento.*`,
        `### Página 3 — Últimas Palavras\n\n*Eles estão vindo. Os arranhões nas paredes de pedra ficaram mais próximos. Deixo este diário escondido entre as frestas na esperança de que alguém o encontre e termine o que começamos.*`,
      ],
      content: `Página 1: As tochas mal conseguem dissipar a umidade...\nPágina 2: Descobrimos que a placa de pressão no piso central destranca a grade...\nPágina 3: Eles estão vindo. Os arranhões nas paredes ficaram mais próximos...`,
    };
  }

  if (type === 'letter' || type === 'note') {
    return {
      isReadable: true,
      readableType: type,
      title: item.name,
      author: 'Remetente Anônimo',
      dateOrHeader: 'Entregue nas sombras',
      language: 'Comum',
      isSealed: true,
      sealColor: '#b91c1c',
      pages: [
        item.notes ||
          `*Ao leitor deste bilhete:*\n\nNão confie nas sombras deste calabouço. Os baús guardam mais do que ouro — alguns deles respiram e aguardam o toque dos incautos.\n\n*Encontre o caminho antes que a meia-noite chegue.*`,
      ],
      content:
        item.notes ||
        `Ao leitor deste bilhete:\nNão confie nas sombras deste calabouço. Os baús guardam mais do que ouro...`,
    };
  }

  return {
    isReadable: true,
    readableType: type,
    title: item.name,
    author: 'Autor Desconhecido',
    language: 'Comum',
    pages: [
      item.notes ||
        `### ${item.name}\n\n*Páginas encadernadas com histórias de tempos esquecidos e conhecimentos arcanos gravados em tinta élfica.*`,
    ],
    content: item.notes || `Texto preservado em ${item.name}.`,
  };
}
