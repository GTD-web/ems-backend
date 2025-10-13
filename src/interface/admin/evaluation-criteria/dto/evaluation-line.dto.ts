import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 평가라인 필터 DTO
 */
export class EvaluationLineFilterDto {
  @ApiPropertyOptional({ description: '평가자 유형', example: 'primary' })
  @IsOptional()
  @IsEnum(['primary', 'secondary', 'additional'])
  evaluatorType?: string;

  @ApiPropertyOptional({ description: '필수 평가자 여부', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRequired?: boolean;

  @ApiPropertyOptional({ description: '자동 할당 여부', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAutoAssigned?: boolean;
}

/**
 * 직원-WBS별 평가라인 구성 요청 DTO
 */
export class ConfigureEmployeeWbsEvaluationLineDto {
  @ApiProperty({ description: '직원 ID', example: 'employee-uuid' })
  @IsString()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  @IsString()
  @IsUUID()
  wbsItemId: string;

  @ApiProperty({ description: '평가기간 ID', example: 'period-uuid' })
  @IsString()
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({ description: '생성자 ID', example: 'admin-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  createdBy?: string;
}

/**
 * 직원-WBS별 평가라인 구성 응답 DTO
 */
export class ConfigureEmployeeWbsEvaluationLineResponseDto {
  @ApiProperty({
    description: '결과 메시지',
    example: '평가라인 구성이 완료되었습니다.',
  })
  message: string;

  @ApiProperty({ description: '생성된 평가라인 수', example: 2 })
  createdLines: number;

  @ApiProperty({ description: '생성된 매핑 수', example: 5 })
  createdMappings: number;
}

/**
 * 평가라인 DTO
 */
export class EvaluationLineDto {
  @ApiProperty({ description: '평가라인 ID', example: 'line-uuid' })
  id: string;

  @ApiProperty({ description: '평가자 유형', example: 'primary' })
  evaluatorType: string;

  @ApiProperty({ description: '평가 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '필수 평가자 여부', example: true })
  isRequired: boolean;

  @ApiProperty({ description: '자동 할당 여부', example: false })
  isAutoAssigned: boolean;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

/**
 * 평가라인 매핑 DTO
 */
export class EvaluationLineMappingDto {
  @ApiProperty({ description: '매핑 ID', example: 'mapping-uuid' })
  id: string;

  @ApiProperty({ description: '피평가자 ID', example: 'employee-uuid' })
  employeeId: string;

  @ApiProperty({ description: '평가자 ID', example: 'evaluator-uuid' })
  evaluatorId: string;

  @ApiPropertyOptional({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  wbsItemId?: string;

  @ApiProperty({ description: '평가라인 ID', example: 'line-uuid' })
  evaluationLineId: string;

  @ApiPropertyOptional({ description: '생성자 ID', example: 'admin-uuid' })
  createdBy?: string;

  @ApiPropertyOptional({ description: '수정자 ID', example: 'admin-uuid' })
  updatedBy?: string;

  @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}

/**
 * 직원 평가라인 매핑 조회 응답 DTO
 */
export class EmployeeEvaluationLineMappingsResponseDto {
  @ApiProperty({ description: '직원 ID', example: 'employee-uuid' })
  employeeId: string;

  @ApiProperty({
    description: '평가라인 매핑 목록',
    type: [EvaluationLineMappingDto],
  })
  mappings: EvaluationLineMappingDto[];
}

/**
 * 평가자별 피평가자 조회 응답 DTO
 */
export class EvaluatorEmployeesResponseDto {
  @ApiProperty({ description: '평가자 ID', example: 'evaluator-uuid' })
  evaluatorId: string;

  @ApiProperty({
    description: '피평가자 목록',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', format: 'uuid' },
        wbsItemId: { type: 'string', format: 'uuid' },
        evaluationLineId: { type: 'string', format: 'uuid' },
        createdBy: { type: 'string', format: 'uuid' },
        updatedBy: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  employees: {
    employeeId: string;
    wbsItemId?: string;
    evaluationLineId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

/**
 * 직원 평가설정 통합 조회 응답 DTO
 */
export class EmployeeEvaluationSettingsResponseDto {
  @ApiProperty({ description: '직원 ID', example: 'employee-uuid' })
  employeeId: string;

  @ApiProperty({ description: '평가기간 ID', example: 'period-uuid' })
  periodId: string;

  @ApiProperty({
    description: '프로젝트 할당 목록',
    type: 'array',
    items: { type: 'object' },
  })
  projectAssignments: any[];

  @ApiProperty({
    description: 'WBS 할당 목록',
    type: 'array',
    items: { type: 'object' },
  })
  wbsAssignments: any[];

  @ApiProperty({
    description: '평가라인 매핑 목록',
    type: [EvaluationLineMappingDto],
  })
  evaluationLineMappings: EvaluationLineMappingDto[];
}

/**
 * 1차 평가자 구성 요청 DTO
 */
export class ConfigurePrimaryEvaluatorDto {
  @ApiProperty({ description: '1차 평가자 ID', example: 'evaluator-uuid' })
  @IsString()
  @IsUUID()
  evaluatorId: string;

  @ApiPropertyOptional({ description: '생성자 ID', example: 'admin-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  createdBy?: string;
}

/**
 * 2차 평가자 구성 요청 DTO
 */
export class ConfigureSecondaryEvaluatorDto {
  @ApiProperty({ description: '2차 평가자 ID', example: 'evaluator-uuid' })
  @IsString()
  @IsUUID()
  evaluatorId: string;

  @ApiPropertyOptional({ description: '생성자 ID', example: 'admin-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  createdBy?: string;
}

/**
 * 평가자 구성 응답 DTO
 */
export class ConfigureEvaluatorResponseDto {
  @ApiProperty({
    description: '결과 메시지',
    example: '평가라인 구성이 완료되었습니다.',
  })
  message: string;

  @ApiProperty({ description: '생성된 평가라인 수', example: 1 })
  createdLines: number;

  @ApiProperty({ description: '생성된 매핑 수', example: 1 })
  createdMappings: number;

  @ApiProperty({
    description: '평가라인 매핑 정보',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      employeeId: { type: 'string', format: 'uuid' },
      evaluatorId: { type: 'string', format: 'uuid' },
      wbsItemId: { type: 'string', format: 'uuid' },
      evaluationLineId: { type: 'string', format: 'uuid' },
    },
  })
  mapping: {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId: string;
    evaluationLineId: string;
  };
}
