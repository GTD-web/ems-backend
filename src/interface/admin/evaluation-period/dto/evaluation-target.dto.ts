import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ToBoolean } from '@interface/decorators';

/**
 * 평가 대상자 등록 요청 DTO
 */
export class RegisterEvaluationTargetDto {
  @ApiProperty({
    description: '생성자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  createdBy!: string;
}

/**
 * 평가 대상자 대량 등록 요청 DTO
 */
export class RegisterBulkEvaluationTargetsDto {
  @ApiProperty({
    description: '직원 ID 목록',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds!: string[];

  @ApiProperty({
    description: '생성자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  createdBy!: string;
}

/**
 * 평가 대상 제외 요청 DTO
 */
export class ExcludeEvaluationTargetDto {
  @ApiProperty({
    description: '평가 대상 제외 사유',
    example: '휴직으로 인한 평가 제외',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  excludeReason!: string;

  @ApiProperty({
    description: '제외 처리자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  excludedBy!: string;
}

/**
 * 평가 대상 포함 요청 DTO
 */
export class IncludeEvaluationTargetDto {
  @ApiProperty({
    description: '포함 처리자 ID',
    example: 'admin-user-id',
  })
  @IsNotEmpty()
  @IsString()
  updatedBy!: string;
}

/**
 * 평가 대상자 조회 쿼리 DTO
 */
export class GetEvaluationTargetsQueryDto {
  @ApiPropertyOptional({
    description: '제외된 대상자 포함 여부',
    example: 'false',
    default: 'false',
  })
  @IsOptional()
  @ToBoolean(false) // 기본값 false
  @IsBoolean()
  includeExcluded?: boolean;
}

/**
 * 평가 대상자 맵핑 응답 DTO
 */
export class EvaluationTargetMappingResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId!: string;

  @ApiProperty({
    description: '직원 ID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  employeeId!: string;

  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded!: boolean;

  @ApiPropertyOptional({
    description: '평가 대상 제외 사유',
    example: null,
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리자 ID',
    example: null,
    nullable: true,
  })
  excludedBy?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    type: 'string',
    format: 'date-time',
    example: null,
    nullable: true,
  })
  excludedAt?: Date | null;

  @ApiProperty({
    description: '생성자 ID',
    example: 'admin-user-id',
  })
  createdBy!: string;

  @ApiProperty({
    description: '수정자 ID',
    example: 'admin-user-id',
  })
  updatedBy!: string;

  @ApiProperty({
    description: '생성 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '수정 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: '삭제 일시 (소프트 삭제)',
    type: 'string',
    format: 'date-time',
    example: null,
    nullable: true,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '버전 (낙관적 잠금용)',
    example: 1,
  })
  version!: number;
}

/**
 * 평가 대상 여부 응답 DTO
 */
export class EvaluationTargetStatusResponseDto {
  @ApiProperty({
    description: '평가 대상 여부',
    example: true,
  })
  isEvaluationTarget!: boolean;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  evaluationPeriodId!: string;

  @ApiProperty({
    description: '직원 ID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  employeeId!: string;
}
