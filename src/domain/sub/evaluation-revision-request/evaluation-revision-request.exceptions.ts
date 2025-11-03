import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

/**
 * 재작성 요청을 찾을 수 없을 때 발생하는 예외
 */
export class EvaluationRevisionRequestNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`재작성 요청을 찾을 수 없습니다. (ID: ${id})`);
  }
}

/**
 * 재작성 요청 수신자를 찾을 수 없을 때 발생하는 예외
 */
export class RevisionRequestRecipientNotFoundException extends NotFoundException {
  constructor(recipientId: string, requestId: string) {
    super(
      `재작성 요청 수신자를 찾을 수 없습니다. (수신자 ID: ${recipientId}, 요청 ID: ${requestId})`,
    );
  }
}

/**
 * 수신자가 재작성 요청에 접근할 권한이 없을 때 발생하는 예외
 */
export class UnauthorizedRevisionRequestAccessException extends ForbiddenException {
  constructor(recipientId: string, requestId: string) {
    super(
      `해당 재작성 요청에 접근할 권한이 없습니다. (수신자 ID: ${recipientId}, 요청 ID: ${requestId})`,
    );
  }
}

/**
 * 이미 완료된 재작성 요청에 응답하려고 할 때 발생하는 예외
 */
export class RevisionRequestAlreadyCompletedException extends ConflictException {
  constructor(requestId: string) {
    super(`이미 완료된 재작성 요청입니다. (요청 ID: ${requestId})`);
  }
}

/**
 * 재작성 완료 응답 코멘트가 비어있을 때 발생하는 예외
 */
export class EmptyResponseCommentException extends BadRequestException {
  constructor() {
    super('재작성 완료 응답 코멘트는 필수입니다.');
  }
}

/**
 * 유효하지 않은 수신자 타입일 때 발생하는 예외
 */
export class InvalidRecipientTypeException extends BadRequestException {
  constructor(type: string) {
    super(`유효하지 않은 수신자 타입입니다: ${type}`);
  }
}
