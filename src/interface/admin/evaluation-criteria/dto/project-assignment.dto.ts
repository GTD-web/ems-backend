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

  @ApiPropertyOptional({
    description: '할당자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;
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

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'assignedDate',
    default: 'assignedDate',
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'assignedDate';

  @ApiPropertyOptional({
    description: '정렬 방향',
    example: 'DESC',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'DESC';
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

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '프로젝트 정보',
    type: () => ProjectInfoDto,
  })
  project?: ProjectInfoDto | null;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: '종료일',
    example: '2024-06-30T23:59:59.999Z',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '설명',
    example: '2024년 상반기 직원 평가를 진행합니다.',
    required: false,
  })
  description?: string;
}

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@company.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '부서 ID',
    example: 'DEPT001',
    required: false,
  })
  departmentId?: string;

  @ApiProperty({
    description: '부서명',
    example: '개발팀',
    required: false,
  })
  departmentName?: string;
}

/**
 * 프로젝트 정보 DTO
 */
export class ProjectInfoDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '루미르 통합 포털 개발',
  })
  name: string;

  @ApiProperty({
    description: '프로젝트 코드',
    example: 'PROJ001',
  })
  projectCode: string;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startDate?: Date;

  @ApiProperty({
    description: '종료일',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: '프로젝트 매니저 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  managerId?: string;
}

/**
 * 프로젝트 할당 상세 응답 DTO (관련 정보 포함)
 */
export class ProjectAssignmentDetailResponseDto {
  @ApiProperty({
    description: '할당 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T00:00:00.000Z',
  })
  assignedDate: Date;

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

  @ApiProperty({
    description: '삭제일시',
    example: null,
    required: false,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  createdBy?: string;

  @ApiProperty({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: EvaluationPeriodInfoDto,
  })
  evaluationPeriod?: EvaluationPeriodInfoDto | null;

  @ApiPropertyOptional({
    description: '직원 정보',
    type: EmployeeInfoDto,
  })
  employee?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '프로젝트 정보',
    type: ProjectInfoDto,
  })
  project?: ProjectInfoDto | null;

  @ApiPropertyOptional({
    description: '할당자 정보',
    type: EmployeeInfoDto,
  })
  assignedBy?: EmployeeInfoDto | null;
}

/**
 * 직원 프로젝트 목록 응답 DTO (프로젝트 정보만 포함)
 */
export class EmployeeProjectsResponseDto {
  @ApiProperty({
    description: '할당된 프로젝트 목록',
    type: [ProjectInfoDto],
  })
  projects: ProjectInfoDto[];
}

/**
 * 프로젝트 직원 목록 응답 DTO (직원 정보만 포함)
 */
export class ProjectEmployeesResponseDto {
  @ApiProperty({
    description: '할당된 직원 목록',
    type: [EmployeeInfoDto],
  })
  employees: EmployeeInfoDto[];
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
