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
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExcluded?: boolean;
}

/**
 * 평가 대상자 맵핑 응답 DTO
 */
export class EvaluationTargetMappingResponseDto {
  @ApiProperty({ description: '맵핑 ID' })
  id!: string;

  @ApiProperty({ description: '평가기간 ID' })
  evaluationPeriodId!: string;

  @ApiProperty({ description: '직원 ID' })
  employeeId!: string;

  @ApiProperty({ description: '평가 대상 제외 여부' })
  isExcluded!: boolean;

  @ApiPropertyOptional({ description: '평가 대상 제외 사유' })
  excludeReason?: string | null;

  @ApiPropertyOptional({ description: '제외 처리자 ID' })
  excludedBy?: string | null;

  @ApiPropertyOptional({ description: '제외 처리 일시' })
  excludedAt?: Date | null;

  @ApiProperty({ description: '생성자 ID' })
  createdBy!: string;

  @ApiProperty({ description: '수정자 ID' })
  updatedBy!: string;

  @ApiProperty({ description: '생성 일시' })
  createdAt!: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: '삭제 일시' })
  deletedAt?: Date;

  @ApiProperty({ description: '버전' })
  version!: number;
}

/**
 * 평가 대상 여부 응답 DTO
 */
export class EvaluationTargetStatusResponseDto {
  @ApiProperty({ description: '평가 대상 여부' })
  isEvaluationTarget!: boolean;

  @ApiProperty({ description: '평가기간 ID' })
  evaluationPeriodId!: string;

  @ApiProperty({ description: '직원 ID' })
  employeeId!: string;
}
