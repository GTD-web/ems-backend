import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EvaluationPeriodInfoDto } from './employee-assigned-data.dto';
import { EmployeeInfoDto } from './employee-assigned-data.dto';
import { ExclusionInfoDto } from './employee-evaluation-period-status.dto';
import { PeerEvaluationInfoDto } from './employee-evaluation-period-status.dto';
import { FinalEvaluationInfoDto } from './employee-evaluation-period-status.dto';
import { AssignedProjectWithWbsDto } from './employee-assigned-data.dto';

/**
 * 평가자 정보 DTO
 */
export class EvaluatorInfoDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: '평가자명',
    example: '김평가',
  })
  name: string;

  @ApiProperty({
    description: '평가자 사번',
    example: 'EMP002',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이메일',
    example: 'kim@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
    nullable: true,
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '과장',
    nullable: true,
  })
  rankName?: string;
}

/**
 * 평가라인 정보 DTO (평가자 포함)
 */
export class EvaluationLineWithEvaluatorsDto {
  @ApiProperty({
    description: '평가라인 지정 완료 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: 'PRIMARY 라인 평가자 지정 여부',
    example: true,
  })
  hasPrimaryEvaluator: boolean;

  @ApiProperty({
    description: 'SECONDARY 라인 평가자 지정 여부',
    example: true,
  })
  hasSecondaryEvaluator: boolean;

  @ApiPropertyOptional({
    description: 'PRIMARY 평가자 정보',
    type: () => EvaluatorInfoDto,
    nullable: true,
  })
  @Type(() => EvaluatorInfoDto)
  primaryEvaluator?: EvaluatorInfoDto | null;

  @ApiProperty({
    description: 'SECONDARY 평가자 목록',
    type: () => [EvaluatorInfoDto],
  })
  @Type(() => EvaluatorInfoDto)
  secondaryEvaluators: EvaluatorInfoDto[];
}

/**
 * WBS 평가기준 상태 DTO
 */
export class WbsCriteriaStatusDto {
  @ApiProperty({
    description: 'WBS 평가기준 설정 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '전체 WBS 수',
    example: 5,
  })
  totalWbsCount: number;

  @ApiProperty({
    description: '평가기준이 설정된 WBS 수',
    example: 5,
  })
  wbsWithCriteriaCount: number;
}

/**
 * 성과 입력 상태 DTO
 */
export class PerformanceStatusDto {
  @ApiProperty({
    description: '성과 입력 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '전체 WBS 수',
    example: 5,
  })
  totalWbsCount: number;

  @ApiProperty({
    description: '성과가 입력된 WBS 수',
    example: 5,
  })
  completedCount: number;
}

/**
 * 자기평가 상태 DTO (점수/등급 포함)
 */
export class SelfEvaluationStatusDto {
  @ApiProperty({
    description: '자기평가 진행 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'in_progress',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '전체 WBS 자기평가 수',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: '완료된 WBS 자기평가 수',
    example: 3,
  })
  completedCount: number;

  @ApiPropertyOptional({
    description: '가중치 기반 자기평가 총점 (0-100)',
    example: 85.5,
    nullable: true,
  })
  totalScore: number | null;

  @ApiPropertyOptional({
    description: '평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등)',
    example: 'A-',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 하향평가 상태 DTO (점수/등급 포함)
 */
export class DownwardEvaluationStatusDto {
  @ApiProperty({
    description: '하향평가 통합 상태 (진행 상태 + 승인 상태)',
    enum: ['complete', 'in_progress', 'none', 'pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';

  @ApiProperty({
    description: '평가 대상 WBS 수',
    example: 5,
  })
  totalWbsCount: number;

  @ApiProperty({
    description: '완료된 평가 수',
    example: 3,
  })
  completedCount: number;

  @ApiProperty({
    description: '모든 하향평가가 제출되었는지 여부',
    example: true,
  })
  isSubmitted: boolean;

  @ApiPropertyOptional({
    description: '가중치 기반 하향평가 총점 (0-100)',
    example: 85.5,
    nullable: true,
  })
  totalScore: number | null;

  @ApiPropertyOptional({
    description: '평가기간 등급 기준에 따른 하향평가 등급 (예: S+, A-, B 등)',
    example: 'A-',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 프로젝트 목록 DTO (카운트 포함)
 */
export class ProjectsWithCountDto {
  @ApiProperty({
    description: '총 프로젝트 수',
    example: 2,
  })
  totalCount: number;

  @ApiProperty({
    description: '프로젝트 목록',
    type: () => [AssignedProjectWithWbsDto],
  })
  @Type(() => AssignedProjectWithWbsDto)
  items: AssignedProjectWithWbsDto[];
}

/**
 * 직원의 평가 현황 및 할당 데이터 통합 조회 응답 DTO
 */
export class EmployeeCompleteStatusResponseDto {
  @ApiProperty({
    description: '평가기간 정보',
    type: () => EvaluationPeriodInfoDto,
  })
  @Type(() => EvaluationPeriodInfoDto)
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({
    description: '직원 정보',
    type: () => EmployeeInfoDto,
  })
  @Type(() => EmployeeInfoDto)
  employee: EmployeeInfoDto;

  @ApiProperty({
    description: '평가 대상 여부 (제외되지 않고 삭제되지 않은 경우)',
    example: true,
  })
  isEvaluationTarget: boolean;

  @ApiProperty({
    description: '평가 대상 제외 정보',
    type: () => ExclusionInfoDto,
  })
  @Type(() => ExclusionInfoDto)
  exclusionInfo: ExclusionInfoDto;

  @ApiProperty({
    description: '평가라인 정보 (평가자 포함)',
    type: () => EvaluationLineWithEvaluatorsDto,
  })
  @Type(() => EvaluationLineWithEvaluatorsDto)
  evaluationLine: EvaluationLineWithEvaluatorsDto;

  @ApiProperty({
    description: 'WBS 평가기준 상태',
    type: () => WbsCriteriaStatusDto,
  })
  @Type(() => WbsCriteriaStatusDto)
  wbsCriteria: WbsCriteriaStatusDto;

  @ApiProperty({
    description: '성과 입력 상태',
    type: () => PerformanceStatusDto,
  })
  @Type(() => PerformanceStatusDto)
  performance: PerformanceStatusDto;

  @ApiProperty({
    description: '자기평가 상태 (점수/등급 포함)',
    type: () => SelfEvaluationStatusDto,
  })
  @Type(() => SelfEvaluationStatusDto)
  selfEvaluation: SelfEvaluationStatusDto;

  @ApiProperty({
    description: '1차 하향평가 상태 (점수/등급 포함)',
    type: () => DownwardEvaluationStatusDto,
  })
  @Type(() => DownwardEvaluationStatusDto)
  primaryDownwardEvaluation: DownwardEvaluationStatusDto;

  @ApiProperty({
    description: '2차 하향평가 상태 (점수/등급 포함)',
    type: () => DownwardEvaluationStatusDto,
  })
  @Type(() => DownwardEvaluationStatusDto)
  secondaryDownwardEvaluation: DownwardEvaluationStatusDto;

  @ApiProperty({
    description: '동료평가 진행 정보',
    type: () => PeerEvaluationInfoDto,
  })
  @Type(() => PeerEvaluationInfoDto)
  peerEvaluation: PeerEvaluationInfoDto;

  @ApiProperty({
    description: '최종평가 정보',
    type: () => FinalEvaluationInfoDto,
  })
  @Type(() => FinalEvaluationInfoDto)
  finalEvaluation: FinalEvaluationInfoDto;

  @ApiProperty({
    description: '프로젝트 목록 (카운트 포함)',
    type: () => ProjectsWithCountDto,
  })
  @Type(() => ProjectsWithCountDto)
  projects: ProjectsWithCountDto;
}
