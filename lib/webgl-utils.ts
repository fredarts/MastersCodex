import * as THREE from 'three';

export function patchWebGLContext(renderer: THREE.WebGLRenderer) {
  const gl = renderer.getContext() as any;
  if (!gl || typeof gl.texImage3D !== 'function') return;

  const originalPixelStorei = gl.pixelStorei;
  const originalTexImage3D = gl.texImage3D;
  const originalTexSubImage3D = gl.texSubImage3D;

  let flipYState = false;
  let premultiplyAlphaState = false;

  gl.pixelStorei = function(pname: number, param: any) {
    if (pname === gl.UNPACK_FLIP_Y_WEBGL) {
      flipYState = !!param;
    } else if (pname === gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL) {
      premultiplyAlphaState = !!param;
    }
    originalPixelStorei.apply(this, arguments as any);
  };

  gl.texImage3D = function() {
    const needsResetFlip = flipYState;
    const needsResetPremult = premultiplyAlphaState;

    if (needsResetFlip) originalPixelStorei.call(this, gl.UNPACK_FLIP_Y_WEBGL, false);
    if (needsResetPremult) originalPixelStorei.call(this, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    originalTexImage3D.apply(this, arguments as any);

    if (needsResetFlip) originalPixelStorei.call(this, gl.UNPACK_FLIP_Y_WEBGL, true);
    if (needsResetPremult) originalPixelStorei.call(this, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  };

  gl.texSubImage3D = function() {
    const needsResetFlip = flipYState;
    const needsResetPremult = premultiplyAlphaState;

    if (needsResetFlip) originalPixelStorei.call(this, gl.UNPACK_FLIP_Y_WEBGL, false);
    if (needsResetPremult) originalPixelStorei.call(this, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    originalTexSubImage3D.apply(this, arguments as any);

    if (needsResetFlip) originalPixelStorei.call(this, gl.UNPACK_FLIP_Y_WEBGL, true);
    if (needsResetPremult) originalPixelStorei.call(this, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  };
}
