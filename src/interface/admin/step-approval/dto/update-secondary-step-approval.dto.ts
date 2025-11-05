import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsOptional,
} from 'class-validator';
import { StepApprovalStatusEnum } from './update-step-approval.dto';

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
    description:
      '재작성 요청 코멘트 (status가 revision_requested인 경우 필수)',
    example: '평가 내용이 부족합니다. 보완해 주세요.',
  })
  @ValidateIf((o) => o.status === StepApprovalStatusEnum.REVISION_REQUESTED)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  revisionComment?: string;
}

