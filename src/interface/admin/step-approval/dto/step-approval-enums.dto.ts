import { ApiProperty } from '@nestjs/swagger';
import { StepTypeEnum, StepApprovalStatusEnum } from './update-step-approval.dto';

/**
 * 단계 승인 Enum 조회 응답 DTO
 */
export class StepApprovalEnumsResponseDto {
  @ApiProperty({
    description: '가능한 단계 목록',
    enum: StepTypeEnum,
    isArray: true,
    example: ['criteria', 'self', 'primary', 'secondary'],
  })
  steps: StepTypeEnum[];

  @ApiProperty({
    description: '가능한 승인 상태 목록',
    enum: StepApprovalStatusEnum,
    isArray: true,
    example: ['pending', 'approved', 'revision_requested', 'revision_completed'],
  })
  statuses: StepApprovalStatusEnum[];
}

