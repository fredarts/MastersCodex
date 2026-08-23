import { describe, it, expect } from 'vitest';
import {
  documentToEquipmentItem,
  createDefaultCampaignDocument,
} from '@/lib/utils/campaignDocumentUtils';
import { normalizeChestItem } from '@/lib/utils/lootItemUtils';
import { CampaignDocumentItem, ReadableItemType } from '@/lib/types';

describe('Campaign Documents & Lore System', () => {
  it('deve gerar template padrão com conteúdo consistente para cada tipo de documento', () => {
    const docTypes: ReadableItemType[] = ['letter', 'note', 'diary', 'book', 'tome', 'scroll'];

    docTypes.forEach((type) => {
      const doc = createDefaultCampaignDocument('camp_test_123', type);

      expect(doc.id).toBeDefined();
      expect(doc.campaignId).toBe('camp_test_123');
      expect(doc.documentType).toBe(type);
      expect(doc.readableContent).toBeDefined();
      expect(doc.readableContent.isReadable).toBe(true);
      expect(doc.readableContent.readableType).toBe(type);
      expect(doc.readableContent.content.length).toBeGreaterThan(10);
      expect(doc.readableContent.pages?.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deve converter CampaignDocumentItem em CharacterEquipmentItem com propriedades legíveis completas', () => {
    const doc: CampaignDocumentItem = {
      id: 'doc_necromancer_diary',
      campaignId: 'camp_1',
      name: 'Diário do Necromante Sombrio',
      documentType: 'diary',
      author: 'Maelgoth o Profano',
      dateOrHeader: 'Ano 1492 CV - Noite sem Estrelas',
      language: 'Infernal',
      notes: 'Contém a localização da chave de ossos.',
      readableContent: {
        isReadable: true,
        readableType: 'diary',
        title: 'Diário do Necromante Sombrio',
        author: 'Maelgoth o Profano',
        dateOrHeader: 'Ano 1492 CV - Noite sem Estrelas',
        language: 'Infernal',
        pages: [
          'Página 1: O ritual exigiu mais essência vital do que antecipei.',
          'Página 2: A chave de ossos repousa sob o altar do mausoléu.',
        ],
        content: 'O ritual exigiu mais essência vital...\n\nA chave de ossos repousa sob o altar...',
      },
      createdAt: new Date().toISOString(),
    };

    const equipItem = documentToEquipmentItem(doc);

    expect(equipItem.id).toContain('doc_item_doc_necromancer_diary');
    expect(equipItem.name).toBe('Diário do Necromante Sombrio');
    expect(equipItem.itemType).toBe('readable');
    expect(equipItem.readableContent).toBeDefined();
    expect(equipItem.readableContent?.isReadable).toBe(true);
    expect(equipItem.readableContent?.readableType).toBe('diary');
    expect(equipItem.readableContent?.author).toBe('Maelgoth o Profano');
    expect(equipItem.readableContent?.pages).toHaveLength(2);
  });

  it('deve ser perfeitamente normalizado por normalizeChestItem para colocação em baús e inventários', () => {
    const doc = createDefaultCampaignDocument('camp_test_1', 'letter');
    const equipItem = documentToEquipmentItem(doc);

    const normalized = normalizeChestItem(equipItem);

    expect(normalized.name).toBe(doc.name);
    expect(normalized.itemType).toBe('readable');
    expect(normalized.readableContent?.isReadable).toBe(true);
    expect(normalized.readableContent?.readableType).toBe('letter');
    expect(normalized.readableContent?.author).toBe(doc.author);
  });

  it('deve atribuir pesos e raridades adequados baseados no tipo do suporte de manuscrito', () => {
    const letter = documentToEquipmentItem(createDefaultCampaignDocument('c1', 'letter'));
    const tome = documentToEquipmentItem(createDefaultCampaignDocument('c1', 'tome'));
    const scroll = documentToEquipmentItem(createDefaultCampaignDocument('c1', 'scroll'));

    expect(letter.weight).toBe('0.1 kg');
    expect(tome.weight).toBe('1 kg');
    expect(tome.rarity).toBe('Raro');
    expect(scroll.rarity).toBe('Incomum');
  });
});
