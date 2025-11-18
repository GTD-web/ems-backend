import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { StepApprovalStatusEnum } from './update-step-approval.dto';
import { ToBoolean } from '@/interface/common/decorators';

/**
 * 2차 평가 단계 승인 상태 업데이트 DTO
 * 평가자 ID는 URL 파라미터로 받으므로 DTO에는 포함하지 않음
 */
export class UpdateSecondaryStepApprovalDto {
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
    example: '평가 내용이 부족합니다. 보완해 주세요.',
  })
  @ValidateIf((o) => o.status === StepApprovalStatusEnum.REVISION_REQUESTED)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  revisionComment?: string;

  @ApiPropertyOptional({
    description:
      '상위 평가 자동 승인 여부 (true: 1차 하향평가와 자기평가도 함께 승인, false: 현재 평가만 승인)',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  approveSubsequentSteps?: boolean;
}
