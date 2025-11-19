import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepApprovalStatusEnum } from './update-step-approval.dto';

/**
 * 2차 평가 단계 승인 상태 업데이트 응답 DTO
 */
export class UpdateSecondaryStepApprovalResponseDto {
  @ApiProperty({
    description: '2차 평가자별 단계 승인 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간-직원 맵핑 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  evaluationPeriodEmployeeMappingId: string;

  @ApiProperty({
    description: '2차 평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '승인 상태',
    enum: StepApprovalStatusEnum,
    example: StepApprovalStatusEnum.APPROVED,
  })
  status: StepApprovalStatusEnum;

  @ApiPropertyOptional({
    description: '승인자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  approvedBy: string | null;

  @ApiPropertyOptional({
    description: '승인 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  approvedAt: Date | null;

  @ApiPropertyOptional({
    description: '재작성 요청 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
    nullable: true,
  })
  revisionRequestId: string | null;

  @ApiProperty({
    description: '생성 일시',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

