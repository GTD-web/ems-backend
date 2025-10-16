import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '@interface/decorators';

/**
 * 1차 하향평가 생성 Body DTO (경로 파라미터 제외)
 */
export class CreatePrimaryDownwardEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '평가자 ID (추후 요청자 ID로 자동 입력)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  selfEvaluationId?: string;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 2차 하향평가 생성 Body DTO (경로 파라미터 제외)
 */
export class CreateSecondaryDownwardEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '평가자 ID (추후 요청자 ID로 자동 입력)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  selfEvaluationId?: string;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 하향평가 수정 DTO
 */
export class UpdateDownwardEvaluationDto {
  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '수정된 하향평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;
}

/**
 * 하향평가 제출 DTO
 */
export class SubmitDownwardEvaluationDto {
  @ApiPropertyOptional({
    description: '평가자 ID (1차/2차 제출 시 필수)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '제출자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;
}

/**
 * 하향평가 필터 DTO
 */
export class DownwardEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  evaluateeId?: string;

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
    description: '평가 유형',
    example: 'primary',
    enum: ['primary', 'secondary'],
  })
  @IsOptional()
  @IsEnum(['primary', 'secondary'])
  evaluationType?: string;

  @ApiPropertyOptional({
    description: '완료 여부',
    example: false,
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 하향평가 기본 정보 DTO
 */
export class DownwardEvaluationBasicDto {
  @ApiProperty({
    description: '하향평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  periodId: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  selfEvaluationId?: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수)',
    example: 4,
  })
  downwardEvaluationScore?: number;

  @ApiProperty({
    description: '평가 유형',
    example: 'primary',
    enum: ['primary', 'secondary'],
  })
  evaluationType: string;

  @ApiProperty({
    description: '완료 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료 일시',
    example: '2024-01-15T11:00:00Z',
  })
  completedAt?: Date;

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
    example: '2024-01-15T12:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440007',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전 번호',
    example: 1,
  })
  version: number;
}

/**
 * 하향평가 응답 DTO
 */
export class DownwardEvaluationResponseDto {
  @ApiProperty({
    description: '하향평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '결과 메시지',
    example: '하향평가가 성공적으로 생성되었습니다.',
  })
  message: string;
}

/**
 * 하향평가 목록 응답 DTO
 */
export class DownwardEvaluationListResponseDto {
  @ApiProperty({
    description: '하향평가 목록',
    type: [DownwardEvaluationBasicDto],
  })
  evaluations: DownwardEvaluationBasicDto[];

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

/**
 * 하향평가 상세 응답 DTO
 * DownwardEvaluationBasicDto의 모든 필드를 포함합니다.
 */
export class DownwardEvaluationDetailResponseDto extends DownwardEvaluationBasicDto {
  // DownwardEvaluationBasicDto에 모든 필드가 포함되어 있으므로
  // 추가 필드 없이 그대로 사용
}
