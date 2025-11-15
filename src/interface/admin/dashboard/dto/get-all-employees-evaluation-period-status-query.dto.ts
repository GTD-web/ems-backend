import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 평가기간의 모든 직원 현황 조회 쿼리 DTO
 */
export class GetAllEmployeesEvaluationPeriodStatusQueryDto {
  @ApiPropertyOptional({
    description: '등록 해제된 직원 포함 여부 (기본값: false)',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  includeUnregistered?: boolean = false;
}
