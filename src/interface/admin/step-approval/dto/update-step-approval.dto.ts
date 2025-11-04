import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsOptional,
} from 'class-validator';

/**
 * 단계 타입 enum
 */
export enum StepTypeEnum {
  CRITERIA = 'criteria',
  SELF = 'self',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * 단계 승인 상태 enum
 */
export enum StepApprovalStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
  REVISION_COMPLETED = 'revision_completed',
}

/**
 * 단계 승인 상태 업데이트 DTO
 */
export class UpdateStepApprovalDto {
  @ApiProperty({
    description: '단계',
    enum: StepTypeEnum,
    example: StepTypeEnum.CRITERIA,
  })
  @IsEnum(StepTypeEnum)
  @IsNotEmpty()
  step: StepTypeEnum;

  @ApiProperty({
    description: '승인 상태',
    enum: StepApprovalStatusEnum,
    example: StepApprovalStatusEnum.APPROVED,
  })
  @IsEnum(StepApprovalStatusEnum)
  @IsNotEmpty()
  status: StepApprovalStatusEnum;

  @ApiPropertyOptional({
    description:
      '재작성 요청 코멘트 (status가 revision_requested인 경우 필수)',
    example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
  })
  @ValidateIf((o) => o.status === StepApprovalStatusEnum.REVISION_REQUESTED)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  revisionComment?: string;
}


