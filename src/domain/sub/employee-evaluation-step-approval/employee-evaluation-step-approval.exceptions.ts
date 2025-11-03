import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * 직원 평가 단계 승인을 찾을 수 없을 때 발생하는 예외
 */
export class EmployeeEvaluationStepApprovalNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`직원 평가 단계 승인을 찾을 수 없습니다. (ID: ${id})`);
  }
}

/**
 * 맵핑 ID로 직원 평가 단계 승인을 찾을 수 없을 때 발생하는 예외
 */
export class StepApprovalNotFoundByMappingException extends NotFoundException {
  constructor(mappingId: string) {
    super(
      `해당 맵핑에 대한 단계 승인 정보를 찾을 수 없습니다. (맵핑 ID: ${mappingId})`,
    );
  }
}

/**
 * 유효하지 않은 단계 타입일 때 발생하는 예외
 */
export class InvalidStepTypeException extends BadRequestException {
  constructor(step: string) {
    super(`유효하지 않은 평가 단계입니다: ${step}`);
  }
}

/**
 * 유효하지 않은 상태 전환일 때 발생하는 예외
 */
export class InvalidStatusTransitionException extends BadRequestException {
  constructor(
    step: string,
    currentStatus: string,
    targetStatus: string,
    reason?: string,
  ) {
    super(
      `${step} 단계의 상태를 ${currentStatus}에서 ${targetStatus}(으)로 변경할 수 없습니다.${reason ? ` ${reason}` : ''}`,
    );
  }
}

