import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 생성 DTO
 */
export class CreateWbsAssignmentDto {
  @ApiProperty({ description: '직원 ID', example: 'employee-uuid' })
  @IsString()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  @IsString()
  @IsUUID()
  wbsItemId: string;

  @ApiProperty({ description: '프로젝트 ID', example: 'project-uuid' })
  @IsString()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: '평가기간 ID', example: 'period-uuid' })
  @IsString()
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({ description: '할당자 ID', example: 'admin-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  assignedBy?: string;
}

/**
 * WBS 할당 필터 DTO
 */
export class WbsAssignmentFilterDto {
  @ApiPropertyOptional({ description: '평가기간 ID', example: 'period-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: '직원 ID', example: 'employee-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'WBS 항목 ID', example: 'wbs-item-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({ description: '프로젝트 ID', example: 'project-uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: '정렬 기준', example: 'createdAt' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({
    description: '정렬 방향',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * WBS 대량 할당 DTO
 */
export class BulkCreateWbsAssignmentDto {
  @ApiProperty({
    description: 'WBS 할당 목록',
    type: [CreateWbsAssignmentDto],
    example: [
      {
        employeeId: 'employee-uuid-1',
        wbsItemId: 'wbs-item-uuid-1',
        projectId: 'project-uuid-1',
        periodId: 'period-uuid',
        assignedBy: 'admin-uuid',
      },
      {
        employeeId: 'employee-uuid-2',
        wbsItemId: 'wbs-item-uuid-2',
        projectId: 'project-uuid-2',
        periodId: 'period-uuid',
        assignedBy: 'admin-uuid',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWbsAssignmentDto)
  assignments: CreateWbsAssignmentDto[];
}

/**
 * 직원 WBS 할당 응답 DTO
 */
export class EmployeeWbsAssignmentsResponseDto {
  @ApiProperty({
    description: 'WBS 할당 목록',
    type: 'array',
    example: [
      {
        id: 'assignment-uuid',
        employeeId: 'employee-uuid',
        wbsItemId: 'wbs-item-uuid',
        periodId: 'period-uuid',
        assignedBy: 'admin-uuid',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  })
  wbsAssignments: any[];
}

/**
 * 프로젝트 WBS 할당 응답 DTO
 */
export class ProjectWbsAssignmentsResponseDto {
  @ApiProperty({
    description: 'WBS 할당 목록',
    type: 'array',
    example: [
      {
        id: 'assignment-uuid',
        employeeId: 'employee-uuid',
        wbsItemId: 'wbs-item-uuid',
        periodId: 'period-uuid',
        assignedBy: 'admin-uuid',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  })
  wbsAssignments: any[];
}

/**
 * WBS 항목 할당된 직원 응답 DTO
 */
export class WbsItemAssignmentsResponseDto {
  @ApiProperty({
    description: 'WBS 할당 목록',
    type: 'array',
    example: [
      {
        id: 'assignment-uuid',
        employeeId: 'employee-uuid',
        wbsItemId: 'wbs-item-uuid',
        periodId: 'period-uuid',
        assignedBy: 'admin-uuid',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  })
  wbsAssignments: any[];
}

/**
 * 할당되지 않은 WBS 항목 응답 DTO
 */
export class UnassignedWbsItemsResponseDto {
  @ApiProperty({
    description: '할당되지 않은 WBS 항목 ID 목록',
    type: [String],
    example: ['wbs-item-uuid-1', 'wbs-item-uuid-2'],
  })
  wbsItemIds: string[];
}

/**
 * WBS 할당 초기화 DTO
 */
export class ResetWbsAssignmentsDto {
  @ApiProperty({ description: '초기화자 ID', example: 'admin-uuid' })
  @IsString()
  @IsUUID()
  resetBy: string;
}

/**
 * WBS 할당 순서 변경 Query DTO
 */
export class ChangeWbsAssignmentOrderQueryDto {
  @ApiProperty({
    description: '이동 방향 (up: 위로, down: 아래로)',
    example: OrderDirection.UP,
    enum: OrderDirection,
    enumName: 'OrderDirection',
  })
  @IsEnum(OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' })
  direction: OrderDirection;
}

/**
 * WBS 할당 순서 변경 Body DTO
 */
export class ChangeWbsAssignmentOrderBodyDto {
  @ApiPropertyOptional({
    description: '변경 수행자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}
