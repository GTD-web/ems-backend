/**
 * WBS 자기평가 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class WbsSelfEvaluationDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'WbsSelfEvaluationDomainException';
  }
}

// WBS 자기평가 점수 범위 초과 예외
export class InvalidWbsSelfEvaluationScoreException extends WbsSelfEvaluationDomainException {
  constructor(
    score: number,
    minScore: number,
    maxScore: number,
    wbsItemId?: string,
  ) {
    super(
      `WBS 자기평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`,
      'INVALID_WBS_SELF_EVALUATION_SCORE',
      400,
      { score, minScore, maxScore, wbsItemId },
    );
    this.name = 'InvalidWbsSelfEvaluationScoreException';
  }
}

// WBS 자기평가 중복 생성 예외
export class DuplicateWbsSelfEvaluationException extends WbsSelfEvaluationDomainException {
  constructor(wbsItemId: string, employeeId: string, periodId: string) {
    super(
      `이미 존재하는 WBS 자기평가입니다: WBS ${wbsItemId}, 직원 ${employeeId}, 평가기간 ${periodId}`,
      'DUPLICATE_WBS_SELF_EVALUATION',
      409,
      { wbsItemId, employeeId, periodId },
    );
    this.name = 'DuplicateWbsSelfEvaluationException';
  }
}

// WBS 자기평가 조회 실패 예외
export class WbsSelfEvaluationNotFoundException extends WbsSelfEvaluationDomainException {
  constructor(identifier: string) {
    super(
      `WBS 자기평가를 찾을 수 없습니다: ${identifier}`,
      'WBS_SELF_EVALUATION_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'WbsSelfEvaluationNotFoundException';
  }
}

// WBS 자기평가 권한 없음 예외 (본인이 아닌 경우)
export class WbsSelfEvaluationPermissionDeniedException extends WbsSelfEvaluationDomainException {
  constructor(wbsItemId: string, employeeId: string, requesterId: string) {
    super(
      `WBS 자기평가 권한이 없습니다. 본인의 평가만 수정할 수 있습니다: WBS ${wbsItemId}, 평가대상 ${employeeId}, 요청자 ${requesterId}`,
      'WBS_SELF_EVALUATION_PERMISSION_DENIED',
      403,
      { wbsItemId, employeeId, requesterId },
    );
    this.name = 'WbsSelfEvaluationPermissionDeniedException';
  }
}

// WBS 자기평가 기간 만료 예외
export class WbsSelfEvaluationPeriodExpiredException extends WbsSelfEvaluationDomainException {
  constructor(periodId: string, endDate: Date) {
    super(
      `WBS 자기평가 기간이 만료되었습니다: ${periodId} (종료일: ${endDate})`,
      'WBS_SELF_EVALUATION_PERIOD_EXPIRED',
      422,
      { periodId, endDate },
    );
    this.name = 'WbsSelfEvaluationPeriodExpiredException';
  }
}

// WBS 자기평가 이미 제출됨 예외
export class WbsSelfEvaluationAlreadySubmittedException extends WbsSelfEvaluationDomainException {
  constructor(wbsItemId: string, employeeId: string, submittedAt: Date) {
    super(
      `WBS 자기평가가 이미 제출되었습니다: WBS ${wbsItemId}, 직원 ${employeeId} (제출일: ${submittedAt})`,
      'WBS_SELF_EVALUATION_ALREADY_SUBMITTED',
      422,
      { wbsItemId, employeeId, submittedAt },
    );
    this.name = 'WbsSelfEvaluationAlreadySubmittedException';
  }
}

// WBS 자기평가 제출 불가 예외 (필수 정보 누락)
export class WbsSelfEvaluationCannotSubmitException extends WbsSelfEvaluationDomainException {
  constructor(wbsItemId: string, employeeId: string, reason: string) {
    super(
      `WBS 자기평가를 제출할 수 없습니다: WBS ${wbsItemId}, 직원 ${employeeId} (사유: ${reason})`,
      'WBS_SELF_EVALUATION_CANNOT_SUBMIT',
      422,
      { wbsItemId, employeeId, reason },
    );
    this.name = 'WbsSelfEvaluationCannotSubmitException';
  }
}
