/**
 * 직원 평가 상태 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EmployeeEvaluationStatusDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EmployeeEvaluationStatusDomainException';
  }
}

// 평가 상태 전이 불가 예외
export class InvalidEvaluationStatusTransitionException extends EmployeeEvaluationStatusDomainException {
  constructor(
    currentStatus: string,
    targetStatus: string,
    employeeId?: string,
  ) {
    super(
      `평가 상태 전이가 불가능합니다: ${currentStatus} → ${targetStatus}`,
      'INVALID_EVALUATION_STATUS_TRANSITION',
      422,
      { currentStatus, targetStatus, employeeId },
    );
    this.name = 'InvalidEvaluationStatusTransitionException';
  }
}

// 평가 점수 범위 초과 예외
export class InvalidEvaluationScoreRangeException extends EmployeeEvaluationStatusDomainException {
  constructor(
    score: number,
    minScore: number,
    maxScore: number,
    employeeId?: string,
  ) {
    super(
      `평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`,
      'INVALID_EVALUATION_SCORE_RANGE',
      400,
      { score, minScore, maxScore, employeeId },
    );
    this.name = 'InvalidEvaluationScoreRangeException';
  }
}

// 평가 제외 직원 평가 시도 예외
export class ExcludedEmployeeEvaluationAttemptException extends EmployeeEvaluationStatusDomainException {
  constructor(employeeId: string, periodId: string) {
    super(
      `평가 제외된 직원입니다: ${employeeId} (평가기간: ${periodId})`,
      'EXCLUDED_EMPLOYEE_EVALUATION_ATTEMPT',
      422,
      { employeeId, periodId },
    );
    this.name = 'ExcludedEmployeeEvaluationAttemptException';
  }
}

// 평가 완료 후 수정 시도 예외
export class CompletedEvaluationModificationAttemptException extends EmployeeEvaluationStatusDomainException {
  constructor(employeeId: string, evaluationType: string) {
    super(
      `완료된 평가는 수정할 수 없습니다: ${evaluationType} (직원: ${employeeId})`,
      'COMPLETED_EVALUATION_MODIFICATION_ATTEMPT',
      422,
      { employeeId, evaluationType },
    );
    this.name = 'CompletedEvaluationModificationAttemptException';
  }
}

// 직원 평가 상태 조회 실패 예외
export class EmployeeEvaluationStatusNotFoundException extends EmployeeEvaluationStatusDomainException {
  constructor(employeeId: string, periodId: string) {
    super(
      `직원 평가 상태를 찾을 수 없습니다: 직원 ${employeeId}, 평가기간 ${periodId}`,
      'EMPLOYEE_EVALUATION_STATUS_NOT_FOUND',
      404,
      { employeeId, periodId },
    );
    this.name = 'EmployeeEvaluationStatusNotFoundException';
  }
}

// 중복 평가 상태 생성 예외
export class DuplicateEmployeeEvaluationStatusException extends EmployeeEvaluationStatusDomainException {
  constructor(employeeId: string, periodId: string) {
    super(
      `이미 존재하는 직원 평가 상태입니다: 직원 ${employeeId}, 평가기간 ${periodId}`,
      'DUPLICATE_EMPLOYEE_EVALUATION_STATUS',
      409,
      { employeeId, periodId },
    );
    this.name = 'DuplicateEmployeeEvaluationStatusException';
  }
}
