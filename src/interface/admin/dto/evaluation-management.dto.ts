import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 페이징 쿼리 DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 페이징 응답 DTO
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  items: T[];

  @ApiProperty({ description: '전체 데이터 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  hasPrev: boolean;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

/**
 * 등급 구간 생성 DTO (API용)
 */
export class CreateGradeRangeApiDto {
  @ApiProperty({
    description: '등급',
    example: 'S',
  })
  @IsString()
  grade: string;

  @ApiProperty({
    description: '최소 범위',
    example: 90,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  minRange: number;

  @ApiProperty({
    description: '최대 범위',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRange: number;
}

/**
 * 평가 기준 생성 DTO (API용)
 */
export class CreateEvaluationCriteriaApiDto {
  @ApiProperty({
    description: '평가 기준명',
    example: '업무 성과',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '평가 기준 설명',
    example: '담당 업무의 목표 달성도와 품질을 평가합니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '가중치 (%)',
    example: 40,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;
}

/**
 * 평가 기간 생성 API DTO
 */
export class CreateEvaluationPeriodApiDto {
  @ApiProperty({
    description: '평가 기간명',
    example: '2024년 상반기 평가',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '평가 기간 시작일',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '하향/동료평가 마감일',
    example: '2024-06-30',
  })
  @IsDateString()
  peerEvaluationDeadline: string;

  @ApiPropertyOptional({
    description: '평가 기간 설명',
    example: '2024년 상반기 직원 평가를 진행합니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '자기평가 달성률 최대값 (%)',
    example: 120,
    minimum: 100,
    maximum: 200,
    default: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(200)
  maxSelfEvaluationRate?: number;

  @ApiPropertyOptional({
    description: '등급 구간 설정',
    type: [CreateGradeRangeApiDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeRangeApiDto)
  gradeRanges?: CreateGradeRangeApiDto[];

  @ApiPropertyOptional({
    description: '평가 기준 설정',
    type: [CreateEvaluationCriteriaApiDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationCriteriaApiDto)
  evaluationCriteria?: CreateEvaluationCriteriaApiDto[];
}

/**
 * 평가 기간 기본 정보 수정 API DTO
 */
export class UpdateEvaluationPeriodBasicApiDto {
  @ApiPropertyOptional({
    description: '평가 기간명',
    example: '2024년 상반기 평가 (수정)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '평가 기간 설명',
    example: '수정된 평가 기간 설명',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '자기평가 달성률 최대값 (%)',
    example: 130,
    minimum: 100,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(200)
  maxSelfEvaluationRate?: number;
}

/**
 * 평가 기간 일정 수정 API DTO
 */
export class UpdateEvaluationPeriodScheduleApiDto {
  @ApiPropertyOptional({
    description: '평가 기간 종료일',
    example: '2024-07-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '평가 설정 마감일',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  evaluationSetupDeadline?: string;

  @ApiPropertyOptional({
    description: '성과 입력 마감일',
    example: '2024-05-31',
  })
  @IsOptional()
  @IsDateString()
  performanceDeadline?: string;

  @ApiPropertyOptional({
    description: '자기평가 마감일',
    example: '2024-06-15',
  })
  @IsOptional()
  @IsDateString()
  selfEvaluationDeadline?: string;

  @ApiPropertyOptional({
    description: '하향/동료평가 마감일',
    example: '2024-06-30',
  })
  @IsOptional()
  @IsDateString()
  peerEvaluationDeadline?: string;
}

/**
 * 등급 구간 수정 API DTO
 */
export class UpdateGradeRangesApiDto {
  @ApiProperty({
    description: '등급 구간 목록',
    type: [CreateGradeRangeApiDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeRangeApiDto)
  gradeRanges: CreateGradeRangeApiDto[];
}

/**
 * 수동 허용 설정 DTO
 */
export class ManualPermissionSettingDto {
  @ApiProperty({
    description: '수동 허용 여부',
    example: true,
  })
  allowManualSetting: boolean;
}

/**
 * 전체 수동 허용 설정 API DTO
 */
export class UpdateManualSettingPermissionsApiDto {
  @ApiPropertyOptional({
    description: '평가 기준 설정 수동 허용',
    example: true,
  })
  @IsOptional()
  allowCriteriaManualSetting?: boolean;

  @ApiPropertyOptional({
    description: '자기평가 설정 수동 허용',
    example: true,
  })
  @IsOptional()
  allowSelfEvaluationManualSetting?: boolean;

  @ApiPropertyOptional({
    description: '최종평가 설정 수동 허용',
    example: false,
  })
  @IsOptional()
  allowFinalEvaluationManualSetting?: boolean;
}

/**
 * API 응답 기본 형태
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '응답 메시지' })
  message: string;

  @ApiProperty({ description: '응답 데이터' })
  data?: T;

  @ApiProperty({ description: '오류 정보' })
  error?: any;

  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }
}
