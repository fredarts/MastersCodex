/**
 * Utility to convert web page URLs (e.g., Unsplash photo page URLs, Imgur album URLs)
 * into direct image URLs that can be rendered in <img> tags.
 */
export const normalizeImageUrl = (rawUrl: string): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();

  // 1. Unsplash HTML page URLs (pt-br/fotografias, es/fotos, photos, etc.)
  // e.g. https://unsplash.com/pt-br/fotografias/dados-verdes-e-pretos-na-mesa-de-madeira-marrom-XIIsv6AshJY
  // e.g. https://unsplash.com/photos/XIIsv6AshJY
  if (trimmed.includes('unsplash.com/') && !trimmed.includes('images.unsplash.com/')) {
    const match = trimmed.match(/unsplash\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:fotografias|photos|fotos)\/(?:[^\/\?#]+-)?([a-zA-Z0-9_-]+)/i);
    const photoId = match ? match[1] : null;
    if (photoId) {
      return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
    }
  }

  // 2. Imgur HTML page URLs
  // e.g. https://imgur.com/a/ABCDEF or https://imgur.com/ABCDEF
  if (trimmed.includes('imgur.com/') && !trimmed.includes('i.imgur.com/')) {
    const match = trimmed.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)/i);
    if (match && match[1]) {
      return `https://i.imgur.com/${match[1]}.png`;
    }
  }

  return trimmed;
};

/**
 * Detects if a URL is a YouTube link.
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtu\.be/i.test(url.trim());
};

/**
 * Extracts YouTube video ID from standard watch links, share links, or embeds.
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.trim().match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Constructs a YouTube embed URL configured for loop, mute, and autoplay without controls.
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
};

/**
 * Returns a static high-quality thumbnail image URL for a YouTube video.
 */
export const getYouTubeThumbnailUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};
