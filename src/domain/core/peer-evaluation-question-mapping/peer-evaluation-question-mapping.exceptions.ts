import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

/**
 * 동료평가 질문 매핑 도메인 예외 베이스 클래스
 */
export class PeerEvaluationQuestionMappingDomainException extends BadRequestException {
  constructor(message: string, code: string, statusCode = 400, data?: any) {
    super({
      message,
      code,
      statusCode,
      data,
    });
    this.name = 'PeerEvaluationQuestionMappingDomainException';
  }
}

/**
 * 동료평가 질문 매핑을 찾을 수 없음
 */
export class PeerEvaluationQuestionMappingNotFoundException extends NotFoundException {
  constructor(mappingId: string) {
    super(
      `동료평가 질문 매핑을 찾을 수 없습니다. (id: ${mappingId})`,
      'PEER_EVALUATION_QUESTION_MAPPING_NOT_FOUND',
    );
    this.name = 'PeerEvaluationQuestionMappingNotFoundException';
  }
}

/**
 * 중복된 동료평가 질문 매핑
 */
export class DuplicatePeerEvaluationQuestionMappingException extends ConflictException {
  constructor(peerEvaluationId: string, questionId: string) {
    super(
      `이미 해당 동료평가에 질문이 추가되어 있습니다. (peerEvaluationId: ${peerEvaluationId}, questionId: ${questionId})`,
      'DUPLICATE_PEER_EVALUATION_QUESTION_MAPPING',
    );
    this.name = 'DuplicatePeerEvaluationQuestionMappingException';
  }
}

