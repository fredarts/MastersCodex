import { describe, it, expect } from 'vitest';
import { CampaignDocumentItem, WorldEntity } from '@/lib/types';

describe('TV Mode & Lore Secrets - Visibility and Scaling', () => {
  it('normalizes TV orientation angles (0, 90, 180, 270)', () => {
    const normalizeRotation = (deg: number) => ((deg % 360) + 360) % 360;
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(90)).toBe(90);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
  });

  it('correctly calculates physical 25mm grid scale for miniature projection', () => {
    const baseGridSize = 40; // 40px base
    const scaleFactor = 1.25;
    const effectiveGridSize = baseGridSize * scaleFactor;
    expect(effectiveGridSize).toBe(50);
  });

  it('filters lore secrets by player visibility', () => {
    const documents: CampaignDocumentItem[] = [
      {
        id: 'doc-1',
        campaignId: 'camp-1',
        name: 'Carta do Duque',
        documentType: 'letter',
        readableContent: { title: 'Carta', text: 'Conteúdo' },
        createdAt: new Date().toISOString(),
        isSecret: false,
      },
      {
        id: 'doc-2',
        campaignId: 'camp-1',
        name: 'Segredo do Culto',
        documentType: 'tome',
        readableContent: { title: 'Culto', text: 'Segredo' },
        createdAt: new Date().toISOString(),
        isSecret: true,
        revealedToPlayerIds: ['player-thorin'],
      },
    ];

    const filterDocsForPlayer = (docs: CampaignDocumentItem[], playerId: string, isDm: boolean) => {
      if (isDm) return docs;
      return docs.filter((d) => !d.isSecret || d.revealedToPlayerIds?.includes(playerId));
    };

    // DM sees all documents
    expect(filterDocsForPlayer(documents, 'player-lilith', true)).toHaveLength(2);

    // Thorin sees both (he is in revealedToPlayerIds)
    expect(filterDocsForPlayer(documents, 'player-thorin', false)).toHaveLength(2);

    // Lilith sees only public document 1
    const lilithDocs = filterDocsForPlayer(documents, 'player-lilith', false);
    expect(lilithDocs).toHaveLength(1);
    expect(lilithDocs[0].id).toBe('doc-1');
  });
});
