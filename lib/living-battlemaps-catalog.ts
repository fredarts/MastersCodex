/**
 * Masters Codex - Living Battle Maps Catalog & YouTube Media Utilities
 * Utilitários para parsing de vídeos do YouTube e catálogo de mapas animados vivos para o Combat Grid 3D.
 */

export interface LivingBattleMapPreset {
  id: string;
  name: string;
  category: 'nature' | 'dungeon' | 'tavern' | 'ocean' | 'desert' | 'elemental';
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  description: string;
  ambientSoundDescription: string;
  defaultScale?: number;
  defaultOffsetX?: number;
  defaultOffsetY?: number;
}

/**
 * Catálogo com Living Battle Maps pré-configurados em alta definição e loop fluido.
 */
export const LIVING_BATTLEMAPS_PRESETS: LivingBattleMapPreset[] = [
  {
    id: 'waterfall-ruins',
    name: 'Cachoeira & Ruínas da Ponte',
    category: 'nature',
    youtubeUrl: 'https://www.youtube.com/watch?v=kY0wU3aB3pQ',
    youtubeId: 'kY0wU3aB3pQ',
    thumbnailUrl: 'https://img.youtube.com/vi/kY0wU3aB3pQ/hqdefault.jpg',
    description: 'Ponte de pedra antiga cruzando rio cristalino com cachoeira viva e vegetação exuberante.',
    ambientSoundDescription: 'Correnteza d’água, cascata e brisa suave.',
    defaultScale: 1.0,
  },
  {
    id: 'enchanted-forest-clearing',
    name: 'Floresta Élfica Encantada',
    category: 'nature',
    youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    youtubeId: 'jfKfPfyJRdk',
    thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    description: 'Clareira mística com partículas mágicas, fogo-fátuo e árvores ancestrais.',
    ambientSoundDescription: 'Pássaros místicos, farfalhar de folhas e vento suave.',
    defaultScale: 1.0,
  },
  {
    id: 'lava-chasm-dungeon',
    name: 'Masmorra do Abismo de Lava',
    category: 'elemental',
    youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    youtubeId: '5qap5aO4i9A',
    thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
    description: 'Plataformas de pedra suspensas sobre rios borbulhantes de magma incandescente.',
    ambientSoundDescription: 'Borbulhar de magma, calor crepitante e ecos de masmorra.',
    defaultScale: 1.0,
  },
  {
    id: 'cozy-fantasy-tavern',
    name: 'Taverna Aconchegante do Javali',
    category: 'tavern',
    youtubeUrl: 'https://www.youtube.com/watch?v=c0_ej84Mpgw',
    youtubeId: 'c0_ej84Mpgw',
    thumbnailUrl: 'https://img.youtube.com/vi/c0_ej84Mpgw/hqdefault.jpg',
    description: 'Salão de taverna com lareira iluminando mesas de madeira e canecos de cerveja.',
    ambientSoundDescription: 'Lareira crepitante, murmúrios distantes e copos de cerveja.',
    defaultScale: 1.0,
  },
  {
    id: 'ocean-storm-galleon',
    name: 'Galeão em Alto Mar & Tempestade',
    category: 'ocean',
    youtubeUrl: 'https://www.youtube.com/watch?v=yqWX86uT5jM',
    youtubeId: 'yqWX86uT5jM',
    thumbnailUrl: 'https://img.youtube.com/vi/yqWX86uT5jM/hqdefault.jpg',
    description: 'Deck de navio navegando em mar agitado com ondas batendo no casco.',
    ambientSoundDescription: 'Ondas oceânicas, madeira rangendo e vento marítimo.',
    defaultScale: 1.0,
  },
  {
    id: 'underdark-crystal-cave',
    name: 'Caverna de Cristais do Subterrâneo',
    category: 'dungeon',
    youtubeUrl: 'https://www.youtube.com/watch?v=aV8eFwLh40w',
    youtubeId: 'aV8eFwLh40w',
    thumbnailUrl: 'https://img.youtube.com/vi/aV8eFwLh40w/hqdefault.jpg',
    description: 'Caverna profunda com cogumelos bioluminescentes e névoa etérea.',
    ambientSoundDescription: 'Gotas de água ecoando e zumbido mágico de cristais.',
    defaultScale: 1.0,
  }
];

/**
 * Extrai o ID do vídeo do YouTube a partir de qualquer formato de URL suportado.
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Se já for um ID de 11 caracteres alfanuméricos puros
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Padrões comuns:
  // 1. https://www.youtube.com/watch?v=VIDEO_ID
  // 2. https://youtu.be/VIDEO_ID
  // 3. https://www.youtube.com/embed/VIDEO_ID
  // 4. https://www.youtube.com/shorts/VIDEO_ID
  // 5. https://www.youtube.com/live/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Verifica se a URL é um link do YouTube.
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    extractYouTubeVideoId(url) !== null
  );
}

/**
 * Verifica se a URL aponta para um arquivo de vídeo direto (.mp4, .webm, .ogg).
 */
export function isVideoFileUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim().split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogv') || cleanUrl.endsWith('.ogg');
}

/**
 * Verifica se a URL é um vídeo (YouTube ou arquivo de vídeo direto).
 */
export function isAnyVideoMapUrl(url: string | null | undefined): boolean {
  return isYouTubeUrl(url) || isVideoFileUrl(url);
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  enablejsapi?: boolean;
  start?: number;
}

/**
 * Gera a URL embed otimizada do YouTube sem barras de controle e em loop contínuo.
 */
export function getYouTubeEmbedUrl(urlOrId: string, options: YouTubeEmbedOptions = {}): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;

  const {
    autoplay = true,
    mute = false,
    loop = true,
    controls = false,
    enablejsapi = true,
    start
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    controls: controls ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    showinfo: '0',
    iv_load_policy: '3',
    playsinline: '1',
    enablejsapi: enablejsapi ? '1' : '0',
  });

  if (loop) {
    params.set('loop', '1');
    params.set('playlist', videoId); // Necessário para loop infinito no YouTube Iframe API
  }

  if (start && start > 0) {
    params.set('start', Math.floor(start).toString());
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
