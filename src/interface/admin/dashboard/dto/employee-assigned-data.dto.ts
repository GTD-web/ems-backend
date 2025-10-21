import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ==================== 사용자 할당 정보 응답 DTO ====================

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 인사평가',
  })
  name: string;

  @ApiProperty({
    description: '시작일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: '종료일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T23:59:59.000Z',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: '평가기간 상태',
    example: 'active',
    enum: ['waiting', 'active', 'completed', 'cancelled'],
  })
  status: string;

  @ApiPropertyOptional({
    description: '평가기간 설명',
    example: '2024년 상반기 종합 인사평가 기간입니다.',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: '평가 기준 설정 수동 허용 여부',
    example: false,
  })
  criteriaSettingEnabled: boolean;

  @ApiProperty({
    description: '자기 평가 설정 수동 허용 여부',
    example: false,
  })
  selfEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '하향/동료평가 설정 수동 허용 여부',
    example: false,
  })
  finalEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '자기평가 달성률 최대값 (%)',
    example: 120,
  })
  maxSelfEvaluationRate: number;
}

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '직원 번호',
    example: 'EMP-2024-001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong.gildong@company.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
    nullable: true,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '부서 ID',
    example: 'DEPT-001',
  })
  departmentId: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
    nullable: true,
  })
  departmentName?: string;

  @ApiProperty({
    description: '직원 상태',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'LEAVE', 'RESIGNED'],
  })
  status: string;
}

/**
 * WBS 평가기준 DTO
 */
export class WbsEvaluationCriterionDto {
  @ApiProperty({
    description: '평가기준 ID',
    example: '123e4567-e89b-12d3-a456-426614174012',
  })
  criterionId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '계획된 일정 내에 작업을 완료하고 품질 기준을 충족함',
  })
  criteria: string;

  @ApiProperty({
    description: '생성일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T09:00:00.000Z',
  })
  createdAt: Date;
}

/**
 * WBS 성과 DTO
 */
export class WbsPerformanceDto {
  @ApiPropertyOptional({
    description: '성과 내용',
    example: 'ERD 40개 테이블 설계 완료, 정규화 3단계까지 적용',
    nullable: true,
  })
  performanceResult?: string;

  @ApiProperty({
    description: '완료 여부',
    example: true,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료일',
    type: 'string',
    format: 'date-time',
    example: '2024-03-15T14:30:00.000Z',
    nullable: true,
  })
  completedAt?: Date;
}

/**
 * WBS 자기평가 DTO
 */
export class WbsSelfEvaluationDto {
  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174013',
    nullable: true,
  })
  selfEvaluationId?: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '계획 대비 110% 달성, 품질 기준 초과 달성',
    nullable: true,
  })
  evaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (1-5)',
    example: 4,
    nullable: true,
  })
  score?: number;

  @ApiProperty({
    description: '평가 완료 여부',
    example: true,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: '수정 가능 여부',
    example: true,
  })
  isEditable: boolean;

  @ApiPropertyOptional({
    description: '제출일',
    type: 'string',
    format: 'date-time',
    example: '2024-04-01T10:00:00.000Z',
    nullable: true,
  })
  submittedAt?: Date;
}

/**
 * WBS 하향평가 DTO
 */
export class WbsDownwardEvaluationDto {
  @ApiPropertyOptional({
    description: '하향평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174014',
    nullable: true,
  })
  downwardEvaluationId?: string;

  @ApiPropertyOptional({
    description: '평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  evaluatorId?: string;

  @ApiPropertyOptional({
    description: '평가자명',
    example: '김평가',
    nullable: true,
  })
  evaluatorName?: string;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '프로젝트를 훌륭하게 수행하였습니다.',
    nullable: true,
  })
  evaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (1-5)',
    example: 5,
    nullable: true,
  })
  score?: number;

  @ApiProperty({
    description: '평가 완료 여부',
    example: true,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: '수정 가능 여부',
    example: false,
  })
  isEditable: boolean;

  @ApiPropertyOptional({
    description: '제출일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-25T14:00:00.000Z',
    nullable: true,
  })
  submittedAt?: Date;
}

/**
 * 할당된 WBS 정보 DTO (평가기준 포함)
 */
export class AssignedWbsInfoDto {
  @ApiProperty({
    description: 'WBS ID',
    example: '123e4567-e89b-12d3-a456-426614174011',
  })
  wbsId: string;

  @ApiProperty({
    description: 'WBS명',
    example: 'DB 스키마 설계',
  })
  wbsName: string;

  @ApiProperty({
    description: 'WBS 코드',
    example: 'WBS-001',
  })
  wbsCode: string;

  @ApiProperty({
    description: '가중치 (%)',
    example: 20,
  })
  weight: number;

  @ApiProperty({
    description: '배정일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T09:00:00.000Z',
  })
  assignedAt: Date;

  @ApiProperty({
    description: 'WBS에 할당된 평가기준 목록',
    type: [WbsEvaluationCriterionDto],
  })
  @Type(() => WbsEvaluationCriterionDto)
  criteria: WbsEvaluationCriterionDto[];

  @ApiPropertyOptional({
    description: 'WBS 성과 정보',
    type: WbsPerformanceDto,
    nullable: true,
  })
  @Type(() => WbsPerformanceDto)
  performance?: WbsPerformanceDto | null;

  @ApiPropertyOptional({
    description: 'WBS 자기평가 정보',
    type: WbsSelfEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsSelfEvaluationDto)
  selfEvaluation?: WbsSelfEvaluationDto | null;

  @ApiPropertyOptional({
    description: 'WBS 1차 하향평가 정보 (PRIMARY 평가자가 작성)',
    type: WbsDownwardEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsDownwardEvaluationDto)
  primaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;

  @ApiPropertyOptional({
    description: 'WBS 2차 하향평가 정보 (SECONDARY 평가자가 작성)',
    type: WbsDownwardEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsDownwardEvaluationDto)
  secondaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;
}

/**
 * 할당된 프로젝트 정보 DTO (WBS 목록 포함)
 */
export class AssignedProjectWithWbsDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  projectId: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '신규 ERP 시스템 개발',
  })
  projectName: string;

  @ApiProperty({
    description: '프로젝트 코드',
    example: 'PROJ-2024-001',
  })
  projectCode: string;

  @ApiProperty({
    description: '배정일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T09:00:00.000Z',
  })
  assignedAt: Date;

  @ApiProperty({
    description: '프로젝트에 할당된 WBS 목록',
    type: [AssignedWbsInfoDto],
  })
  @Type(() => AssignedWbsInfoDto)
  wbsList: AssignedWbsInfoDto[];
}

/**
 * 사용자 할당 정보 조회 응답 DTO
 */
export class EmployeeAssignedDataResponseDto {
  @ApiProperty({
    description: '평가기간 정보',
    type: EvaluationPeriodInfoDto,
  })
  @Type(() => EvaluationPeriodInfoDto)
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({
    description: '직원 정보',
    type: EmployeeInfoDto,
  })
  @Type(() => EmployeeInfoDto)
  employee: EmployeeInfoDto;

  @ApiProperty({
    description:
      '프로젝트별 할당 정보 (WBS, 평가기준, 성과, 자기평가, 하향평가 포함)',
    type: [AssignedProjectWithWbsDto],
  })
  @Type(() => AssignedProjectWithWbsDto)
  projects: AssignedProjectWithWbsDto[];

  @ApiProperty({
    description: '데이터 요약',
    example: {
      totalProjects: 2,
      totalWbs: 5,
      completedPerformances: 5,
      completedSelfEvaluations: 3,
    },
  })
  summary: {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
  };
}

/**
 * 피평가자 할당 정보 (평가기간 제외)
 */
export class EvaluateeAssignedDataDto {
  @ApiProperty({
    description: '피평가자 정보',
    type: EmployeeInfoDto,
  })
  @Type(() => EmployeeInfoDto)
  employee: EmployeeInfoDto;

  @ApiProperty({
    description: '할당된 프로젝트 및 WBS 목록',
    type: [AssignedProjectWithWbsDto],
  })
  @Type(() => AssignedProjectWithWbsDto)
  projects: AssignedProjectWithWbsDto[];

  @ApiProperty({
    description: '할당 데이터 요약',
    example: {
      totalProjects: 2,
      totalWbs: 5,
      completedPerformances: 3,
      completedSelfEvaluations: 2,
    },
  })
  summary: {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
  };
}

/**
 * 담당자의 피평가자 할당 정보 조회 응답 DTO
 */
export class EvaluatorAssignedEmployeesDataResponseDto {
  @ApiProperty({
    description: '평가기간 정보',
    type: EvaluationPeriodInfoDto,
  })
  @Type(() => EvaluationPeriodInfoDto)
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({
    description: '평가자 정보',
    type: EmployeeInfoDto,
  })
  @Type(() => EmployeeInfoDto)
  evaluator: EmployeeInfoDto;

  @ApiProperty({
    description: '피평가자 할당 정보 (평가기간 제외, 최상위에 이미 존재)',
    type: EvaluateeAssignedDataDto,
  })
  @Type(() => EvaluateeAssignedDataDto)
  evaluatee: EvaluateeAssignedDataDto;
}
