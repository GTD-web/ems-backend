/**
 * 평가 기준 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationCriteriaDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationCriteriaDomainException';
  }
}

// 가중치 범위 초과 예외
export class InvalidWeightRangeException extends EvaluationCriteriaDomainException {
  constructor(
    weight: number,
    minWeight: number,
    maxWeight: number,
    criteriaId?: string,
  ) {
    super(
      `가중치가 유효 범위를 벗어났습니다: ${weight} (범위: ${minWeight}-${maxWeight})`,
      'INVALID_WEIGHT_RANGE',
      400,
      { weight, minWeight, maxWeight, criteriaId },
    );
    this.name = 'InvalidWeightRangeException';
  }
}

// 점수 범위 오류 예외
export class InvalidScoreRangeException extends EvaluationCriteriaDomainException {
  constructor(minScore: number, maxScore: number, criteriaId?: string) {
    super(
      `점수 범위가 올바르지 않습니다: ${minScore}-${maxScore} (최소값이 최대값보다 큽니다)`,
      'INVALID_SCORE_RANGE',
      400,
      { minScore, maxScore, criteriaId },
    );
    this.name = 'InvalidScoreRangeException';
  }
}

// 평가 기준 조회 실패 예외
export class EvaluationCriteriaNotFoundException extends EvaluationCriteriaDomainException {
  constructor(identifier: string) {
    super(
      `평가 기준을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_CRITERIA_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationCriteriaNotFoundException';
  }
}

// 중복 평가 기준 예외
export class DuplicateEvaluationCriteriaException extends EvaluationCriteriaDomainException {
  constructor(name: string, templateId: string) {
    super(
      `이미 존재하는 평가 기준입니다: ${name} (템플릿: ${templateId})`,
      'DUPLICATE_EVALUATION_CRITERIA',
      409,
      { name, templateId },
    );
    this.name = 'DuplicateEvaluationCriteriaException';
  }
}
