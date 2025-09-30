/**
 * 평가 라인 맵핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationLineMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationLineMappingDomainException';
  }
}

// 평가 라인 맵핑 중복 생성 예외
export class DuplicateEvaluationLineMappingException extends EvaluationLineMappingDomainException {
  constructor(employeeId: string, evaluatorId: string, projectId?: string) {
    const projectInfo = projectId ? `, 프로젝트 ${projectId}` : '';
    super(
      `이미 존재하는 평가 라인 맵핑입니다: 피평가자 ${employeeId}, 평가자 ${evaluatorId}${projectInfo}`,
      'DUPLICATE_EVALUATION_LINE_MAPPING',
      409,
      { employeeId, evaluatorId, projectId },
    );
    this.name = 'DuplicateEvaluationLineMappingException';
  }
}

// 평가 라인 맵핑 조회 실패 예외
export class EvaluationLineMappingNotFoundException extends EvaluationLineMappingDomainException {
  constructor(identifier: string) {
    super(
      `평가 라인 맵핑을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_LINE_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationLineMappingNotFoundException';
  }
}

// 평가 라인 맵핑 권한 거부 예외
export class EvaluationLineMappingPermissionDeniedException extends EvaluationLineMappingDomainException {
  constructor(userId: string, action: string) {
    super(
      `평가 라인 맵핑에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`,
      'EVALUATION_LINE_MAPPING_PERMISSION_DENIED',
      403,
      { userId, action },
    );
    this.name = 'EvaluationLineMappingPermissionDeniedException';
  }
}

// 평가 라인 맵핑 자기평가 예외
export class EvaluationLineMappingSelfEvaluationException extends EvaluationLineMappingDomainException {
  constructor(employeeId: string) {
    super(
      `평가 라인에서 자기 자신을 평가할 수 없습니다: 직원 ${employeeId}`,
      'EVALUATION_LINE_MAPPING_SELF_EVALUATION',
      400,
      { employeeId },
    );
    this.name = 'EvaluationLineMappingSelfEvaluationException';
  }
}

// 평가 라인 맵핑 프로젝트 불일치 예외
export class EvaluationLineMappingProjectMismatchException extends EvaluationLineMappingDomainException {
  constructor(
    mappingId: string,
    mappingProjectId: string,
    lineProjectId: string,
  ) {
    super(
      `평가 라인 맵핑의 프로젝트와 평가 라인의 프로젝트가 일치하지 않습니다: 맵핑 ${mappingId}, 맵핑 프로젝트 ${mappingProjectId}, 라인 프로젝트 ${lineProjectId}`,
      'EVALUATION_LINE_MAPPING_PROJECT_MISMATCH',
      400,
      { mappingId, mappingProjectId, lineProjectId },
    );
    this.name = 'EvaluationLineMappingProjectMismatchException';
  }
}

// 평가 라인 맵핑 비즈니스 규칙 위반 예외
export class EvaluationLineMappingBusinessRuleViolationException extends EvaluationLineMappingDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      'EVALUATION_LINE_MAPPING_BUSINESS_RULE_VIOLATION',
      422,
      context,
    );
    this.name = 'EvaluationLineMappingBusinessRuleViolationException';
  }
}

// 평가 라인 맵핑 중복 예외
export class EvaluationLineMappingDuplicateException extends EvaluationLineMappingDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'EVALUATION_LINE_MAPPING_DUPLICATE', 409, context);
    this.name = 'EvaluationLineMappingDuplicateException';
  }
}

// 평가 라인 맵핑 필수 데이터 누락 예외
export class EvaluationLineMappingRequiredDataMissingException extends EvaluationLineMappingDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      'EVALUATION_LINE_MAPPING_REQUIRED_DATA_MISSING',
      400,
      context,
    );
    this.name = 'EvaluationLineMappingRequiredDataMissingException';
  }
}

// 평가 라인 맵핑 잘못된 데이터 형식 예외
export class InvalidEvaluationLineMappingDataFormatException extends EvaluationLineMappingDomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INVALID_EVALUATION_LINE_MAPPING_DATA_FORMAT', 400, context);
    this.name = 'InvalidEvaluationLineMappingDataFormatException';
  }
}
