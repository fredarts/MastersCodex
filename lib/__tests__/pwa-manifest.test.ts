import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA Manifest & Configuration', () => {
  it('should return a valid PWA manifest object compliant with standards', () => {
    const config = manifest();

    expect(config.name).toBe('Masters Codex - The Campaign Forge Tool');
    expect(config.short_name).toBe('Masters Codex');
    expect(config.start_url).toBe('/');
    expect(config.display).toBe('standalone');
    expect(config.background_color).toBe('#0a0d14');
    expect(config.theme_color).toBe('#d97706');
    expect(config.icons).toBeDefined();
    expect(config.icons!.length).toBeGreaterThanOrEqual(2);

    const icon192 = config.icons!.find((i) => i.sizes === '192x192');
    const icon512 = config.icons!.find((i) => i.sizes === '512x512');

    expect(icon192).toBeDefined();
    expect(icon192?.src).toBe('/web-app-manifest-192x192.png');
    expect(icon512).toBeDefined();
    expect(icon512?.src).toBe('/web-app-manifest-512x512.png');
  });

  it('should include mobile categories and orientation settings', () => {
    const config = manifest();
    expect(config.orientation).toBe('any');
    expect(config.categories).toContain('games');
    expect(config.categories).toContain('entertainment');
  });
});
