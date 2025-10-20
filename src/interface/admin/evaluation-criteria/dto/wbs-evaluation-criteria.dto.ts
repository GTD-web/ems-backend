import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

/**
 * WBS 평가기준 생성 DTO
 */
export class CreateWbsEvaluationCriteriaDto {
  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
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
 * WBS 평가기준 저장 (Upsert) DTO
 * - wbsItemId에 평가기준이 없으면 생성
 * - wbsItemId에 평가기준이 있으면 수정
 * - WBS 항목당 하나의 평가기준만 존재
 *
 * Note: actionBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class UpsertWbsEvaluationCriteriaBodyDto {
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
  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
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
  @ApiProperty({
    description: '평가기준 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  id: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  criteria: string;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;
}

/**
 * WBS 평가기준 상세 DTO (WBS 항목 정보 포함)
 */
export class WbsEvaluationCriteriaDetailDto {
  @ApiProperty({
    description: '평가기준 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  id: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  criteria: string;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'WBS 항목 정보',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      wbsCode: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'string' },
      level: { type: 'number' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      progressPercentage: { type: 'string' },
    },
  })
  wbsItem?: {
    id: string;
    wbsCode: string;
    title: string;
    status: string;
    level: number;
    startDate: Date;
    endDate: Date;
    progressPercentage: string;
  } | null;
}

/**
 * WBS 항목별 평가기준 조회 응답 DTO
 */
export class WbsItemEvaluationCriteriaResponseDto {
  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 목록',
    type: [WbsEvaluationCriteriaDto],
  })
  criteria: WbsEvaluationCriteriaDto[];
}
