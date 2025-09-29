/**
 * 직원 평가 상태 맵핑 도메인 예외 클래스들
 */

import { EvaluationElementType } from './interfaces/employee-evaluation-status-mapping.interface';

// 기본 도메인 예외
export class EmployeeEvaluationStatusMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EmployeeEvaluationStatusMappingDomainException';
  }
}

// 직원 평가 상태 맵핑 중복 생성 예외
export class DuplicateEmployeeEvaluationStatusMappingException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(
    employeeId: string,
    periodId: string,
    elementType: EvaluationElementType,
    elementId: string,
  ) {
    super(
      `이미 존재하는 직원 평가 상태 맵핑입니다: 직원 ${employeeId}, 기간 ${periodId}, 요소타입 ${elementType}, 요소 ${elementId}`,
      'DUPLICATE_EMPLOYEE_EVALUATION_STATUS_MAPPING',
      409,
      { employeeId, periodId, elementType, elementId },
    );
    this.name = 'DuplicateEmployeeEvaluationStatusMappingException';
  }
}

// 직원 평가 상태 맵핑 조회 실패 예외
export class EmployeeEvaluationStatusMappingNotFoundException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(identifier: string) {
    super(
      `직원 평가 상태 맵핑을 찾을 수 없습니다: ${identifier}`,
      'EMPLOYEE_EVALUATION_STATUS_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EmployeeEvaluationStatusMappingNotFoundException';
  }
}

// 직원 평가 상태 맵핑 권한 거부 예외
export class EmployeeEvaluationStatusMappingPermissionDeniedException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(userId: string, action: string) {
    super(
      `직원 평가 상태 맵핑에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`,
      'EMPLOYEE_EVALUATION_STATUS_MAPPING_PERMISSION_DENIED',
      403,
      { userId, action },
    );
    this.name = 'EmployeeEvaluationStatusMappingPermissionDeniedException';
  }
}

// 직원 평가 상태 맵핑 평가 요소 불일치 예외
export class EmployeeEvaluationStatusMappingElementMismatchException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(
    mappingId: string,
    expectedElementType: EvaluationElementType,
    actualElementType: EvaluationElementType,
  ) {
    super(
      `평가 요소 타입이 일치하지 않습니다: 맵핑 ${mappingId}, 예상 타입 ${expectedElementType}, 실제 타입 ${actualElementType}`,
      'EMPLOYEE_EVALUATION_STATUS_MAPPING_ELEMENT_MISMATCH',
      400,
      { mappingId, expectedElementType, actualElementType },
    );
    this.name = 'EmployeeEvaluationStatusMappingElementMismatchException';
  }
}

// 직원 평가 상태 맵핑 기간 만료 예외
export class EmployeeEvaluationStatusMappingPeriodExpiredException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(mappingId: string, periodId: string) {
    super(
      `직원 평가 상태 맵핑의 평가 기간이 만료되었습니다: 맵핑 ${mappingId}, 기간 ${periodId}`,
      'EMPLOYEE_EVALUATION_STATUS_MAPPING_PERIOD_EXPIRED',
      400,
      { mappingId, periodId },
    );
    this.name = 'EmployeeEvaluationStatusMappingPeriodExpiredException';
  }
}

// 직원 평가 상태 맵핑 평가 상태 불일치 예외
export class EmployeeEvaluationStatusMappingStatusMismatchException extends EmployeeEvaluationStatusMappingDomainException {
  constructor(
    mappingId: string,
    evaluationStatusId: string,
    elementId: string,
  ) {
    super(
      `평가 상태와 평가 요소가 일치하지 않습니다: 맵핑 ${mappingId}, 평가상태 ${evaluationStatusId}, 요소 ${elementId}`,
      'EMPLOYEE_EVALUATION_STATUS_MAPPING_STATUS_MISMATCH',
      400,
      { mappingId, evaluationStatusId, elementId },
    );
    this.name = 'EmployeeEvaluationStatusMappingStatusMismatchException';
  }
}
