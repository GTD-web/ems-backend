/**
 * 동료 평가 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class PeerEvaluationDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'PeerEvaluationDomainException';
  }
}

// 동료 평가 점수 범위 초과 예외
export class InvalidPeerEvaluationScoreException extends PeerEvaluationDomainException {
  constructor(
    score: number,
    minScore: number,
    maxScore: number,
    evaluationId?: string,
  ) {
    super(
      `동료 평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`,
      'INVALID_PEER_EVALUATION_SCORE',
      400,
      { score, minScore, maxScore, evaluationId },
    );
    this.name = 'InvalidPeerEvaluationScoreException';
  }
}

// 중복 동료 평가 예외
export class DuplicatePeerEvaluationException extends PeerEvaluationDomainException {
  constructor(employeeId: string, evaluatorId: string, periodId: string) {
    super(
      `이미 존재하는 동료 평가입니다: 직원 ${employeeId}, 평가자 ${evaluatorId}, 평가기간 ${periodId}`,
      'DUPLICATE_PEER_EVALUATION',
      409,
      { employeeId, evaluatorId, periodId },
    );
    this.name = 'DuplicatePeerEvaluationException';
  }
}

// 동료 평가 조회 실패 예외
export class PeerEvaluationNotFoundException extends PeerEvaluationDomainException {
  constructor(identifier: string) {
    super(
      `동료 평가를 찾을 수 없습니다: ${identifier}`,
      'PEER_EVALUATION_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'PeerEvaluationNotFoundException';
  }
}

// 자기 자신 동료 평가 예외
export class SelfPeerEvaluationException extends PeerEvaluationDomainException {
  constructor(employeeId: string) {
    super(
      `자기 자신을 동료 평가할 수 없습니다: ${employeeId}`,
      'SELF_PEER_EVALUATION',
      400,
      { employeeId },
    );
    this.name = 'SelfPeerEvaluationException';
  }
}

// 동료평가 유효성 검사 예외
export class PeerEvaluationValidationException extends PeerEvaluationDomainException {
  constructor(message: string) {
    super(
      `동료평가 유효성 검사 실패: ${message}`,
      'PEER_EVALUATION_VALIDATION_ERROR',
      400,
      { message },
    );
    this.name = 'PeerEvaluationValidationException';
  }
}

// 동료평가 중복 예외 (새로운 이름)
export class PeerEvaluationDuplicateException extends PeerEvaluationDomainException {
  constructor(evaluatorId: string, employeeId: string, periodId: string) {
    super(
      `이미 존재하는 동료평가입니다: 평가자 ${evaluatorId}, 피평가자 ${employeeId}, 기간 ${periodId}`,
      'PEER_EVALUATION_DUPLICATE',
      409,
      { evaluatorId, employeeId, periodId },
    );
    this.name = 'PeerEvaluationDuplicateException';
  }
}

// 동료평가 권한 거부 예외
export class PeerEvaluationPermissionDeniedException extends PeerEvaluationDomainException {
  constructor(userId: string, action: string) {
    super(
      `동료평가에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`,
      'PEER_EVALUATION_PERMISSION_DENIED',
      403,
      { userId, action },
    );
    this.name = 'PeerEvaluationPermissionDeniedException';
  }
}

// 동료평가 기간 만료 예외
export class PeerEvaluationPeriodExpiredException extends PeerEvaluationDomainException {
  constructor(evaluationId: string, periodId: string) {
    super(
      `동료평가의 평가 기간이 만료되었습니다: 평가 ${evaluationId}, 기간 ${periodId}`,
      'PEER_EVALUATION_PERIOD_EXPIRED',
      400,
      { evaluationId, periodId },
    );
    this.name = 'PeerEvaluationPeriodExpiredException';
  }
}
