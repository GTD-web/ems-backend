import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { WbsSelfEvaluationDto } from '../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import type { WbsSelfEvaluationMappingDto } from '../../../../domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.types';

/**
 * WBS 자기평가 생성 Body DTO (경로 파라미터 제외)
 */
export class CreateWbsSelfEvaluationBodyDto {
  @ApiProperty({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  @IsString()
  selfEvaluationContent: string;

  @ApiProperty({
    description: '자기평가 점수 (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  selfEvaluationScore: number;

  @ApiPropertyOptional({
    description: '추가 의견',
    example: '다음 분기에는 더 나은 성과를 위해 노력하겠습니다.',
  })
  @IsOptional()
  @IsString()
  additionalComments?: string;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * WBS 자기평가 수정 DTO
 */
export class UpdateWbsSelfEvaluationDto {
  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '수정된 자기평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '추가 의견',
    example: '수정된 추가 의견입니다.',
  })
  @IsOptional()
  @IsString()
  additionalComments?: string;
}

/**
 * WBS 자기평가 제출 DTO
 */
export class SubmitWbsSelfEvaluationDto {
  @ApiPropertyOptional({
    description: '제출자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;
}

/**
 * WBS 자기평가 필터 DTO
 */
export class WbsSelfEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 자기평가 기본 정보 DTO
 */
export class WbsSelfEvaluationBasicDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiProperty({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent: string;

  @ApiProperty({
    description: '자기평가 점수 (1-5)',
    example: 4,
  })
  selfEvaluationScore: number;

  @ApiPropertyOptional({
    description: '추가 의견',
    example: '다음 분기에는 더 나은 성과를 위해 노력하겠습니다.',
  })
  additionalComments?: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;
}

/**
 * 자기평가 매핑 기본 정보 DTO
 */
export class WbsSelfEvaluationMappingBasicDto {
  @ApiProperty({
    description: '매핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  employeeId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  periodId: string;

  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  selfEvaluationId: string;
}

/**
 * WBS 자기평가 응답 DTO
 */
export class WbsSelfEvaluationResponseDto {
  @ApiProperty({
    description: '자기평가 정보',
    type: WbsSelfEvaluationBasicDto,
  })
  evaluation: WbsSelfEvaluationBasicDto;

  @ApiProperty({
    description: '자기평가 매핑 정보',
    type: WbsSelfEvaluationMappingBasicDto,
  })
  evaluationMapping: WbsSelfEvaluationMappingBasicDto;
}

/**
 * WBS 자기평가 상세 응답 DTO
 */
export class WbsSelfEvaluationDetailResponseDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiProperty({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent: string;

  @ApiProperty({
    description: '자기평가 점수 (1-5)',
    example: 4,
  })
  selfEvaluationScore: number;

  @ApiPropertyOptional({
    description: '추가 의견',
    example: '다음 분기에는 더 나은 성과를 위해 노력하겠습니다.',
  })
  additionalComments?: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T11:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
      name: { type: 'string', example: '2024년 1분기 평가' },
      startDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00Z',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-03-31T23:59:59Z',
      },
      status: { type: 'string', example: 'ACTIVE' },
      description: { type: 'string', example: '2024년 1분기 성과평가 기간' },
    },
  })
  evaluationPeriod?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    description?: string;
  };

  @ApiPropertyOptional({
    description: '직원 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440006' },
      employeeNumber: { type: 'string', example: 'EMP001' },
      name: { type: 'string', example: '김철수' },
      email: { type: 'string', example: 'kim.chulsoo@company.com' },
      departmentId: { type: 'string', example: 'DEPT001' },
    },
  })
  employee?: {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentId: string;
  };

  @ApiPropertyOptional({
    description: 'WBS 항목 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440007' },
      name: { type: 'string', example: '시스템 개발' },
      description: { type: 'string', example: '고객 관리 시스템 개발 업무' },
      plannedHours: { type: 'number', example: 160 },
      startDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T09:00:00Z',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-03-31T18:00:00Z',
      },
      status: { type: 'string', example: 'IN_PROGRESS' },
    },
  })
  wbsItem?: {
    id: string;
    name: string;
    description?: string;
    plannedHours?: number;
    startDate?: Date;
    endDate?: Date;
    status: string;
  };
}

/**
 * 직원 자기평가 목록 응답 DTO
 */
export class EmployeeSelfEvaluationsResponseDto {
  @ApiProperty({
    description: '자기평가 목록',
    type: [WbsSelfEvaluationBasicDto],
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        evaluationDate: '2024-01-15T09:00:00Z',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 4,
        additionalComments: '다음 분기에는 더 나은 성과를 위해 노력하겠습니다.',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        version: 1,
      },
    ],
  })
  evaluations: WbsSelfEvaluationBasicDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;
}
