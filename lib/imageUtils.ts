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
