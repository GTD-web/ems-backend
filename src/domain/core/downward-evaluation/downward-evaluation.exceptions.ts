/**
 * 하향 평가 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class DownwardEvaluationDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'DownwardEvaluationDomainException';
  }
}

// 하향 평가 점수 범위 초과 예외
export class InvalidDownwardEvaluationScoreException extends DownwardEvaluationDomainException {
  constructor(
    score: number,
    minScore: number,
    maxScore: number,
    evaluationId?: string,
  ) {
    super(
      `하향 평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`,
      'INVALID_DOWNWARD_EVALUATION_SCORE',
      400,
      { score, minScore, maxScore, evaluationId },
    );
    this.name = 'InvalidDownwardEvaluationScoreException';
  }
}

// 중복 하향 평가 예외
export class DuplicateDownwardEvaluationException extends DownwardEvaluationDomainException {
  constructor(
    employeeId: string,
    evaluatorId: string,
    periodId: string,
    evaluationType: string,
  ) {
    super(
      `이미 존재하는 하향 평가입니다: 직원 ${employeeId}, 평가자 ${evaluatorId}, 평가기간 ${periodId}, 유형 ${evaluationType}`,
      'DUPLICATE_DOWNWARD_EVALUATION',
      409,
      { employeeId, evaluatorId, periodId, evaluationType },
    );
    this.name = 'DuplicateDownwardEvaluationException';
  }
}

// 하향 평가 조회 실패 예외
export class DownwardEvaluationNotFoundException extends DownwardEvaluationDomainException {
  constructor(identifier: string) {
    super(
      `하향 평가를 찾을 수 없습니다: ${identifier}`,
      'DOWNWARD_EVALUATION_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'DownwardEvaluationNotFoundException';
  }
}

// 하향 평가 권한 없음 예외
export class DownwardEvaluationPermissionDeniedException extends DownwardEvaluationDomainException {
  constructor(evaluatorId: string, employeeId: string) {
    super(
      `하향 평가 권한이 없습니다: 평가자 ${evaluatorId}, 피평가자 ${employeeId}`,
      'DOWNWARD_EVALUATION_PERMISSION_DENIED',
      403,
      { evaluatorId, employeeId },
    );
    this.name = 'DownwardEvaluationPermissionDeniedException';
  }
}

// 하향평가 유효성 검사 예외
export class DownwardEvaluationValidationException extends DownwardEvaluationDomainException {
  constructor(message: string) {
    super(
      `하향평가 유효성 검사 실패: ${message}`,
      'DOWNWARD_EVALUATION_VALIDATION_ERROR',
      400,
      { message },
    );
    this.name = 'DownwardEvaluationValidationException';
  }
}

// 하향평가 중복 예외 (새로운 이름)
export class DownwardEvaluationDuplicateException extends DownwardEvaluationDomainException {
  constructor(evaluationType: string, evaluatorId: string) {
    super(
      `이미 존재하는 하향평가입니다: 유형 ${evaluationType}, 평가자 ${evaluatorId}`,
      'DOWNWARD_EVALUATION_DUPLICATE',
      409,
      { evaluationType, evaluatorId },
    );
    this.name = 'DownwardEvaluationDuplicateException';
  }
}
