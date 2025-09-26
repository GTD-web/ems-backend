/**
 * WBS 자기평가 맵핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class WbsSelfEvaluationMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'WbsSelfEvaluationMappingDomainException';
  }
}

// WBS 자기평가 맵핑 중복 생성 예외
export class DuplicateWbsSelfEvaluationMappingException extends WbsSelfEvaluationMappingDomainException {
  constructor(
    projectId: string,
    employeeId: string,
    wbsItemId: string,
    periodId: string,
  ) {
    super(
      `이미 존재하는 WBS 자기평가 맵핑입니다: 프로젝트 ${projectId}, 직원 ${employeeId}, WBS ${wbsItemId}, 평가기간 ${periodId}`,
      'DUPLICATE_WBS_SELF_EVALUATION_MAPPING',
      409,
      { projectId, employeeId, wbsItemId, periodId },
    );
    this.name = 'DuplicateWbsSelfEvaluationMappingException';
  }
}

// WBS 자기평가 맵핑 조회 실패 예외
export class WbsSelfEvaluationMappingNotFoundException extends WbsSelfEvaluationMappingDomainException {
  constructor(identifier: string) {
    super(
      `WBS 자기평가 맵핑을 찾을 수 없습니다: ${identifier}`,
      'WBS_SELF_EVALUATION_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'WbsSelfEvaluationMappingNotFoundException';
  }
}

// WBS 자기평가 맵핑 권한 없음 예외
export class WbsSelfEvaluationMappingPermissionDeniedException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string, employeeId: string, requesterId: string) {
    super(
      `WBS 자기평가 맵핑 권한이 없습니다. 본인의 평가만 관리할 수 있습니다: 맵핑 ${mappingId}, 평가대상 ${employeeId}, 요청자 ${requesterId}`,
      'WBS_SELF_EVALUATION_MAPPING_PERMISSION_DENIED',
      403,
      { mappingId, employeeId, requesterId },
    );
    this.name = 'WbsSelfEvaluationMappingPermissionDeniedException';
  }
}

// WBS 자기평가 맵핑 기간 만료 예외
export class WbsSelfEvaluationMappingPeriodExpiredException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string, periodId: string, endDate: Date) {
    super(
      `WBS 자기평가 맵핑 기간이 만료되었습니다: 맵핑 ${mappingId}, 평가기간 ${periodId} (종료일: ${endDate})`,
      'WBS_SELF_EVALUATION_MAPPING_PERIOD_EXPIRED',
      422,
      { mappingId, periodId, endDate },
    );
    this.name = 'WbsSelfEvaluationMappingPeriodExpiredException';
  }
}

// WBS 자기평가 맵핑 이미 비활성화됨 예외
export class WbsSelfEvaluationMappingAlreadyInactiveException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string) {
    super(
      `WBS 자기평가 맵핑이 이미 비활성화되었습니다: ${mappingId}`,
      'WBS_SELF_EVALUATION_MAPPING_ALREADY_INACTIVE',
      422,
      { mappingId },
    );
    this.name = 'WbsSelfEvaluationMappingAlreadyInactiveException';
  }
}

// WBS 자기평가 맵핑 이미 활성화됨 예외
export class WbsSelfEvaluationMappingAlreadyActiveException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string) {
    super(
      `WBS 자기평가 맵핑이 이미 활성화되었습니다: ${mappingId}`,
      'WBS_SELF_EVALUATION_MAPPING_ALREADY_ACTIVE',
      422,
      { mappingId },
    );
    this.name = 'WbsSelfEvaluationMappingAlreadyActiveException';
  }
}

// WBS 자기평가 맵핑 완료 기한 초과 예외
export class WbsSelfEvaluationMappingOverdueException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string, dueDate: Date) {
    super(
      `WBS 자기평가 맵핑의 완료 기한이 초과되었습니다: ${mappingId} (완료 예정일: ${dueDate})`,
      'WBS_SELF_EVALUATION_MAPPING_OVERDUE',
      422,
      { mappingId, dueDate },
    );
    this.name = 'WbsSelfEvaluationMappingOverdueException';
  }
}

// WBS 자기평가 맵핑 잘못된 날짜 범위 예외
export class InvalidWbsSelfEvaluationMappingDateRangeException extends WbsSelfEvaluationMappingDomainException {
  constructor(assignedDate: Date, dueDate: Date) {
    super(
      `WBS 자기평가 맵핑의 날짜 범위가 잘못되었습니다: 배정일 ${assignedDate}이 완료 예정일 ${dueDate}보다 늦습니다`,
      'INVALID_WBS_SELF_EVALUATION_MAPPING_DATE_RANGE',
      400,
      { assignedDate, dueDate },
    );
    this.name = 'InvalidWbsSelfEvaluationMappingDateRangeException';
  }
}

// WBS 자기평가 맵핑 연관된 평가 존재 예외
export class WbsSelfEvaluationMappingHasRelatedEvaluationException extends WbsSelfEvaluationMappingDomainException {
  constructor(mappingId: string, selfEvaluationId: string) {
    super(
      `WBS 자기평가 맵핑에 연관된 자기평가가 존재합니다. 먼저 자기평가를 처리해주세요: 맵핑 ${mappingId}, 자기평가 ${selfEvaluationId}`,
      'WBS_SELF_EVALUATION_MAPPING_HAS_RELATED_EVALUATION',
      422,
      { mappingId, selfEvaluationId },
    );
    this.name = 'WbsSelfEvaluationMappingHasRelatedEvaluationException';
  }
}

// WBS 자기평가 맵핑 프로젝트 불일치 예외
export class WbsSelfEvaluationMappingProjectMismatchException extends WbsSelfEvaluationMappingDomainException {
  constructor(
    mappingId: string,
    mappingProjectId: string,
    wbsProjectId: string,
  ) {
    super(
      `WBS 자기평가 맵핑의 프로젝트와 WBS 항목의 프로젝트가 일치하지 않습니다: 맵핑 ${mappingId}, 맵핑 프로젝트 ${mappingProjectId}, WBS 프로젝트 ${wbsProjectId}`,
      'WBS_SELF_EVALUATION_MAPPING_PROJECT_MISMATCH',
      400,
      { mappingId, mappingProjectId, wbsProjectId },
    );
    this.name = 'WbsSelfEvaluationMappingProjectMismatchException';
  }
}
