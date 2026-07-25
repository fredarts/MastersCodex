import { describe, it, expect, vi } from 'vitest';
import { generateTextEmbedding, indexLoreDocument, fetchVectorLoreSimilarity, buildCampaignPromptContext } from '../ai/campaign-rag';

describe('AI Assistant & Vector Embeddings (pgvector RAG) Suite', () => {
  it('should generate a 768-dimensional embedding vector', async () => {
    const text = 'Reino de Eldoria e as cavernas místicas do dragão de obsdiana';
    const embedding = await generateTextEmbedding(text);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(768);
    expect(typeof embedding[0]).toBe('number');
  });

  it('should format vector RAG context gracefully in prompt builder', () => {
    const prompt = buildCampaignPromptContext(
      {
        actionType: 'copilot',
        userPrompt: 'Qual é o segredo do culto da lua negra?',
      },
      [
        {
          id: 'vec-1',
          content: 'O culto da lua negra reúne-se às sextas-feiras sob a abóbada de pedra.',
          similarity: 0.89,
        },
      ]
    );

    expect(prompt).toContain('CONTEXTO DE LORE RECUPERADO VIA VETORES (pgvector)');
    expect(prompt).toContain('Relevância: 89%');
    expect(prompt).toContain('O culto da lua negra reúne-se às sextas-feiras');
  });
});
