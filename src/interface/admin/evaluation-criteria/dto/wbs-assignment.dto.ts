import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

/**
 * WBS 할당 생성 DTO
 */
export class CreateWbsAssignmentDto {
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
    description: '프로젝트 ID',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
  @IsString()
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsString()
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({
    description: '할당자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  assignedBy?: string;
}

/**
 * WBS 할당 필터 DTO
 */
export class WbsAssignmentFilterDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '직원 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
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
        employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
      },
      {
        employeeId: 'a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
        wbsItemId: 'b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
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
        id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
        employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
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
        id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
        employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
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
        id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
        employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
        assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
      },
    ],
  })
  wbsAssignments: any[];
}

/**
 * 할당되지 않은 WBS 항목 조회 Query DTO
 */
export class GetUnassignedWbsItemsDto {
  @ApiProperty({
    description: '프로젝트 ID (필수)',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
  @IsNotEmpty({ message: 'projectId는 필수입니다.' })
  @IsString()
  @IsUUID('4', { message: 'projectId는 유효한 UUID 형식이어야 합니다.' })
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID (필수)',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsNotEmpty({ message: 'periodId는 필수입니다.' })
  @IsString()
  @IsUUID('4', { message: 'periodId는 유효한 UUID 형식이어야 합니다.' })
  periodId: string;

  @ApiPropertyOptional({
    description: '직원 ID (선택사항)',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'employeeId는 유효한 UUID 형식이어야 합니다.' })
  employeeId?: string;
}

/**
 * 할당되지 않은 WBS 항목 응답 DTO
 */
export class UnassignedWbsItemsResponseDto {
  @ApiProperty({
    description: '할당되지 않은 WBS 항목 목록 (WBS 항목 전체 정보 포함)',
    type: 'array',
    example: [
      {
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        wbsCode: '1.1',
        title: '요구사항 분석',
        status: 'IN_PROGRESS',
        projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
        parentWbsId: null,
        level: 1,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        progressPercentage: '0.00',
      },
    ],
  })
  wbsItems: WbsItemDto[];
}

/**
 * WBS 할당 상세 조회 응답 DTO
 */
export class WbsAssignmentDetailResponseDto {
  @ApiProperty({
    description: 'WBS 할당 ID',
    example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  periodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  employeeId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
  projectId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '할당 날짜',
    example: '2024-10-01T09:00:00.000Z',
  })
  assignedDate: Date;

  @ApiProperty({
    description: '할당자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
  assignedBy: string;

  @ApiPropertyOptional({
    description: '표시 순서',
    example: 1,
    nullable: true,
  })
  displayOrder: number | null;

  @ApiProperty({
    description: '생성일시',
    example: '2024-10-01T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-10-01T09:00:00.000Z',
  })
  updatedAt: Date;

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

  @ApiPropertyOptional({
    description: '직원 정보',
    nullable: true,
  })
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  @ApiPropertyOptional({
    description: '부서 정보',
    nullable: true,
  })
  department: {
    id: string;
    name: string;
    code: string;
  } | null;

  @ApiPropertyOptional({
    description: '프로젝트 정보',
    nullable: true,
  })
  project: {
    id: string;
    name: string;
    code: string;
    status: string;
    startDate: Date;
    endDate: Date;
  } | null;

  @ApiPropertyOptional({
    description: 'WBS 항목 정보',
    nullable: true,
  })
  wbsItem: {
    id: string;
    wbsCode: string;
    title: string;
    status: string;
    level: number;
    startDate: Date;
    endDate: Date;
    progressPercentage: string;
  } | null;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    nullable: true,
  })
  period: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;

  @ApiPropertyOptional({
    description: '할당자 정보',
    nullable: true,
  })
  assignedByEmployee: {
    id: string;
    name: string;
    employeeNumber: string;
  } | null;
}

/**
 * WBS 할당 초기화 DTO
 */
export class ResetWbsAssignmentsDto {
  @ApiProperty({
    description: '초기화자 ID',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
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
