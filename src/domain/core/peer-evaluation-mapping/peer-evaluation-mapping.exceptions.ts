import { DomainException } from '@libs/exceptions/domain.exception';

// 동료평가 맵핑 도메인 예외 기본 클래스
export class PeerEvaluationMappingDomainException extends DomainException {
  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    metadata?: any,
  ) {
    super(message, code, statusCode, metadata);
    this.name = 'PeerEvaluationMappingDomainException';
  }
}

// 동료평가 맵핑 중복 생성 예외
export class DuplicatePeerEvaluationMappingException extends PeerEvaluationMappingDomainException {
  constructor(employeeId: string, evaluatorId: string, periodId: string) {
    super(
      `이미 존재하는 동료평가 맵핑입니다: 피평가자 ${employeeId}, 평가자 ${evaluatorId}, 기간 ${periodId}`,
      'DUPLICATE_PEER_EVALUATION_MAPPING',
      409,
      { employeeId, evaluatorId, periodId },
    );
    this.name = 'DuplicatePeerEvaluationMappingException';
  }
}

// 동료평가 맵핑 조회 실패 예외
export class PeerEvaluationMappingNotFoundException extends PeerEvaluationMappingDomainException {
  constructor(identifier: string) {
    super(
      `동료평가 맵핑을 찾을 수 없습니다: ${identifier}`,
      'PEER_EVALUATION_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'PeerEvaluationMappingNotFoundException';
  }
}

// 동료평가 맵핑 권한 거부 예외
export class PeerEvaluationMappingPermissionDeniedException extends PeerEvaluationMappingDomainException {
  constructor(userId: string, action: string) {
    super(
      `동료평가 맵핑에 대한 ${action} 권한이 없습니다: 사용자 ${userId}`,
      'PEER_EVALUATION_MAPPING_PERMISSION_DENIED',
      403,
      { userId, action },
    );
    this.name = 'PeerEvaluationMappingPermissionDeniedException';
  }
}

// 동료평가 맵핑 자기평가 예외
export class PeerEvaluationMappingSelfEvaluationException extends PeerEvaluationMappingDomainException {
  constructor(employeeId: string) {
    super(
      `동료평가에서 자기 자신을 평가할 수 없습니다: 직원 ${employeeId}`,
      'PEER_EVALUATION_MAPPING_SELF_EVALUATION',
      400,
      { employeeId },
    );
    this.name = 'PeerEvaluationMappingSelfEvaluationException';
  }
}

// 동료평가 맵핑 기간 만료 예외
export class PeerEvaluationMappingPeriodExpiredException extends PeerEvaluationMappingDomainException {
  constructor(mappingId: string, periodId: string) {
    super(
      `동료평가 맵핑의 평가 기간이 만료되었습니다: 맵핑 ${mappingId}, 기간 ${periodId}`,
      'PEER_EVALUATION_MAPPING_PERIOD_EXPIRED',
      400,
      { mappingId, periodId },
    );
    this.name = 'PeerEvaluationMappingPeriodExpiredException';
  }
}
