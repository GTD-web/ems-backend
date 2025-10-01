import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 프로젝트 할당 생성 DTO
 */
export class CreateProjectAssignmentDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  periodId: string;
}

/**
 * 프로젝트 할당 수정 DTO
 */
export class UpdateProjectAssignmentDto {
  @ApiPropertyOptional({
    description: '할당 시작일',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '할당 종료일',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '할당 비율 (0-100)',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  assignmentRatio?: number;
}

/**
 * 프로젝트 할당 대량 생성 DTO
 */
export class BulkCreateProjectAssignmentDto {
  @ApiProperty({
    description: '프로젝트 할당 목록',
    type: [CreateProjectAssignmentDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '할당 목록은 최소 1개 이상이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProjectAssignmentDto)
  assignments: CreateProjectAssignmentDto[];
}

/**
 * 프로젝트 할당 필터 DTO
 */
export class ProjectAssignmentFilterDto {
  @ApiPropertyOptional({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 프로젝트 할당 응답 DTO
 */
export class ProjectAssignmentResponseDto {
  @ApiProperty({
    description: '할당 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  periodId: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T00:00:00.000Z',
  })
  assignedDate: Date;

  @ApiProperty({
    description: '할당자 ID',
    example: 'admin',
  })
  assignedBy: string;

  @ApiProperty({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  createdBy: string;

  @ApiProperty({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  updatedBy: string;

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

/**
 * 프로젝트 할당 목록 응답 DTO
 */
export class ProjectAssignmentListResponseDto {
  @ApiProperty({
    description: '프로젝트 할당 목록',
    type: [ProjectAssignmentResponseDto],
  })
  items: ProjectAssignmentResponseDto[];

  @ApiProperty({
    description: '총 개수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 10,
  })
  totalPages: number;
}
