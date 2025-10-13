import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 최종평가 저장 Body DTO (Upsert)
 */
export class UpsertFinalEvaluationBodyDto {
  @ApiProperty({
    description: '평가등급 (예: S, A, B, C, D)',
    example: 'A',
  })
  @IsString()
  evaluationGrade: string;

  @ApiProperty({
    description: '직무등급',
    enum: JobGrade,
    example: JobGrade.T2,
  })
  @IsEnum(JobGrade)
  jobGrade: JobGrade;

  @ApiProperty({
    description: '직무 상세등급',
    enum: JobDetailedGrade,
    example: JobDetailedGrade.N,
  })
  @IsEnum(JobDetailedGrade)
  jobDetailedGrade: JobDetailedGrade;

  @ApiPropertyOptional({
    description: '최종 평가 의견',
    example: '전반적으로 우수한 성과를 보였습니다.',
  })
  @IsString()
  @IsOptional()
  finalComments?: string;

  @ApiPropertyOptional({
    description: '작업자 ID (생성자 또는 수정자)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  actionBy?: string;
}

/**
 * 최종평가 수정 Body DTO
 */
export class UpdateFinalEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '평가등급',
    example: 'A',
  })
  @IsString()
  @IsOptional()
  evaluationGrade?: string;

  @ApiPropertyOptional({
    description: '직무등급',
    enum: JobGrade,
    example: JobGrade.T2,
  })
  @IsEnum(JobGrade)
  @IsOptional()
  jobGrade?: JobGrade;

  @ApiPropertyOptional({
    description: '직무 상세등급',
    enum: JobDetailedGrade,
    example: JobDetailedGrade.N,
  })
  @IsEnum(JobDetailedGrade)
  @IsOptional()
  jobDetailedGrade?: JobDetailedGrade;

  @ApiPropertyOptional({
    description: '최종 평가 의견',
    example: '전반적으로 우수한 성과를 보였습니다.',
  })
  @IsString()
  @IsOptional()
  finalComments?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}

/**
 * 최종평가 확정 Body DTO
 */
export class ConfirmFinalEvaluationBodyDto {
  @ApiProperty({
    description: '확정자 ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  confirmedBy: string;
}

/**
 * 최종평가 확정 취소 Body DTO
 */
export class CancelConfirmationBodyDto {
  @ApiProperty({
    description: '취소 작업자 ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  updatedBy: string;
}

/**
 * 최종평가 목록 조회 필터 DTO
 */
export class FinalEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '234e5678-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional({
    description: '평가등급',
    example: 'A',
  })
  @IsString()
  @IsOptional()
  evaluationGrade?: string;

  @ApiPropertyOptional({
    description: '직무등급',
    enum: JobGrade,
    example: JobGrade.T2,
  })
  @IsEnum(JobGrade)
  @IsOptional()
  jobGrade?: JobGrade;

  @ApiPropertyOptional({
    description: '직무 상세등급',
    enum: JobDetailedGrade,
    example: JobDetailedGrade.N,
  })
  @IsEnum(JobDetailedGrade)
  @IsOptional()
  jobDetailedGrade?: JobDetailedGrade;

  @ApiPropertyOptional({
    description: '확정된 평가만 조회',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  confirmedOnly?: boolean;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

/**
 * 최종평가 응답 DTO
 */
export class FinalEvaluationResponseDto {
  @ApiProperty({
    description: '최종평가 ID',
    example: '345e6789-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: '응답 메시지',
    example: '최종평가가 성공적으로 저장되었습니다.',
  })
  message: string;
}

/**
 * 최종평가 기본 정보 DTO
 */
export class FinalEvaluationBasicDto {
  @ApiProperty({
    description: '최종평가 ID',
    example: '345e6789-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '234e5678-e89b-12d3-a456-426614174001',
  })
  periodId: string;

  @ApiProperty({
    description: '평가등급',
    example: 'A',
  })
  evaluationGrade: string;

  @ApiProperty({
    description: '직무등급',
    enum: JobGrade,
    example: JobGrade.T2,
  })
  jobGrade: JobGrade;

  @ApiProperty({
    description: '직무 상세등급',
    enum: JobDetailedGrade,
    example: JobDetailedGrade.N,
  })
  jobDetailedGrade: JobDetailedGrade;

  @ApiPropertyOptional({
    description: '최종 평가 의견',
    example: '전반적으로 우수한 성과를 보였습니다.',
  })
  finalComments?: string;

  @ApiProperty({
    description: '확정 여부',
    example: true,
  })
  isConfirmed: boolean;

  @ApiPropertyOptional({
    description: '확정일시',
    example: '2024-01-15T09:00:00Z',
  })
  confirmedAt?: Date;

  @ApiPropertyOptional({
    description: '확정자 ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  confirmedBy?: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-10T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-12T14:30:00Z',
  })
  updatedAt: Date;
}

/**
 * 최종평가 상세 정보 DTO
 */
export class FinalEvaluationDetailDto extends FinalEvaluationBasicDto {
  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;
}

/**
 * 최종평가 목록 응답 DTO
 */
export class FinalEvaluationListResponseDto {
  @ApiProperty({
    description: '최종평가 목록',
    type: [FinalEvaluationBasicDto],
    example: [
      {
        id: '345e6789-e89b-12d3-a456-426614174002',
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        periodId: '234e5678-e89b-12d3-a456-426614174001',
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        finalComments: '전반적으로 우수한 성과를 보였습니다.',
        isConfirmed: true,
        confirmedAt: '2024-01-15T09:00:00Z',
        confirmedBy: '660e8400-e29b-41d4-a716-446655440001',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-12T14:30:00Z',
      },
    ],
  })
  evaluations: FinalEvaluationBasicDto[];

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
