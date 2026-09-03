import { WorldEntity } from '@/lib/types';

/**
 * Utilitários centralizados para resolução de imagens de entidades (NPCs, Monstros, Itens, Locais).
 * Suporta três papéis visuais principais:
 * 1. Capa / Banner (images[0] ou aspect ratios widescreen/retrato)
 * 2. Pino de Combate (token 3D 1:1 de corpo inteiro com fundo branco)
 * 3. Porta-retrato / Foto de Rosto (1:1 close-up facial de alta definição para avatares, lojas, mural e árvore genealógica)
 */

/**
 * Obtém a melhor foto de perfil / rosto de uma entidade (Porta-retrato).
 * Prioridade:
 * 1. Imagem no índice marcado como portraitIndex
 * 2. URL salva explicitamente em attributes.portraitUrl
 * 3. Fallback: Capa principal (images[0])
 */
export function getEntityPortraitUrl(entity?: WorldEntity | null): string | undefined {
  if (!entity) return undefined;

  const attrs = entity.attributes || {};
  const images = entity.images || [];

  // 1. URL direta de portrait salva nos atributos
  if (attrs.portraitUrl && typeof attrs.portraitUrl === 'string' && attrs.portraitUrl.trim()) {
    return attrs.portraitUrl.trim();
  }

  // 2. Índice de portrait definido
  if (typeof attrs.portraitIndex === 'number' && images[attrs.portraitIndex]) {
    return images[attrs.portraitIndex];
  }

  // 3. Ficha de personagem do NPC vinculada
  const cs = entity.characterSheet || attrs.characterSheet;
  if (cs) {
    if (cs.portraitUrl && typeof cs.portraitUrl === 'string' && cs.portraitUrl.trim()) return cs.portraitUrl.trim();
    if (cs.faceImageUrl && typeof cs.faceImageUrl === 'string' && cs.faceImageUrl.trim()) return cs.faceImageUrl.trim();
    if (cs.avatarUrl && typeof cs.avatarUrl === 'string' && cs.avatarUrl.trim()) return cs.avatarUrl.trim();
  }

  // 4. Fallback para a primeira imagem (Capa)
  if (images.length > 0 && images[0]) {
    return images[0];
  }

  return undefined;
}

/**
 * Obtém a imagem de token / pino de combate 3D de uma entidade.
 * Prioridade:
 * 1. Imagem no índice marcado como combatPinIndex
 * 2. Fallback: Capa principal (images[0])
 */
export function getEntityCombatPinUrl(entity?: WorldEntity | null): string | undefined {
  if (!entity) return undefined;

  const attrs = entity.attributes || {};
  const images = entity.images || [];

  if (typeof attrs.combatPinIndex === 'number' && images[attrs.combatPinIndex]) {
    return images[attrs.combatPinIndex];
  }

  if (images.length > 0 && images[0]) {
    return images[0];
  }

  return undefined;
}

/**
 * Obtém a imagem de capa principal de uma entidade.
 */
export function getEntityCoverUrl(entity?: WorldEntity | null): string | undefined {
  if (!entity) return undefined;
  const images = entity.images || [];
  return images.length > 0 ? images[0] : undefined;
}

/**
 * Identifica os papéis atribuídos a uma determinada imagem na galeria de uma entidade.
 */
export function getEntityImageRole(entity?: WorldEntity | null, imageIndex: number = 0) {
  const attrs = entity?.attributes || {};
  const isCover = imageIndex === 0;
  const isCombatPin = attrs.combatPinIndex === imageIndex;
  const isPortrait = attrs.portraitIndex === imageIndex;

  return {
    isCover,
    isCombatPin,
    isPortrait,
  };
}
