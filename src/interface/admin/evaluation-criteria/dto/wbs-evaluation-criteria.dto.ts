import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

/**
 * WBS 평가기준 생성 DTO
 */
export class CreateWbsEvaluationCriteriaDto {
  @ApiProperty({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  @IsString()
  @IsUUID()
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  @IsString()
  criteria: string;
}

/**
 * WBS 평가기준 수정 DTO
 */
export class UpdateWbsEvaluationCriteriaDto {
  @ApiPropertyOptional({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  @IsOptional()
  @IsString()
  criteria?: string;
}

/**
 * WBS 평가기준 필터 DTO
 */
export class WbsEvaluationCriteriaFilterDto {
  @ApiPropertyOptional({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '기준 내용 검색 (부분 일치)',
    example: '코드 품질',
  })
  @IsOptional()
  @IsString()
  criteriaSearch?: string;

  @ApiPropertyOptional({
    description: '기준 내용 완전 일치',
    example: '코드 품질 및 성능 최적화',
  })
  @IsOptional()
  @IsString()
  criteriaExact?: string;
}

/**
 * WBS 평가기준 DTO
 */
export class WbsEvaluationCriteriaDto {
  @ApiProperty({ description: '평가기준 ID', example: 'criteria-uuid' })
  id: string;

  @ApiProperty({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  criteria: string;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

/**
 * WBS 항목별 평가기준 조회 응답 DTO
 */
export class WbsItemEvaluationCriteriaResponseDto {
  @ApiProperty({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 목록',
    type: [WbsEvaluationCriteriaDto],
  })
  criteria: WbsEvaluationCriteriaDto[];
}
