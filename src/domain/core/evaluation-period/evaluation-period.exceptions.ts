/**
 * 평가 기간 도메인 예외 클래스들
 *
 * HTTP 상태 코드 매핑:
 * - 400 Bad Request: 잘못된 요청 (필수 데이터 누락, 잘못된 형식, 잘못된 참조)
 * - 404 Not Found: 리소스를 찾을 수 없음
 * - 409 Conflict: 리소스 충돌 (중복 데이터, 기간 겹침)
 * - 422 Unprocessable Entity: 요청은 이해했지만 비즈니스 규칙상 처리 불가
 * - 403 Forbidden: 권한 부족
 * - 500 Internal Server Error: 서버 내부 오류
 * - 502 Bad Gateway: 외부 서비스 연동 실패
 */

import { DateTimeUtils } from './utils/date-time.utils';

// 기본 도메인 예외
export class EvaluationPeriodDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400, // 기본적으로 Bad Request
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationPeriodDomainException';
  }
}

// 상태 전이 예외 (422 Unprocessable Entity - 요청은 이해했지만 비즈니스 규칙상 처리 불가)
export class InvalidEvaluationPeriodStatusTransitionException extends EvaluationPeriodDomainException {
  constructor(
    currentStatus: string,
    targetStatus: string,
    message?: string,
    periodId?: string,
  ) {
    super(
      message ||
        `평가 기간 상태 전이가 불가능합니다: ${currentStatus} → ${targetStatus}`,
      'INVALID_EVALUATION_PERIOD_STATUS_TRANSITION',
      422,
      { currentStatus, targetStatus, periodId },
    );
    this.name = 'InvalidEvaluationPeriodStatusTransitionException';
  }
}

// 단계 전이 예외 (422 Unprocessable Entity - 비즈니스 규칙상 처리 불가)
export class InvalidEvaluationPeriodPhaseTransitionException extends EvaluationPeriodDomainException {
  constructor(currentPhase: string, targetPhase: string, periodId?: string) {
    super(
      `평가 기간 단계 전이가 불가능합니다: ${currentPhase} → ${targetPhase}`,
      'INVALID_EVALUATION_PERIOD_PHASE_TRANSITION',
      422,
      { currentPhase, targetPhase, periodId },
    );
    this.name = 'InvalidEvaluationPeriodPhaseTransitionException';
  }
}

// 비즈니스 규칙 위반 예외 (422 Unprocessable Entity - 비즈니스 규칙 위반)
export class EvaluationPeriodBusinessRuleViolationException extends EvaluationPeriodDomainException {
  constructor(rule: string, context?: Record<string, any>) {
    super(
      `평가 기간 비즈니스 규칙 위반: ${rule}`,
      'EVALUATION_PERIOD_BUSINESS_RULE_VIOLATION',
      422,
      context,
    );
    this.name = 'EvaluationPeriodBusinessRuleViolationException';
  }
}

// 필수 데이터 누락 예외 (400 Bad Request - 잘못된 요청)
export class EvaluationPeriodRequiredDataMissingException extends EvaluationPeriodDomainException {
  constructor(fieldName: string, context?: Record<string, any>) {
    super(
      `평가 기간 필수 데이터가 누락되었습니다: ${fieldName}`,
      'EVALUATION_PERIOD_REQUIRED_DATA_MISSING',
      400,
      context,
    );
    this.name = 'EvaluationPeriodRequiredDataMissingException';
  }
}

// 잘못된 데이터 형식 예외 (400 Bad Request - 잘못된 요청 형식)
export class InvalidEvaluationPeriodDataFormatException extends EvaluationPeriodDomainException {
  constructor(fieldName: string, expectedFormat: string, actualValue?: any) {
    super(
      `평가 기간 데이터 형식이 올바르지 않습니다: ${fieldName} (예상: ${expectedFormat})`,
      'INVALID_EVALUATION_PERIOD_DATA_FORMAT',
      400,
      { fieldName, expectedFormat, actualValue },
    );
    this.name = 'InvalidEvaluationPeriodDataFormatException';
  }
}

// 날짜 유효성 예외 (400 Bad Request - 잘못된 날짜)
export class InvalidEvaluationPeriodDateRangeException extends EvaluationPeriodDomainException {
  constructor(
    message: string,
    startDate?: Date,
    endDate?: Date,
    periodId?: string,
  ) {
    super(message, 'INVALID_EVALUATION_PERIOD_DATE_RANGE', 400, {
      startDate,
      endDate,
      periodId,
    });
    this.name = 'InvalidEvaluationPeriodDateRangeException';
  }
}

// 세부 일정 유효성 예외 (400 Bad Request - 잘못된 날짜 범위)
export class InvalidEvaluationPeriodDetailScheduleException extends EvaluationPeriodDomainException {
  constructor(
    scheduleType: string,
    startDate: Date,
    endDate: Date,
    periodId?: string,
  ) {
    super(
      `${scheduleType} 일정이 평가 기간을 벗어났습니다: ${startDate} - ${endDate}`,
      'INVALID_EVALUATION_PERIOD_DETAIL_SCHEDULE',
      400,
      { scheduleType, startDate, endDate, periodId },
    );
    this.name = 'InvalidEvaluationPeriodDetailScheduleException';
  }
}

// 평가 기간 만료 예외 (422 Unprocessable Entity - 만료된 기간에 대한 작업 시도)
export class EvaluationPeriodExpiredException extends EvaluationPeriodDomainException {
  constructor(periodId: string, endDate: Date) {
    super(
      `만료된 평가 기간입니다: ${periodId} (종료일: ${endDate})`,
      'EVALUATION_PERIOD_EXPIRED',
      422,
      { periodId, endDate },
    );
    this.name = 'EvaluationPeriodExpiredException';
  }
}

// 평가 기간 미시작 예외 (422 Unprocessable Entity - 시작되지 않은 기간에 대한 작업 시도)
export class EvaluationPeriodNotStartedException extends EvaluationPeriodDomainException {
  constructor(periodId: string, startDate: Date) {
    super(
      `아직 시작되지 않은 평가 기간입니다: ${periodId} (시작일: ${startDate})`,
      'EVALUATION_PERIOD_NOT_STARTED',
      422,
      { periodId, startDate },
    );
    this.name = 'EvaluationPeriodNotStartedException';
  }
}

// 평가 기간 중복 활성화 예외 (422 Unprocessable Entity - 동시에 여러 기간 활성화 불가)
export class MultipleActiveEvaluationPeriodsException extends EvaluationPeriodDomainException {
  constructor(activePeriodIds: string[]) {
    super(
      `동시에 여러 평가 기간이 활성화될 수 없습니다: ${activePeriodIds.join(', ')}`,
      'MULTIPLE_ACTIVE_EVALUATION_PERIODS',
      422,
      { activePeriodIds },
    );
    this.name = 'MultipleActiveEvaluationPeriodsException';
  }
}

// 리포지토리 예외 (기본적으로 500 Internal Server Error)
export class EvaluationPeriodRepositoryException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: Error,
    public readonly operation?: string,
  ) {
    super(message);
    this.name = 'EvaluationPeriodRepositoryException';
  }
}

// 중복 데이터 예외 (409 Conflict - 리소스 충돌)
export class DuplicateEvaluationPeriodException extends EvaluationPeriodRepositoryException {
  constructor(identifier: string, originalError?: Error) {
    super(
      `이미 존재하는 평가 기간입니다: ${identifier}`,
      409,
      originalError,
      'CREATE',
    );
    this.name = 'DuplicateEvaluationPeriodException';
  }
}

// 평가 기간 이름 중복 예외 (409 Conflict - 리소스 충돌)
export class EvaluationPeriodNameDuplicateException extends EvaluationPeriodRepositoryException {
  constructor(name: string, originalError?: Error) {
    super(
      `이미 존재하는 평가 기간 이름입니다: ${name}`,
      409,
      originalError,
      'NAME_DUPLICATE_CHECK',
    );
    this.name = 'EvaluationPeriodNameDuplicateException';
  }
}

// 평가 기간 겹침 예외 (409 Conflict - 기간 충돌)
export class EvaluationPeriodOverlapException extends EvaluationPeriodRepositoryException {
  constructor(
    startDate: Date,
    endDate: Date,
    conflictingPeriodId: string,
    originalError?: Error,
  ) {
    const formattedStartDate = DateTimeUtils.날짜문자열변환한다(startDate);
    const formattedEndDate = DateTimeUtils.날짜문자열변환한다(endDate);

    super(
      `평가 기간이 기존 기간과 겹칩니다: ${formattedStartDate} ~ ${formattedEndDate} (충돌 기간 ID: ${conflictingPeriodId})`,
      409,
      originalError,
      'PERIOD_OVERLAP_CHECK',
    );
    this.name = 'EvaluationPeriodOverlapException';
  }
}

// 평가 기간 조회 실패 예외 (404 Not Found - 리소스를 찾을 수 없음)
export class EvaluationPeriodNotFoundException extends EvaluationPeriodRepositoryException {
  constructor(identifier: string, originalError?: Error) {
    super(
      `평가 기간을 찾을 수 없습니다: ${identifier}`,
      404,
      originalError,
      'FIND',
    );
    this.name = 'EvaluationPeriodNotFoundException';
  }
}

// 활성 평가 기간 없음 예외 (404 Not Found - 활성 기간 없음)
export class NoActiveEvaluationPeriodException extends EvaluationPeriodRepositoryException {
  constructor(originalError?: Error) {
    super(
      '현재 활성화된 평가 기간이 없습니다',
      404,
      originalError,
      'FIND_ACTIVE',
    );
    this.name = 'NoActiveEvaluationPeriodException';
  }
}

// 애플리케이션 서비스 예외
export class EvaluationPeriodServiceException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'EvaluationPeriodServiceException';
  }
}

// 권한 부족 예외 (403 Forbidden - 권한 부족)
export class InsufficientEvaluationPeriodPermissionException extends EvaluationPeriodServiceException {
  constructor(action: string, userId: string, periodId: string) {
    super(
      `평가 기간 권한이 부족합니다: ${action}`,
      'INSUFFICIENT_EVALUATION_PERIOD_PERMISSION',
      403,
    );
    this.name = 'InsufficientEvaluationPeriodPermissionException';
  }
}

// 평가 기간 삭제 불가 예외 (422 Unprocessable Entity - 삭제 조건 미충족)
export class EvaluationPeriodDeletionNotAllowedException extends EvaluationPeriodServiceException {
  constructor(periodId: string, reason: string) {
    super(
      `평가 기간을 삭제할 수 없습니다: ${reason}`,
      'EVALUATION_PERIOD_DELETION_NOT_ALLOWED',
      422,
    );
    this.name = 'EvaluationPeriodDeletionNotAllowedException';
  }
}

// 평가 기간 수정 불가 예외 (422 Unprocessable Entity - 수정 조건 미충족)
export class EvaluationPeriodModificationNotAllowedException extends EvaluationPeriodServiceException {
  constructor(periodId: string, reason: string) {
    super(
      `평가 기간을 수정할 수 없습니다: ${reason}`,
      'EVALUATION_PERIOD_MODIFICATION_NOT_ALLOWED',
      422,
    );
    this.name = 'EvaluationPeriodModificationNotAllowedException';
  }
}

// 외부 서비스 연동 예외 (502 Bad Gateway - 외부 서비스 연동 실패)
export class EvaluationPeriodExternalServiceException extends EvaluationPeriodServiceException {
  constructor(serviceName: string, operation: string, originalError?: Error) {
    super(
      `평가 기간 외부 서비스 연동 실패: ${serviceName}.${operation}`,
      'EVALUATION_PERIOD_EXTERNAL_SERVICE_ERROR',
      502,
      originalError,
    );
    this.name = 'EvaluationPeriodExternalServiceException';
  }
}

// 자기평가 달성률 유효성 예외 (400 Bad Request - 잘못된 달성률 값)
export class InvalidSelfEvaluationRateException extends EvaluationPeriodDomainException {
  constructor(rate: number, minRate: number = 0, maxRate: number = 200) {
    super(
      `유효하지 않은 자기평가 달성률입니다: ${rate}% (허용 범위: ${minRate}% ~ ${maxRate}%)`,
      'INVALID_SELF_EVALUATION_RATE',
      400,
      { rate, minRate, maxRate },
    );
    this.name = 'InvalidSelfEvaluationRateException';
  }
}

// 자기평가 달성률 설정 불가 예외 (422 Unprocessable Entity - 설정 조건 미충족)
export class SelfEvaluationRateSettingNotAllowedException extends EvaluationPeriodDomainException {
  constructor(periodId: string, currentStatus: string, reason: string) {
    super(
      `자기평가 달성률을 설정할 수 없습니다: ${reason} (현재 상태: ${currentStatus})`,
      'SELF_EVALUATION_RATE_SETTING_NOT_ALLOWED',
      422,
      { periodId, currentStatus, reason },
    );
    this.name = 'SelfEvaluationRateSettingNotAllowedException';
  }
}

// 평가 기간 이름 중복 예외 (409 Conflict - 리소스 충돌)
export class DuplicateEvaluationPeriodNameException extends EvaluationPeriodRepositoryException {
  constructor(name: string, originalError?: Error) {
    super(
      `이미 존재하는 평가 기간 이름입니다: ${name}`,
      409,
      originalError,
      'NAME_DUPLICATE_CHECK',
    );
    this.name = 'DuplicateEvaluationPeriodNameException';
  }
}

// 평가 기간 날짜 겹침 예외 (409 Conflict - 기간 충돌)
export class EvaluationPeriodDateOverlapException extends EvaluationPeriodRepositoryException {
  constructor(startDate: Date, endDate: Date, originalError?: Error) {
    const formattedStartDate = DateTimeUtils.날짜문자열변환한다(startDate);
    const formattedEndDate = DateTimeUtils.날짜문자열변환한다(endDate);

    super(
      `평가 기간이 기존 기간과 겹칩니다: ${formattedStartDate} ~ ${formattedEndDate}`,
      409,
      originalError,
      'PERIOD_OVERLAP_CHECK',
    );
    this.name = 'EvaluationPeriodDateOverlapException';
  }
}

// 활성 평가 기간 이미 존재 예외 (422 Unprocessable Entity - 비즈니스 규칙 위반)
export class ActiveEvaluationPeriodAlreadyExistsException extends EvaluationPeriodServiceException {
  constructor(activePeriodName: string) {
    super(
      `이미 활성화된 평가 기간이 있습니다: ${activePeriodName}`,
      'ACTIVE_EVALUATION_PERIOD_ALREADY_EXISTS',
      422,
    );
    this.name = 'ActiveEvaluationPeriodAlreadyExistsException';
  }
}
