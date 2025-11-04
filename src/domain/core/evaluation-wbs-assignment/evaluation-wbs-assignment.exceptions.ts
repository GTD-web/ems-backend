/**
 * 평가 WBS 할당 도메인 예외 클래스들
 */

/**
 * 평가 WBS 할당 도메인 기본 예외
 */
export class EvaluationWbsAssignmentDomainException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'EVALUATION_WBS_ASSIGNMENT_DOMAIN_ERROR',
  ) {
    super(message);
    this.name = 'EvaluationWbsAssignmentDomainException';
  }
}

/**
 * 평가 WBS 할당을 찾을 수 없는 예외
 */
export class EvaluationWbsAssignmentNotFoundException extends EvaluationWbsAssignmentDomainException {
  constructor(assignmentId: string) {
    super(
      `평가 WBS 할당을 찾을 수 없습니다. ID: ${assignmentId}`,
      'EVALUATION_WBS_ASSIGNMENT_NOT_FOUND',
    );
    this.name = 'EvaluationWbsAssignmentNotFoundException';
  }
}

/**
 * 중복된 평가 WBS 할당 예외
 */
export class DuplicateEvaluationWbsAssignmentException extends EvaluationWbsAssignmentDomainException {
  constructor(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ) {
    super(
      `이미 해당 평가기간에 직원에게 WBS 항목이 할당되어 있습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}, WBS: ${wbsItemId}`,
      'DUPLICATE_EVALUATION_WBS_ASSIGNMENT',
    );
    this.name = 'DuplicateEvaluationWbsAssignmentException';
  }
}

/**
 * 평가 WBS 할당 권한 거부 예외
 */
export class EvaluationWbsAssignmentPermissionDeniedException extends EvaluationWbsAssignmentDomainException {
  constructor(action: string, userId: string) {
    super(
      `평가 WBS 할당에 대한 ${action} 권한이 없습니다. 사용자: ${userId}`,
      'EVALUATION_WBS_ASSIGNMENT_PERMISSION_DENIED',
    );
    this.name = 'EvaluationWbsAssignmentPermissionDeniedException';
  }
}

/**
 * 평가 WBS 할당 상태 변경 불가 예외
 */
export class EvaluationWbsAssignmentStatusChangeException extends EvaluationWbsAssignmentDomainException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `현재 상태(${currentStatus})에서 ${targetStatus} 상태로 변경할 수 없습니다.`,
      'EVALUATION_WBS_ASSIGNMENT_STATUS_CHANGE_ERROR',
    );
    this.name = 'EvaluationWbsAssignmentStatusChangeException';
  }
}

/**
 * 잘못된 작업 시간 예외
 */
export class InvalidWorkHoursException extends EvaluationWbsAssignmentDomainException {
  constructor(hours: number) {
    super(
      `잘못된 작업 시간입니다. 작업 시간은 0 이상이어야 합니다. 입력값: ${hours}`,
      'INVALID_WORK_HOURS',
    );
    this.name = 'InvalidWorkHoursException';
  }
}

/**
 * WBS 항목 프로젝트 불일치 예외
 */
export class WbsItemProjectMismatchException extends EvaluationWbsAssignmentDomainException {
  constructor(
    wbsItemId: string,
    expectedProjectId: string,
    actualProjectId: string,
  ) {
    super(
      `WBS 항목의 프로젝트가 일치하지 않습니다. WBS: ${wbsItemId}, 예상 프로젝트: ${expectedProjectId}, 실제 프로젝트: ${actualProjectId}`,
      'WBS_ITEM_PROJECT_MISMATCH',
    );
    this.name = 'WbsItemProjectMismatchException';
  }
}

/**
 * 평가 기간 만료 예외
 */
export class EvaluationPeriodExpiredException extends EvaluationWbsAssignmentDomainException {
  constructor(periodId: string) {
    super(
      `평가 기간이 만료되어 WBS 할당을 변경할 수 없습니다. 평가기간: ${periodId}`,
      'EVALUATION_PERIOD_EXPIRED',
    );
    this.name = 'EvaluationPeriodExpiredException';
  }
}

/**
 * 평가 WBS 할당 비즈니스 규칙 위반 예외
 */
export class EvaluationWbsAssignmentBusinessRuleViolationException extends EvaluationWbsAssignmentDomainException {
  constructor(message: string) {
    super(message, 'EVALUATION_WBS_ASSIGNMENT_BUSINESS_RULE_VIOLATION');
    this.name = 'EvaluationWbsAssignmentBusinessRuleViolationException';
  }
}

/**
 * 평가 WBS 할당 중복 예외 (별칭)
 */
export class EvaluationWbsAssignmentDuplicateException extends DuplicateEvaluationWbsAssignmentException {
  constructor(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ) {
    super(periodId, employeeId, projectId, wbsItemId);
    this.name = 'EvaluationWbsAssignmentDuplicateException';
  }
}

/**
 * 평가 WBS 할당 필수 데이터 누락 예외
 */
export class EvaluationWbsAssignmentRequiredDataMissingException extends EvaluationWbsAssignmentDomainException {
  constructor(message: string) {
    super(message, 'EVALUATION_WBS_ASSIGNMENT_REQUIRED_DATA_MISSING');
    this.name = 'EvaluationWbsAssignmentRequiredDataMissingException';
  }
}

/**
 * 평가 WBS 할당 데이터 형식 오류 예외
 */
export class InvalidEvaluationWbsAssignmentDataFormatException extends EvaluationWbsAssignmentDomainException {
  constructor(fieldName: string, expectedFormat: string, actualValue: any) {
    super(
      `${fieldName} 필드의 형식이 올바르지 않습니다. 예상 형식: ${expectedFormat}, 실제 값: ${actualValue}`,
      'INVALID_EVALUATION_WBS_ASSIGNMENT_DATA_FORMAT',
    );
    this.name = 'InvalidEvaluationWbsAssignmentDataFormatException';
  }
}

/**
 * 프로젝트 할당 선행 조건 미충족 예외
 */
export class ProjectAssignmentPrerequisiteException extends EvaluationWbsAssignmentDomainException {
  constructor(
    periodId: string,
    employeeId: string,
    projectId: string,
  ) {
    super(
      `프로젝트 할당이 없으면 WBS 할당을 생성할 수 없습니다. 평가기간: ${periodId}, 직원: ${employeeId}, 프로젝트: ${projectId}`,
      'PROJECT_ASSIGNMENT_PREREQUISITE_NOT_MET',
    );
    this.name = 'ProjectAssignmentPrerequisiteException';
  }
}

/**
 * 완료된 평가기간에서 할당 생성 불가 예외
 */
export class CompletedEvaluationPeriodAssignmentException extends EvaluationWbsAssignmentDomainException {
  constructor(periodId: string, action: string) {
    super(
      `완료된 평가기간에는 ${action}할 수 없습니다. 평가기간: ${periodId}`,
      'COMPLETED_EVALUATION_PERIOD_ASSIGNMENT',
    );
    this.name = 'CompletedEvaluationPeriodAssignmentException';
  }
}