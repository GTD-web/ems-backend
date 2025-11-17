import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ToBoolean } from '@/interface/common/decorators';

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
 * step 필드는 URL 경로로 구분되므로 제거됨
 */
export class UpdateStepApprovalDto {
  @ApiProperty({
    description: '승인 상태',
    enum: StepApprovalStatusEnum,
    example: StepApprovalStatusEnum.APPROVED,
  })
  @IsEnum(StepApprovalStatusEnum)
  @IsNotEmpty()
  status: StepApprovalStatusEnum;

  @ApiPropertyOptional({
    description: '재작성 요청 코멘트 (status가 revision_requested인 경우 필수)',
    example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
  })
  @ValidateIf((o) => o.status === StepApprovalStatusEnum.REVISION_REQUESTED)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  revisionComment?: string;

  @ApiPropertyOptional({
    description:
      '하위 평가 자동 승인 여부 (true: 하위 평가도 함께 승인, false: 현재 평가만 승인)',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  approveSubsequentSteps?: boolean;
}
