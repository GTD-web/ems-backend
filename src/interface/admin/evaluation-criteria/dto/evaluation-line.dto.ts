import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
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
  @ApiProperty({
    description: '직원 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsString()
  @IsUUID()
  wbsItemId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsString()
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
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
  @ApiProperty({
    description: '평가라인 ID',
    example: 'g2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  id: string;

  @ApiProperty({ description: '평가자 유형', example: 'primary' })
  evaluatorType: string;

  @ApiProperty({ description: '평가 순서', example: 1 })
  order: number;

  @ApiProperty({ description: '필수 평가자 여부', example: true })
  isRequired: boolean;

  @ApiProperty({ description: '자동 할당 여부', example: false })
  isAutoAssigned: boolean;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;
}

/**
 * 평가라인 매핑 DTO
 */
export class EvaluationLineMappingDto {
  @ApiProperty({
    description: '매핑 ID',
    example: 'h3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
  })
  id: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가자 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  evaluatorId: string;

  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId?: string;

  @ApiProperty({
    description: '평가라인 ID',
    example: 'g2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  })
  evaluationLineId: string;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
  updatedBy?: string;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;
}

/**
 * 직원 평가라인 매핑 조회 응답 DTO
 */
export class EmployeeEvaluationLineMappingsResponseDto {
  @ApiProperty({
    description: '직원 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
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
  @ApiProperty({
    description: '평가자 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
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
  @ApiProperty({
    description: '직원 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
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
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class ConfigurePrimaryEvaluatorDto {
  @ApiProperty({
    description: '1차 평가자 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  @IsString()
  @IsUUID()
  evaluatorId: string;
}

/**
 * 2차 평가자 구성 요청 DTO
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class ConfigureSecondaryEvaluatorDto {
  @ApiProperty({
    description: '2차 평가자 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  @IsString()
  @IsUUID()
  evaluatorId: string;
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

/**
 * 평가자 유형 쿼리 DTO
 */
export class EvaluatorTypeQueryDto {
  @ApiPropertyOptional({
    description: '평가자 유형 (primary: 1차만, secondary: 2차만, all: 전체)',
    enum: ['primary', 'secondary', 'all'],
    default: 'all',
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['primary', 'secondary', 'all'])
  type?: 'primary' | 'secondary' | 'all';
}

/**
 * 평가기간별 평가자 정보 DTO
 */
export class EvaluatorInfoDto {
  @ApiProperty({
    description: '평가자 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '평가자 이름',
    example: '홍길동',
  })
  evaluatorName: string;

  @ApiProperty({
    description: '부서명',
    example: '개발팀',
  })
  departmentName: string;

  @ApiProperty({
    description: '평가자 유형 (primary: 1차, secondary: 2차)',
    enum: ['primary', 'secondary'],
    example: 'primary',
  })
  evaluatorType: 'primary' | 'secondary';

  @ApiProperty({
    description: '담당 피평가자 수',
    example: 5,
  })
  evaluateeCount: number;
}

/**
 * 평가기간별 평가자 목록 조회 응답 DTO
 */
export class EvaluatorsByPeriodResponseDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  periodId: string;

  @ApiProperty({
    description: '조회된 평가자 유형',
    enum: ['primary', 'secondary', 'all'],
    example: 'all',
  })
  type: 'primary' | 'secondary' | 'all';

  @ApiProperty({
    description: '평가자 목록',
    type: [EvaluatorInfoDto],
  })
  evaluators: EvaluatorInfoDto[];
}

/**
 * @deprecated PrimaryEvaluatorInfoDto 대신 EvaluatorInfoDto 사용
 */
export class PrimaryEvaluatorInfoDto extends EvaluatorInfoDto {}

/**
 * @deprecated PrimaryEvaluatorsByPeriodResponseDto 대신 EvaluatorsByPeriodResponseDto 사용
 */
export class PrimaryEvaluatorsByPeriodResponseDto extends EvaluatorsByPeriodResponseDto {}
