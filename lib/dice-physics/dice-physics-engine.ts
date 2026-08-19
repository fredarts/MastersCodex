import * as THREE from 'three';
import { DieType, DieFaceInfo, DieTopology, buildDieTopology } from './dice-topologies';
import { SeedRandom } from './dice-seed-random';

export interface DiceTrayBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface DicePhysicsResult {
  value: number;
  isCrit: boolean;
  isFail: boolean;
  topFaceNormal: THREE.Vector3;
  alignmentDot: number;
}

export interface ThrowOptions {
  seed?: number;
  impulse?: { x: number; y: number; z: number };
  angularImpulse?: { x: number; y: number; z: number };
  startPosition?: { x: number; y: number; z: number };
}

export class DicePhysicsBody {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public quaternion: THREE.Quaternion;
  public angularVelocity: THREE.Vector3;
  public mass: number;
  public radius: number;
  public vertices: THREE.Vector3[];
  public faces: DieFaceInfo[];
  public dieType: DieType;

  public isSettled = true;
  public isRolling = false;
  private settledCounter = 0;
  private elapsedTime = 0;
  private inertia = 1.0;

  // Propriedades físicas dinâmicas calibradas por tipo de dado
  private restitution: number;
  private friction: number;
  private linearDamping: number;
  private angularDamping: number;
  private gravity = -26.0; // Gravidade robusta para evitar flutuações e quiques eternos

  // Face vencedora em processo de repouso
  private targetQuaternion: THREE.Quaternion | null = null;
  private isAligningToScreen = false;

  constructor(topology: DieTopology) {
    this.dieType = topology.dieType;
    this.radius = topology.radius;
    this.vertices = topology.vertices;
    this.faces = topology.faces;
    this.mass = 1.0;
    this.inertia = (2 / 5) * this.mass * Math.pow(this.radius, 2);

    // Calibração de amortecimento por poliedro (D4 e D6 precisam de menos quiques)
    if (this.dieType === 'd4') {
      this.restitution = 0.18;
      this.friction = 0.75;
      this.linearDamping = 0.94;
      this.angularDamping = 0.88;
    } else if (this.dieType === 'd6' || this.dieType === 'd8') {
      this.restitution = 0.25;
      this.friction = 0.65;
      this.linearDamping = 0.96;
      this.angularDamping = 0.92;
    } else {
      // d10, d12, d20
      this.restitution = 0.30;
      this.friction = 0.60;
      this.linearDamping = 0.97;
      this.angularDamping = 0.93;
    }

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);

    // Alinhamento inicial da face frontal
    this.alignFaceToScreen(this.faces[0]);
  }

  /**
   * Alinha a face informada para olhar diretamente para a tela / câmera (+Z)
   */
  public alignFaceToScreen(face: DieFaceInfo): void {
    const screenForward = new THREE.Vector3(0, 0.05, 0.998).normalize();
    this.quaternion.setFromUnitVectors(face.normal, screenForward);
  }

  /**
   * Lança o dado aplicando impulso físico e torque
   */
  public launch(options: ThrowOptions = {}): void {
    const rng = new SeedRandom(options.seed);

    this.isSettled = false;
    this.isRolling = true;
    this.isAligningToScreen = false;
    this.targetQuaternion = null;
    this.settledCounter = 0;
    this.elapsedTime = 0;

    // Posição inicial
    this.position.set(
      options.startPosition?.x ?? rng.range(-0.35, 0.35),
      options.startPosition?.y ?? rng.range(0.6, 1.2),
      options.startPosition?.z ?? rng.range(-0.4, 0.2)
    );

    // Orientação inicial aleatória
    const euler = new THREE.Euler(
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2)
    );
    this.quaternion.setFromEuler(euler);

    // Impulso de lançamento
    this.velocity.set(
      options.impulse?.x ?? rng.range(-2.8, 2.8),
      options.impulse?.y ?? rng.range(3.0, 5.8),
      options.impulse?.z ?? rng.range(-2.5, 2.5)
    );

    // Torque angular para giros caóticos
    this.angularVelocity.set(
      options.angularImpulse?.x ?? rng.range(-24.0, 24.0),
      options.angularImpulse?.y ?? rng.range(-24.0, 24.0),
      options.angularImpulse?.z ?? rng.range(-24.0, 24.0)
    );
  }

  /**
   * Executa um passo da simulação física
   */
  public update(dt: number, bounds: DiceTrayBounds): void {
    if (this.isSettled) return;

    this.elapsedTime += dt;

    // Se já estiver na fase de alinhamento suave final com a tela
    if (this.isAligningToScreen && this.targetQuaternion) {
      this.quaternion.slerp(this.targetQuaternion, Math.min(1, dt * 14));
      this.position.lerp(new THREE.Vector3(0, bounds.minY + this.radius * 0.9, 0), Math.min(1, dt * 10));

      this.settledCounter++;
      if (this.settledCounter > 16 || this.quaternion.angleTo(this.targetQuaternion) < 0.015) {
        this.quaternion.copy(this.targetQuaternion);
        this.position.set(0, bounds.minY + this.radius * 0.9, 0);
        this.isSettled = true;
        this.isRolling = false;
        this.isAligningToScreen = false;
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
      }
      return;
    }

    // 1. Decaimento exponencial forçado após 1.1 segundos para prevenir qualquer quique infinito
    if (this.elapsedTime > 1.1) {
      const decay = Math.pow(0.82, dt * 60);
      this.velocity.multiplyScalar(decay);
      this.angularVelocity.multiplyScalar(decay);
    }

    // 2. Gravidade e amortecimento de arrasto
    this.velocity.y += this.gravity * dt;
    this.velocity.x *= Math.pow(this.linearDamping, dt * 60);
    this.velocity.y *= Math.pow(this.linearDamping, dt * 60);
    this.velocity.z *= Math.pow(this.linearDamping, dt * 60);

    this.angularVelocity.x *= Math.pow(this.angularDamping, dt * 60);
    this.angularVelocity.y *= Math.pow(this.angularDamping, dt * 60);
    this.angularVelocity.z *= Math.pow(this.angularDamping, dt * 60);

    // 3. Atualização de posição e rotação
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    const angLen = this.angularVelocity.length();
    if (angLen > 1e-5) {
      const axis = this.angularVelocity.clone().normalize();
      const angle = angLen * dt;
      const deltaQ = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.quaternion.premultiply(deltaQ).normalize();
    }

    // 4. Colisões com a bandeja
    this.handleTrayCollisions(bounds);

    // 5. Verificação de Repouso Físico
    const linSpeed = this.velocity.length();
    const angSpeed = this.angularVelocity.length();

    const isSpeedLow = linSpeed < 0.25 && angSpeed < 0.6 && this.position.y <= bounds.minY + this.radius * 1.5;
    const isTimeout = this.elapsedTime > 1.6; // Garantia de tempo máximo de rolagem

    if (isSpeedLow || isTimeout) {
      // Inicia a transição suave para alinhar a face vencedora diretamente para a tela
      const result = this.getTopFaceResult('camera');
      const winningFace = this.faces.find((f) => f.value === result.value) || this.faces[0];

      // Calcula o quaternion perfeito para que a face fique virada de frente para a tela (+Z)
      const screenForward = new THREE.Vector3(0, 0.05, 0.998).normalize();
      this.targetQuaternion = new THREE.Quaternion().setFromUnitVectors(winningFace.normal, screenForward);
      this.isAligningToScreen = true;
      this.settledCounter = 0;
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
    }
  }

  /**
   * Trata colisões entre os vértices da malha e as bordas da bandeja
   */
  private handleTrayCollisions(bounds: DiceTrayBounds): void {
    const worldVertex = new THREE.Vector3();
    const contactArm = new THREE.Vector3();

    // Chão (y = bounds.minY)
    let minContactY = Infinity;
    let deepestVertex: THREE.Vector3 | null = null;

    for (const v of this.vertices) {
      worldVertex.copy(v).applyQuaternion(this.quaternion).add(this.position);
      if (worldVertex.y < bounds.minY) {
        if (worldVertex.y < minContactY) {
          minContactY = worldVertex.y;
          deepestVertex = worldVertex.clone();
        }
      }
    }

    if (deepestVertex !== null) {
      const penetration = bounds.minY - minContactY;
      this.position.y += penetration;

      contactArm.copy(deepestVertex).sub(this.position);
      const contactVel = this.velocity.clone().add(this.angularVelocity.clone().cross(contactArm));

      if (contactVel.y < 0) {
        const normal = new THREE.Vector3(0, 1, 0);
        const impulseMag = -(1 + this.restitution) * contactVel.y;

        this.velocity.y += impulseMag;

        // Atrito lateral
        this.velocity.x *= (1 - this.friction * 0.5);
        this.velocity.z *= (1 - this.friction * 0.5);

        // Torque induzido
        const impulseVector = normal.clone().multiplyScalar(impulseMag * 0.3);
        const torque = contactArm.clone().cross(impulseVector);
        this.angularVelocity.add(torque.divideScalar(this.inertia));
      }
    }

    // Paredes X
    for (const v of this.vertices) {
      worldVertex.copy(v).applyQuaternion(this.quaternion).add(this.position);
      if (worldVertex.x < bounds.minX) {
        this.position.x += bounds.minX - worldVertex.x;
        this.velocity.x = Math.abs(this.velocity.x) * this.restitution;
        this.angularVelocity.z -= this.velocity.y * 0.2;
        break;
      }
      if (worldVertex.x > bounds.maxX) {
        this.position.x -= worldVertex.x - bounds.maxX;
        this.velocity.x = -Math.abs(this.velocity.x) * this.restitution;
        this.angularVelocity.z += this.velocity.y * 0.2;
        break;
      }
    }

    // Paredes Z
    for (const v of this.vertices) {
      worldVertex.copy(v).applyQuaternion(this.quaternion).add(this.position);
      if (worldVertex.z < bounds.minZ) {
        this.position.z += bounds.minZ - worldVertex.z;
        this.velocity.z = Math.abs(this.velocity.z) * this.restitution;
        this.angularVelocity.x += this.velocity.y * 0.2;
        break;
      }
      if (worldVertex.z > bounds.maxZ) {
        this.position.z -= worldVertex.z - bounds.maxZ;
        this.velocity.z = -Math.abs(this.velocity.z) * this.restitution;
        this.angularVelocity.x -= this.velocity.y * 0.2;
        break;
      }
    }
  }

  /**
   * Detecta qual face física está apontada para a tela / câmera
   */
  public getTopFaceResult(viewTarget: 'up' | 'camera' = 'camera'): DicePhysicsResult {
    const targetVector = viewTarget === 'camera'
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);

    let maxDot = -Infinity;
    let winningFace: DieFaceInfo = this.faces[0];
    const worldNormal = new THREE.Vector3();

    for (const face of this.faces) {
      worldNormal.copy(face.normal).applyQuaternion(this.quaternion);
      const dot = worldNormal.dot(targetVector);

      if (dot > maxDot) {
        maxDot = dot;
        winningFace = face;
      }
    }

    const value = winningFace.value;
    const isCrit = (this.dieType === 'd20' && value === 20);
    const isFail = (this.dieType === 'd20' && value === 1);

    return {
      value,
      isCrit,
      isFail,
      topFaceNormal: worldNormal,
      alignmentDot: maxDot,
    };
  }
}

/**
 * Cria e configura um simulador físico de dados
 */
export function createDicePhysicsSimulator(
  dieType: DieType,
  bounds: DiceTrayBounds = {
    minX: -1.2,
    maxX: 1.2,
    minY: -0.85,
    maxY: 3.0,
    minZ: -1.2,
    maxZ: 1.2,
  }
): {
  body: DicePhysicsBody;
  topology: DieTopology;
  bounds: DiceTrayBounds;
} {
  const topology = buildDieTopology(dieType);
  const body = new DicePhysicsBody(topology);
  return { body, topology, bounds };
}
