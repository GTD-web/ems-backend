/**
 * 산출물 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class DeliverableDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'DeliverableDomainException';
  }
}

// 잘못된 산출물 경로 예외
export class InvalidDeliverablePathException extends DeliverableDomainException {
  constructor(path: string, type: string, deliverableId?: string) {
    super(
      `잘못된 산출물 경로입니다: ${path} (타입: ${type})`,
      'INVALID_DELIVERABLE_PATH',
      400,
      { path, type, deliverableId },
    );
    this.name = 'InvalidDeliverablePathException';
  }
}

// 산출물 타입 불일치 예외
export class DeliverableTypeMismatchException extends DeliverableDomainException {
  constructor(
    expectedType: string,
    actualType: string,
    deliverableId?: string,
  ) {
    super(
      `산출물 타입이 일치하지 않습니다: 예상 ${expectedType}, 실제 ${actualType}`,
      'DELIVERABLE_TYPE_MISMATCH',
      400,
      { expectedType, actualType, deliverableId },
    );
    this.name = 'DeliverableTypeMismatchException';
  }
}

// 산출물 조회 실패 예외
export class DeliverableNotFoundException extends DeliverableDomainException {
  constructor(identifier: string) {
    super(
      `산출물을 찾을 수 없습니다: ${identifier}`,
      'DELIVERABLE_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'DeliverableNotFoundException';
  }
}

// 중복 산출물 예외
export class DuplicateDeliverableException extends DeliverableDomainException {
  constructor(wbsItemId: string, title: string) {
    super(
      `이미 존재하는 산출물입니다: WBS ${wbsItemId}, 제목 ${title}`,
      'DUPLICATE_DELIVERABLE',
      409,
      { wbsItemId, title },
    );
    this.name = 'DuplicateDeliverableException';
  }
}

// 산출물 접근 권한 없음 예외
export class DeliverableAccessDeniedException extends DeliverableDomainException {
  constructor(deliverableId: string, employeeId: string) {
    super(
      `산출물 접근 권한이 없습니다: ${deliverableId} (직원: ${employeeId})`,
      'DELIVERABLE_ACCESS_DENIED',
      403,
      { deliverableId, employeeId },
    );
    this.name = 'DeliverableAccessDeniedException';
  }
}

// 산출물 파일 크기 초과 예외
export class DeliverableFileSizeExceededException extends DeliverableDomainException {
  constructor(fileSize: number, maxSize: number, deliverableId?: string) {
    super(
      `산출물 파일 크기가 제한을 초과했습니다: ${fileSize}MB (최대: ${maxSize}MB)`,
      'DELIVERABLE_FILE_SIZE_EXCEEDED',
      400,
      { fileSize, maxSize, deliverableId },
    );
    this.name = 'DeliverableFileSizeExceededException';
  }
}
