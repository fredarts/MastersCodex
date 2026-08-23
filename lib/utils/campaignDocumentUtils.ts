import { CampaignDocumentItem, CharacterEquipmentItem, ReadableContent, ReadableItemType } from '@/lib/types';
import { getOrCreateReadableContent } from './readableLoreUtils';

/**
 * Converte um Documento da Campanha em um CharacterEquipmentItem completo
 * pronto para ser inserido em Baús, Esconderijos ou Mochilas dos Personagens.
 */
export function documentToEquipmentItem(doc: CampaignDocumentItem): CharacterEquipmentItem {
  return {
    id: `doc_item_${doc.id}_${Date.now()}`,
    name: doc.name,
    quantity: 1,
    weight: doc.documentType === 'book' || doc.documentType === 'diary' || doc.documentType === 'tome' ? '1 kg' : '0.1 kg',
    rarity: doc.documentType === 'tome' ? 'Raro' : doc.documentType === 'scroll' ? 'Incomum' : 'Comum',
    itemType: 'readable',
    notes: doc.notes || (doc.author ? `Escrito por ${doc.author}` : undefined),
    readableContent: {
      ...doc.readableContent,
      isReadable: true,
      readableType: doc.documentType,
      title: doc.name,
      author: doc.author,
      dateOrHeader: doc.dateOrHeader,
      language: doc.language,
    },
  };
}

/**
 * Cria um objeto de Documento da Campanha inicial com padrões estilizados
 */
export function createDefaultCampaignDocument(
  campaignId: string,
  type: ReadableItemType = 'letter'
): CampaignDocumentItem {
  const typeLabels: Record<ReadableItemType, { name: string; author: string; header: string; content: string }> = {
    letter: {
      name: 'Carta Confidencial',
      author: 'Lorde Varis',
      header: 'Ao vigésimo dia da Lua Cheia',
      content: 'Minhas suspeitas se confirmaram. A relíquia não está mais nas catacumbas...',
    },
    note: {
      name: 'Bilhete Apressado',
      author: 'Anônimo',
      header: 'Encontrado no beco',
      content: 'Eles sabem que você está na cidade. Saia pelo portão norte antes do amanhecer.',
    },
    diary: {
      name: 'Páginas Arrancadas de Diário',
      author: 'Alquimista Roderick',
      header: 'Dia 42 do experimento',
      content: 'As propriedades do pó carmesim excederam minhas previsões. Mas as sombras começaram a sussurrar...',
    },
    book: {
      name: 'Crônicas do Reino Esquecido',
      author: 'Mestre Erudito Eldrin',
      header: 'Volume III - A Era dos Reis Caídos',
      content: 'Poucos se lembram da batalha nas colinas cinzentas, onde os três clãs juraram o pacto de ferro...',
    },
    tome: {
      name: 'Tomo dos Encantamentos Ancestrais',
      author: 'Arquimago Malakor',
      header: 'Círculo de Evocação Primordial',
      content: 'Para canalizar a essência astral sem corromper a mente, o conjurador deve primeiro harmonizar...',
    },
    scroll: {
      name: 'Pergaminho com Selo Arcano',
      author: 'Ordem dos Sentinelas',
      header: 'Decreto Sagrado',
      content: 'Por ordem do Alto Conselho, o acesso às ruínas subterrâneas permanece estritamente proibido.',
    },
    parchment: {
      name: 'Pergaminho Antigo',
      author: 'Escriba Real',
      header: 'Registro Oficial',
      content: 'Eis o registro selado dos acontecimentos passados.',
    },
  };

  const defaults = typeLabels[type] || typeLabels.letter;
  const now = new Date().toISOString();

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    campaignId,
    name: defaults.name,
    documentType: type,
    author: defaults.author,
    dateOrHeader: defaults.header,
    language: 'Comum',
    notes: 'Documento criado pelo Mestre.',
    readableContent: {
      isReadable: true,
      readableType: type,
      title: defaults.name,
      author: defaults.author,
      dateOrHeader: defaults.header,
      language: 'Comum',
      content: defaults.content,
      pages: [defaults.content],
    },
    createdAt: now,
    updatedAt: now,
  };
}
