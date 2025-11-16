import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';

/**
 * 재작성 요청 단계 enum
 */
export enum RevisionRequestStepEnum {
  CRITERIA = 'criteria',
  SELF = 'self',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * 재작성 요청 목록 조회 쿼리 DTO
 */
export class GetRevisionRequestsQueryDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evaluationPeriodId?: string;

  @ApiPropertyOptional({
    description: '피평가자 ID (관리자용)',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: '요청자 ID (관리자용)',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;

  @ApiPropertyOptional({
    description: '단계',
    enum: RevisionRequestStepEnum,
  })
  @IsOptional()
  @IsEnum(RevisionRequestStepEnum)
  step?: RevisionRequestStepEnum;
}
