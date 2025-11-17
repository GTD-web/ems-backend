import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * 2차 평가자별 단계 승인을 찾을 수 없을 때 발생하는 예외
 */
export class SecondaryEvaluationStepApprovalNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`2차 평가자별 단계 승인을 찾을 수 없습니다. (ID: ${id})`);
  }
}

/**
 * 맵핑 ID와 평가자 ID로 2차 평가자별 단계 승인을 찾을 수 없을 때 발생하는 예외
 */
export class SecondaryStepApprovalNotFoundByMappingAndEvaluatorException extends NotFoundException {
  constructor(mappingId: string, evaluatorId: string) {
    super(
      `해당 맵핑과 평가자에 대한 2차 평가자별 단계 승인 정보를 찾을 수 없습니다. (맵핑 ID: ${mappingId}, 평가자 ID: ${evaluatorId})`,
    );
  }
}

/**
 * 유효하지 않은 상태 전환일 때 발생하는 예외
 */
export class InvalidSecondaryStatusTransitionException extends BadRequestException {
  constructor(currentStatus: string, targetStatus: string, reason?: string) {
    super(
      `2차 평가자별 단계 승인 상태를 ${currentStatus}에서 ${targetStatus}(으)로 변경할 수 없습니다.${reason ? ` ${reason}` : ''}`,
    );
  }
}
