/**
 * 하향평가 맵핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class DownwardEvaluationMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'DownwardEvaluationMappingDomainException';
  }
}

// 하향평가 맵핑 중복 생성 예외
export class DuplicateDownwardEvaluationMappingException extends DownwardEvaluationMappingDomainException {
  constructor(
    employeeId: string,
    evaluatorId: string,
    projectId: string,
    periodId: string,
  ) {
    super(
      `이미 존재하는 하향평가 맵핑입니다: 피평가자 ${employeeId}, 평가자 ${evaluatorId}, 프로젝트 ${projectId}, 기간 ${periodId}`,
      'DUPLICATE_DOWNWARD_EVALUATION_MAPPING',
      409,
      { employeeId, evaluatorId, projectId, periodId },
    );
    this.name = 'DuplicateDownwardEvaluationMappingException';
  }
}

// 하향평가 맵핑 조회 실패 예외
export class DownwardEvaluationMappingNotFoundException extends DownwardEvaluationMappingDomainException {
  constructor(identifier: string) {
    super(
      `하향평가 맵핑을 찾을 수 없습니다: ${identifier}`,
      'DOWNWARD_EVALUATION_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'DownwardEvaluationMappingNotFoundException';
  }
}

// 하향평가 맵핑 권한 거부 예외
export class DownwardEvaluationMappingPermissionDeniedException extends DownwardEvaluationMappingDomainException {
  constructor(userId: string, action: string) {
    super(
      `하향평가 맵핑에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`,
      'DOWNWARD_EVALUATION_MAPPING_PERMISSION_DENIED',
      403,
      { userId, action },
    );
    this.name = 'DownwardEvaluationMappingPermissionDeniedException';
  }
}

// 하향평가 맵핑 평가자 불일치 예외
export class DownwardEvaluationMappingEvaluatorMismatchException extends DownwardEvaluationMappingDomainException {
  constructor(
    mappingId: string,
    expectedEvaluatorId: string,
    actualEvaluatorId: string,
  ) {
    super(
      `하향평가 맵핑의 평가자가 일치하지 않습니다: 맵핑 ${mappingId}, 예상 평가자 ${expectedEvaluatorId}, 실제 평가자 ${actualEvaluatorId}`,
      'DOWNWARD_EVALUATION_MAPPING_EVALUATOR_MISMATCH',
      400,
      { mappingId, expectedEvaluatorId, actualEvaluatorId },
    );
    this.name = 'DownwardEvaluationMappingEvaluatorMismatchException';
  }
}

// 하향평가 맵핑 기간 만료 예외
export class DownwardEvaluationMappingPeriodExpiredException extends DownwardEvaluationMappingDomainException {
  constructor(mappingId: string, periodId: string) {
    super(
      `하향평가 맵핑의 평가 기간이 만료되었습니다: 맵핑 ${mappingId}, 기간 ${periodId}`,
      'DOWNWARD_EVALUATION_MAPPING_PERIOD_EXPIRED',
      400,
      { mappingId, periodId },
    );
    this.name = 'DownwardEvaluationMappingPeriodExpiredException';
  }
}
