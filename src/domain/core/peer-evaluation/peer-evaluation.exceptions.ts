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
