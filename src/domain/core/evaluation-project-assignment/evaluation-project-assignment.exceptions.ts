/**
 * 평가 프로젝트 할당 도메인 예외 클래스들
 */

/**
 * 평가 프로젝트 할당 도메인 기본 예외
 */
export class EvaluationProjectAssignmentDomainException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'EVALUATION_PROJECT_ASSIGNMENT_DOMAIN_ERROR',
  ) {
    super(message);
    this.name = 'EvaluationProjectAssignmentDomainException';
  }
}

/**
 * 평가 프로젝트 할당을 찾을 수 없는 예외
 */
export class EvaluationProjectAssignmentNotFoundException extends EvaluationProjectAssignmentDomainException {
  constructor(assignmentId: string) {
    super(
      `평가 프로젝트 할당을 찾을 수 없습니다. ID: ${assignmentId}`,
      'EVALUATION_PROJECT_ASSIGNMENT_NOT_FOUND',
    );
    this.name = 'EvaluationProjectAssignmentNotFoundException';
  }
}

/**
 * 중복된 평가 프로젝트 할당 예외
 */
export class DuplicateEvaluationProjectAssignmentException extends EvaluationProjectAssignmentDomainException {
  constructor(periodId: string, employeeId: string, projectId: string) {
    super(
      `이미 해당 평가기간에 직원에게 프로젝트가 할당되어 있습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}`,
      'DUPLICATE_EVALUATION_PROJECT_ASSIGNMENT',
    );
    this.name = 'DuplicateEvaluationProjectAssignmentException';
  }
}

/**
 * 평가 프로젝트 할당 권한 거부 예외
 */
export class EvaluationProjectAssignmentPermissionDeniedException extends EvaluationProjectAssignmentDomainException {
  constructor(action: string, userId: string) {
    super(
      `평가 프로젝트 할당에 대한 ${action} 권한이 없습니다. 사용자: ${userId}`,
      'EVALUATION_PROJECT_ASSIGNMENT_PERMISSION_DENIED',
    );
    this.name = 'EvaluationProjectAssignmentPermissionDeniedException';
  }
}

/**
 * 평가 프로젝트 할당 상태 변경 불가 예외
 */
export class EvaluationProjectAssignmentStatusChangeException extends EvaluationProjectAssignmentDomainException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `현재 상태(${currentStatus})에서 ${targetStatus} 상태로 변경할 수 없습니다.`,
      'EVALUATION_PROJECT_ASSIGNMENT_STATUS_CHANGE_ERROR',
    );
    this.name = 'EvaluationProjectAssignmentStatusChangeException';
  }
}

/**
 * 평가 기간 만료 예외
 */
export class EvaluationPeriodExpiredException extends EvaluationProjectAssignmentDomainException {
  constructor(periodId: string) {
    super(
      `평가 기간이 만료되어 프로젝트 할당을 변경할 수 없습니다. 평가기간: ${periodId}`,
      'EVALUATION_PERIOD_EXPIRED',
    );
    this.name = 'EvaluationPeriodExpiredException';
  }
}

/**
 * 평가 프로젝트 할당 비즈니스 규칙 위반 예외
 */
export class EvaluationProjectAssignmentBusinessRuleViolationException extends EvaluationProjectAssignmentDomainException {
  constructor(message: string) {
    super(message, 'EVALUATION_PROJECT_ASSIGNMENT_BUSINESS_RULE_VIOLATION');
    this.name = 'EvaluationProjectAssignmentBusinessRuleViolationException';
  }
}

/**
 * 평가 프로젝트 할당 중복 예외 (별칭)
 */
export class EvaluationProjectAssignmentDuplicateException extends DuplicateEvaluationProjectAssignmentException {
  constructor(periodId: string, employeeId: string, projectId: string) {
    super(periodId, employeeId, projectId);
    this.name = 'EvaluationProjectAssignmentDuplicateException';
  }
}

/**
 * 평가 프로젝트 할당 필수 데이터 누락 예외
 */
export class EvaluationProjectAssignmentRequiredDataMissingException extends EvaluationProjectAssignmentDomainException {
  constructor(message: string) {
    super(message, 'EVALUATION_PROJECT_ASSIGNMENT_REQUIRED_DATA_MISSING');
    this.name = 'EvaluationProjectAssignmentRequiredDataMissingException';
  }
}

/**
 * 평가 프로젝트 할당 데이터 형식 오류 예외
 */
export class InvalidEvaluationProjectAssignmentDataFormatException extends EvaluationProjectAssignmentDomainException {
  constructor(fieldName: string, expectedFormat: string, actualValue: any) {
    super(
      `${fieldName} 필드의 형식이 올바르지 않습니다. 예상 형식: ${expectedFormat}, 실제 값: ${actualValue}`,
      'INVALID_EVALUATION_PROJECT_ASSIGNMENT_DATA_FORMAT',
    );
    this.name = 'InvalidEvaluationProjectAssignmentDataFormatException';
  }
}
