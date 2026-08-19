/**
 * Gerador de números pseudoaleatórios determinístico (Mulberry32)
 * Garante que a mesma seed gere exatamente a mesma sequência de números aleatórios
 * para física de dados idêntica em todos os computadores da mesa virtual.
 */

export class SeedRandom {
  private state: number;

  constructor(seed?: number) {
    this.state = seed !== undefined ? Math.floor(seed) : Math.floor(Math.random() * 2147483647);
    if (this.state === 0) this.state = 1;
  }

  /**
   * Retorna um número pseudoaleatório no intervalo [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retorna um número float entre min e max
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Retorna um inteiro entre min e max (inclusivo)
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Retorna o estado atual da seed
   */
  getSeed(): number {
    return this.state;
  }
}
