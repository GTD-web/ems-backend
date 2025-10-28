import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type {
  EvaluationPeriodInfo,
  EmployeeInfo,
  AssignedProjectWithWbs,
  AssignedWbsInfo,
  WbsEvaluationCriterion,
  WbsPerformance,
  WbsSelfEvaluationInfo,
  WbsDownwardEvaluationInfo,
  EmployeeAssignedDataResult,
  DeliverableInfo,
  EditableStatus,
} from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/types';

// summary 타입은 Context의 EmployeeAssignedDataResult['summary'] 타입과 호환
type AssignmentSummary = EmployeeAssignedDataResult['summary'];
type EvaluationScore = AssignmentSummary['selfEvaluation'];

// ==================== 사용자 할당 정보 응답 DTO ====================

/**
 * 평가기간 정보 DTO
 * Context의 EvaluationPeriodInfo 타입과 일치해야 함
 */
export class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
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

  @ApiProperty({
    description: '평가기간 상태',
    type: 'string',
    example: 'active',
    enum: ['waiting', 'active', 'completed', 'cancelled'],
  })
  status: string;

  @ApiProperty({
    description: '평가 기준 설정 수동 허용 여부',
    type: 'boolean',
    example: false,
  })
  criteriaSettingEnabled: boolean;

  @ApiProperty({
    description: '자기 평가 설정 수동 허용 여부',
    type: 'boolean',
    example: false,
  })
  selfEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '하향/동료평가 설정 수동 허용 여부',
    type: 'boolean',
    example: false,
  })
  finalEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '자기평가 달성률 최대값 (%)',
    example: 120,
    type: 'number',
  })
  maxSelfEvaluationRate: number;

  @ApiProperty({
    description: '종료일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T23:59:59.000Z',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: '평가기간 설명',
    type: 'string',
    example: '2024년 상반기 종합 인사평가 기간입니다.',
    nullable: true,
  })
  description?: string;
}

/**
 * 직원 정보 DTO
 * Context의 EmployeeInfo 타입과 일치해야 함
 */
export class EmployeeInfoDto implements EmployeeInfo {
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

  @ApiProperty({
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

  @ApiProperty({
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
 * 수정가능 상태 DTO
 * Context의 EditableStatus 타입과 일치해야 함
 */
export class EditableStatusDto implements EditableStatus {
  @ApiProperty({
    description: '자기평가 수정가능 여부',
    example: true,
  })
  isSelfEvaluationEditable: boolean;

  @ApiProperty({
    description: '1차평가 수정가능 여부',
    example: false,
  })
  isPrimaryEvaluationEditable: boolean;

  @ApiProperty({
    description: '2차평가 수정가능 여부',
    example: false,
  })
  isSecondaryEvaluationEditable: boolean;
}

/**
 * WBS 평가기준 DTO
 * Context의 WbsEvaluationCriterion 타입과 일치해야 함
 */
export class WbsEvaluationCriterionDto implements WbsEvaluationCriterion {
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
 * Context의 WbsPerformance 타입과 일치해야 함
 */
export class WbsPerformanceDto implements WbsPerformance {
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

  @ApiProperty({
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
 * Context의 WbsSelfEvaluationInfo 타입과 일치해야 함
 */
export class WbsSelfEvaluationDto implements WbsSelfEvaluationInfo {
  @ApiProperty({
    description: '자기평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174013',
    nullable: true,
  })
  selfEvaluationId?: string;

  @ApiProperty({
    description: '자기평가 내용',
    example: '계획 대비 110% 달성, 품질 기준 초과 달성',
    nullable: true,
  })
  evaluationContent?: string;

  @ApiProperty({
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

  @ApiProperty({
    description: '제출일',
    type: 'string',
    format: 'date-time',
    example: '2024-04-01T10:00:00.000Z',
    nullable: true,
  })
  submittedAt?: Date;
}

/**
 * 산출물 정보 DTO
 * Context의 DeliverableInfo 타입과 일치해야 함
 */
export class DeliverableInfoDto implements DeliverableInfo {
  @ApiProperty({
    description: '산출물 ID',
    example: '123e4567-e89b-12d3-a456-426614174020',
  })
  id: string;

  @ApiProperty({
    description: '산출물명',
    example: 'ERD 설계서',
  })
  name: string;

  @ApiPropertyOptional({
    description: '산출물 설명',
    example: '데이터베이스 스키마 설계 문서',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: '산출물 유형',
    example: 'document',
    enum: ['document', 'code', 'design', 'report', 'presentation', 'other'],
  })
  type: string;

  @ApiPropertyOptional({
    description: '파일 경로',
    example: '/uploads/erd_schema_v1.pdf',
    nullable: true,
  })
  filePath?: string;

  @ApiPropertyOptional({
    description: '담당 직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  employeeId?: string;

  @ApiPropertyOptional({
    description: '매핑일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-05T09:00:00.000Z',
    nullable: true,
  })
  mappedDate?: Date;

  @ApiPropertyOptional({
    description: '매핑자 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  mappedBy?: string;

  @ApiProperty({
    description: '활성 상태',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '생성일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-05T09:00:00.000Z',
  })
  createdAt: Date;
}

/**
 * WBS 하향평가 DTO
 * Context의 WbsDownwardEvaluationInfo 타입과 일치해야 함
 */
export class WbsDownwardEvaluationDto implements WbsDownwardEvaluationInfo {
  @ApiProperty({
    description: '하향평가 ID',
    example: '123e4567-e89b-12d3-a456-426614174014',
    nullable: true,
  })
  downwardEvaluationId?: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    nullable: true,
  })
  evaluatorId?: string;

  @ApiProperty({
    description: '평가자명',
    example: '김평가',
    nullable: true,
  })
  evaluatorName?: string;

  @ApiProperty({
    description: '하향평가 내용',
    example: '프로젝트를 훌륭하게 수행하였습니다.',
    nullable: true,
  })
  evaluationContent?: string;

  @ApiProperty({
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

  @ApiProperty({
    description: '제출일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-25T14:00:00.000Z',
    nullable: true,
  })
  submittedAt?: Date;
}

/**
 * 할당된 WBS 정보 DTO (평가기준, 산출물 포함)
 * Context의 AssignedWbsInfo 타입과 일치해야 함
 */
export class AssignedWbsInfoDto implements AssignedWbsInfo {
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

  @ApiProperty({
    description: 'WBS 성과 정보',
    type: WbsPerformanceDto,
    nullable: true,
  })
  @Type(() => WbsPerformanceDto)
  performance?: WbsPerformanceDto | null;

  @ApiProperty({
    description: 'WBS 자기평가 정보',
    type: WbsSelfEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsSelfEvaluationDto)
  selfEvaluation?: WbsSelfEvaluationDto | null;

  @ApiProperty({
    description: 'WBS 1차 하향평가 정보 (PRIMARY 평가자가 작성)',
    type: WbsDownwardEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsDownwardEvaluationDto)
  primaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;

  @ApiProperty({
    description: 'WBS 2차 하향평가 정보 (SECONDARY 평가자가 작성)',
    type: WbsDownwardEvaluationDto,
    nullable: true,
  })
  @Type(() => WbsDownwardEvaluationDto)
  secondaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;

  @ApiProperty({
    description: 'WBS에 연결된 산출물 목록',
    type: [DeliverableInfoDto],
  })
  @Type(() => DeliverableInfoDto)
  deliverables: DeliverableInfoDto[];
}

/**
 * 프로젝트 매니저 정보 DTO
 */
export class ProjectManagerDto {
  @ApiProperty({
    description: 'PM 직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174015',
  })
  id: string;

  @ApiProperty({
    description: 'PM 이름',
    example: '박프로',
  })
  name: string;
}

/**
 * 평가 점수 및 등급 정보 DTO
 * Context의 EvaluationScore 타입과 일치해야 함
 */
export class EvaluationScoreDto implements EvaluationScore {
  @ApiProperty({
    description: '총점 (0-100 범위, 미완료 시 null)',
    example: 75.5,
    nullable: true,
  })
  totalScore: number | null;

  @ApiProperty({
    description: '등급 (S, A, B, C, D 등, 미완료 시 null)',
    example: 'C',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 할당 데이터 요약 DTO
 * Context의 AssignmentSummary 타입과 일치해야 함
 */
export class AssignmentSummaryDto implements AssignmentSummary {
  @ApiProperty({
    description: '할당된 총 프로젝트 수',
    example: 2,
  })
  totalProjects: number;

  @ApiProperty({
    description: '할당된 총 WBS 수',
    example: 5,
  })
  totalWbs: number;

  @ApiProperty({
    description: '완료된 성과 입력 수',
    example: 5,
  })
  completedPerformances: number;

  @ApiProperty({
    description: '완료된 자기평가 수',
    example: 3,
  })
  completedSelfEvaluations: number;

  @ApiProperty({
    description: '자기평가 총점 및 등급',
    type: EvaluationScoreDto,
  })
  @Type(() => EvaluationScoreDto)
  selfEvaluation: EvaluationScoreDto;

  @ApiProperty({
    description: '1차 하향평가 총점 및 등급',
    type: EvaluationScoreDto,
  })
  @Type(() => EvaluationScoreDto)
  primaryDownwardEvaluation: EvaluationScoreDto;

  @ApiProperty({
    description: '2차 하향평가 총점 및 등급',
    type: EvaluationScoreDto,
  })
  @Type(() => EvaluationScoreDto)
  secondaryDownwardEvaluation: EvaluationScoreDto;
}

/**
 * 할당된 프로젝트 정보 DTO (WBS 목록 포함)
 * Context의 AssignedProjectWithWbs 타입과 일치해야 함
 */
export class AssignedProjectWithWbsDto implements AssignedProjectWithWbs {
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
    description: '프로젝트 매니저 정보',
    type: ProjectManagerDto,
    nullable: true,
  })
  @Type(() => ProjectManagerDto)
  projectManager?: ProjectManagerDto | null;

  @ApiProperty({
    description: '프로젝트에 할당된 WBS 목록',
    type: [AssignedWbsInfoDto],
  })
  @Type(() => AssignedWbsInfoDto)
  wbsList: AssignedWbsInfoDto[];
}

/**
 * 사용자 할당 정보 조회 응답 DTO
 * Context의 EmployeeAssignedDataResult 타입과 일치해야 함
 */
export class EmployeeAssignedDataResponseDto
  implements EmployeeAssignedDataResult
{
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
    description: '수정가능 상태 정보',
    type: EditableStatusDto,
  })
  @Type(() => EditableStatusDto)
  editableStatus: EditableStatusDto;

  @ApiProperty({
    description:
      '프로젝트별 할당 정보 (WBS, 평가기준, 성과, 자기평가, 하향평가 포함)',
    type: [AssignedProjectWithWbsDto],
  })
  @Type(() => AssignedProjectWithWbsDto)
  projects: AssignedProjectWithWbsDto[];

  @ApiProperty({
    description:
      '데이터 요약 (프로젝트, WBS 개수, 완료 현황, 평가 점수 및 등급)',
    type: AssignmentSummaryDto,
  })
  @Type(() => AssignmentSummaryDto)
  summary: AssignmentSummaryDto;
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
    description: '수정가능 상태 정보',
    type: EditableStatusDto,
  })
  @Type(() => EditableStatusDto)
  editableStatus: EditableStatusDto;

  @ApiProperty({
    description: '할당된 프로젝트 및 WBS 목록',
    type: [AssignedProjectWithWbsDto],
  })
  @Type(() => AssignedProjectWithWbsDto)
  projects: AssignedProjectWithWbsDto[];

  @ApiProperty({
    description:
      '할당 데이터 요약 (프로젝트, WBS 개수, 완료 현황, 평가 점수 및 등급)',
    type: AssignmentSummaryDto,
  })
  @Type(() => AssignmentSummaryDto)
  summary: AssignmentSummaryDto;
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
