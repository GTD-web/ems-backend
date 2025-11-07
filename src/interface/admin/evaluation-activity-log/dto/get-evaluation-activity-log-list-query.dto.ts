import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 평가 활동 내역 목록 조회 쿼리 DTO
 */
export class GetEvaluationActivityLogListQueryDto {
  @ApiPropertyOptional({
    description: '활동 유형',
    example: 'wbs_self_evaluation',
    enum: [
      'wbs_self_evaluation',
      'downward_evaluation',
      'peer_evaluation',
      'additional_evaluation',
      'deliverable',
      'evaluation_status',
    ],
  })
  @IsOptional()
  @IsString()
  activityType?: string;

  @ApiPropertyOptional({
    description: '활동 시작일',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '활동 종료일',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

