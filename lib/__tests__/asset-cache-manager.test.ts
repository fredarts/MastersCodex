import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetCacheManager, getDracoDecoderPath, disposeHierarchy } from '../3d-asset-manager';
import * as THREE from 'three';

describe('AssetCacheManager & 3D Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar o caminho correto do decodificador Draco WASM', () => {
    const path = getDracoDecoderPath();
    expect(path).toContain('draco');
    expect(path).toContain('decoders');
  });

  it('deve realizar o descarte correto da hierarquia de VRAM GPU Three.js', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    const spyGeomDispose = vi.spyOn(geometry, 'dispose');
    const spyMatDispose = vi.spyOn(material, 'dispose');

    disposeHierarchy(mesh);

    expect(spyGeomDispose).toHaveBeenCalled();
    expect(spyMatDispose).toHaveBeenCalled();
  });
});
