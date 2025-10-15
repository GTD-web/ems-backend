/**
 * 평가기간-직원 맵핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationPeriodEmployeeMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationPeriodEmployeeMappingDomainException';
  }
}

// 평가기간-직원 맵핑 조회 실패 예외
export class EvaluationPeriodEmployeeMappingNotFoundException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(identifier: string) {
    super(
      `평가기간-직원 맵핑을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_PERIOD_EMPLOYEE_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationPeriodEmployeeMappingNotFoundException';
  }
}

// 평가기간-직원 맵핑 중복 예외
export class EvaluationPeriodEmployeeMappingDuplicateException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(evaluationPeriodId: string, employeeId: string) {
    super(
      `이미 존재하는 평가기간-직원 맵핑입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`,
      'EVALUATION_PERIOD_EMPLOYEE_MAPPING_DUPLICATE',
      409,
      { evaluationPeriodId, employeeId },
    );
    this.name = 'EvaluationPeriodEmployeeMappingDuplicateException';
  }
}

// 평가기간-직원 맵핑 유효성 검사 예외
export class EvaluationPeriodEmployeeMappingValidationException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(message: string) {
    super(
      `평가기간-직원 맵핑 유효성 검사 실패: ${message}`,
      'EVALUATION_PERIOD_EMPLOYEE_MAPPING_VALIDATION_ERROR',
      400,
      { message },
    );
    this.name = 'EvaluationPeriodEmployeeMappingValidationException';
  }
}

// 평가 대상 제외 실패 예외
export class EvaluationTargetExclusionException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(evaluationPeriodId: string, employeeId: string, reason: string) {
    super(
      `평가 대상 제외 처리 실패: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}, 사유: ${reason}`,
      'EVALUATION_TARGET_EXCLUSION_ERROR',
      400,
      { evaluationPeriodId, employeeId, reason },
    );
    this.name = 'EvaluationTargetExclusionException';
  }
}

// 이미 제외된 평가 대상 예외
export class AlreadyExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(evaluationPeriodId: string, employeeId: string) {
    super(
      `이미 평가 대상에서 제외된 직원입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`,
      'ALREADY_EXCLUDED_EVALUATION_TARGET',
      400,
      { evaluationPeriodId, employeeId },
    );
    this.name = 'AlreadyExcludedEvaluationTargetException';
  }
}

// 제외되지 않은 평가 대상 예외
export class NotExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
  constructor(evaluationPeriodId: string, employeeId: string) {
    super(
      `평가 대상에서 제외되지 않은 직원입니다: 평가기간 ${evaluationPeriodId}, 직원 ${employeeId}`,
      'NOT_EXCLUDED_EVALUATION_TARGET',
      400,
      { evaluationPeriodId, employeeId },
    );
    this.name = 'NotExcludedEvaluationTargetException';
  }
}
