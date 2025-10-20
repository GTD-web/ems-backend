/**
 * 확률 기반 상태 결정 헬퍼
 */
export class ProbabilityUtil {
  /**
   * 확률 분포에서 하나를 선택
   */
  static selectByProbability<T extends Record<string, number>>(
    distribution: T,
  ): keyof T {
    const random = Math.random();
    let cumulative = 0;

    for (const [key, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (random < cumulative) {
        return key;
      }
    }

    return Object.keys(distribution)[0];
  }

  /**
   * 비율 분포 유효성 검증 (합계 1.0 체크)
   */
  static validateDistribution(distribution: Record<string, number>): void {
    const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`분포 비율의 합이 1.0이 아닙니다: ${sum}`);
    }
  }

  /**
   * 범위 내 랜덤 정수 생성
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 확률에 따라 true/false 반환
   */
  static rollDice(probability: number): boolean {
    return Math.random() < probability;
  }
}
