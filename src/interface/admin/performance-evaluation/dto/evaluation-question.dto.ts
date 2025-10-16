import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator';

// ==================== 질문 그룹 관련 DTO ====================

/**
 * 질문 그룹 생성 DTO
 */
export class CreateQuestionGroupDto {
  @ApiProperty({
    description: '그룹명',
    example: '기본 평가 질문',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '기본 그룹 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 질문 그룹 수정 DTO
 */
export class UpdateQuestionGroupDto {
  @ApiPropertyOptional({
    description: '그룹명',
    example: '수정된 평가 질문',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '기본 그룹 여부',
    example: true,
  })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 질문 그룹 응답 DTO
 */
export class QuestionGroupResponseDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '그룹명',
    example: '기본 평가 질문',
  })
  name: string;

  @ApiProperty({
    description: '기본 그룹 여부',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: '삭제 가능 여부',
    example: true,
  })
  isDeletable: boolean;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

// ==================== 평가 질문 관련 DTO ====================

/**
 * 평가 질문 생성 DTO
 */
export class CreateEvaluationQuestionDto {
  @ApiProperty({
    description: '질문 내용',
    example: '프로젝트 수행 능력은 어떠한가요?',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Max(10)
  maxScore?: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 평가 질문 수정 DTO
 */
export class UpdateEvaluationQuestionDto {
  @ApiPropertyOptional({
    description: '질문 내용',
    example: '업무 수행 능력은 어떠한가요?',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    maximum: 10,
  })
  @IsOptional()
  @IsInt()
  @Max(10)
  maxScore?: number;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 평가 질문 응답 DTO
 */
export class EvaluationQuestionResponseDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '질문 내용',
    example: '프로젝트 수행 능력은 어떠한가요?',
  })
  text: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    nullable: true,
  })
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    nullable: true,
  })
  maxScore?: number;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

// ==================== 질문-그룹 매핑 관련 DTO ====================

/**
 * 그룹에 질문 추가 DTO
 */
export class AddQuestionToGroupDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: '표시 순서',
    example: 1,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  displayOrder: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * 질문 표시 순서 변경 DTO
 */
export class UpdateQuestionDisplayOrderDto {
  @ApiProperty({
    description: '새로운 표시 순서',
    example: 5,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  displayOrder: number;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}

/**
 * 질문-그룹 매핑 응답 DTO
 */
export class QuestionGroupMappingResponseDto {
  @ApiProperty({
    description: '매핑 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  groupId: string;

  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  questionId: string;

  @ApiProperty({
    description: '표시 순서',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

// ==================== 공통 응답 DTO ====================

/**
 * 작업 성공 응답 DTO
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: '생성/수정된 리소스 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '응답 메시지',
    example: '성공적으로 처리되었습니다.',
  })
  message: string;
}

