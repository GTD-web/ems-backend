/**
 * 산출물 맵핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class DeliverableMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'DeliverableMappingDomainException';
  }
}

// 산출물 맵핑 중복 생성 예외
export class DuplicateDeliverableMappingException extends DeliverableMappingDomainException {
  constructor(employeeId: string, wbsItemId: string, deliverableId: string) {
    super(
      `이미 존재하는 산출물 맵핑입니다: 직원 ${employeeId}, WBS ${wbsItemId}, 산출물 ${deliverableId}`,
      'DUPLICATE_DELIVERABLE_MAPPING',
      409,
      { employeeId, wbsItemId, deliverableId },
    );
    this.name = 'DuplicateDeliverableMappingException';
  }
}

// 산출물 맵핑 조회 실패 예외
export class DeliverableMappingNotFoundException extends DeliverableMappingDomainException {
  constructor(identifier: string) {
    super(
      `산출물 맵핑을 찾을 수 없습니다: ${identifier}`,
      'DELIVERABLE_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'DeliverableMappingNotFoundException';
  }
}

// 산출물 맵핑 권한 없음 예외
export class DeliverableMappingPermissionDeniedException extends DeliverableMappingDomainException {
  constructor(mappingId: string, employeeId: string, requesterId: string) {
    super(
      `산출물 맵핑 권한이 없습니다. 본인의 산출물만 관리할 수 있습니다: 맵핑 ${mappingId}, 산출물 소유자 ${employeeId}, 요청자 ${requesterId}`,
      'DELIVERABLE_MAPPING_PERMISSION_DENIED',
      403,
      { mappingId, employeeId, requesterId },
    );
    this.name = 'DeliverableMappingPermissionDeniedException';
  }
}
