import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Masters Codex - The Campaign Forge Tool',
    short_name: 'Masters Codex',
    description: 'A mais avançada forja de campanhas, estúdio de worldbuilding e mesa virtual 3D para D&D 5e.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d14',
    theme_color: '#d97706',
    orientation: 'any',
    categories: ['games', 'entertainment', 'utilities'],
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
