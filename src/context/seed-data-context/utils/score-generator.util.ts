/**
 * 점수 생성 헬퍼
 */
export class ScoreGeneratorUtil {
  /**
   * 정규분포 점수 생성 (Box-Muller 변환)
   */
  static generateNormalScore(
    min: number,
    max: number,
    mean: number,
    stdDev: number,
  ): number {
    // Box-Muller 변환
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const score = mean + z * stdDev;

    return Math.max(min, Math.min(max, Math.round(score)));
  }

  /**
   * 균등분포 점수 생성
   */
  static generateUniformScore(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 설정에 따라 점수 생성
   */
  static generateScore(config: {
    min: number;
    max: number;
    distribution: 'normal' | 'uniform';
    mean?: number;
    stdDev?: number;
  }): number {
    if (config.distribution === 'normal') {
      return this.generateNormalScore(
        config.min,
        config.max,
        config.mean || 80,
        config.stdDev || 10,
      );
    } else {
      return this.generateUniformScore(config.min, config.max);
    }
  }
}
