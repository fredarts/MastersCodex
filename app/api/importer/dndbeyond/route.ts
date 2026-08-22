import { NextRequest, NextResponse } from 'next/server';
import { parseDdbCharacter } from '@/lib/importers/dndBeyondParser';

/**
 * Helper to extract numeric D&D Beyond Character ID from string or URL
 */
export function extractDdbCharacterId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If pure digits
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // If URL like https://www.dndbeyond.com/characters/12345678 or https://ddb.ac/characters/12345678
  const match = trimmed.match(/characters\/(\d+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlOrId = searchParams.get('url') || searchParams.get('characterId') || '';

    const characterId = extractDdbCharacterId(urlOrId);
    if (!characterId) {
      return NextResponse.json(
        {
          error: 'URL ou ID do personagem inválido. Insira um link válido do D&D Beyond (ex: https://www.dndbeyond.com/characters/12345678).',
        },
        { status: 400 }
      );
    }

    const ddbApiUrl = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;

    const response = await fetch(ddbApiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MastersCodex-CharacterImporter/1.0',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        return NextResponse.json(
          {
            error: 'Ficha não encontrada ou privada. Certifique-se de que a ficha de personagem está configurada como "Pública" no D&D Beyond.',
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        {
          error: `Erro ao comunicar com o D&D Beyond (Status ${response.status}). Tente novamente mais tarde.`,
        },
        { status: 502 }
      );
    }

    const rawJson = await response.json();
    const characterSheet = parseDdbCharacter(rawJson);

    return NextResponse.json({
      success: true,
      characterSheet,
      rawSummary: {
        id: characterSheet.id,
        name: characterSheet.characterName,
        className: characterSheet.className,
        level: characterSheet.level,
        race: characterSheet.race,
        avatarUrl: characterSheet.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('[D&D Beyond Importer Error]:', error);
    return NextResponse.json(
      {
        error: error.message || 'Falha interna ao processar os dados do D&D Beyond.',
      },
      { status: 500 }
    );
  }
}
