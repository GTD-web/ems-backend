import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 직원 평가기간 현황 조회 DTO
 */
export class GetEmployeeEvaluationPeriodStatusDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;
}

// ==================== 응답 DTO ====================

/**
 * 평가기간 수동 설정 상태 DTO
 */
export class EvaluationPeriodManualSettingsDto {
  @ApiProperty({
    description: '평가 기준 설정 수동 허용 여부',
    example: true,
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
}

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
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '평가 기간 상태',
    example: 'IN_PROGRESS',
  })
  status: string;

  @ApiProperty({
    description: '현재 평가 단계',
    example: 'SELF_EVALUATION',
  })
  currentPhase: string;

  @ApiProperty({
    description: '평가 시작일',
    type: 'string',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: '평가 종료일',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T23:59:59.999Z',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: '수동 설정 상태 정보',
    type: () => EvaluationPeriodManualSettingsDto,
  })
  manualSettings: EvaluationPeriodManualSettingsDto;
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
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '직원 사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
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
    example: '대리',
    nullable: true,
  })
  rankName?: string;
}

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
 * 평가항목 설정 정보 DTO
 */
export class EvaluationCriteriaInfoDto {
  @ApiProperty({
    description: '평가항목 설정 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '할당된 프로젝트 수',
    example: 2,
  })
  assignedProjectCount: number;

  @ApiProperty({
    description: '할당된 WBS 수',
    example: 5,
  })
  assignedWbsCount: number;
}

/**
 * WBS 평가기준 설정 정보 DTO
 */
export class WbsCriteriaInfoDto {
  @ApiProperty({
    description: 'WBS 평가기준 설정 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '평가기준이 설정된 WBS 수',
    example: 5,
  })
  wbsWithCriteriaCount: number;
}

/**
 * 평가라인 지정 정보 DTO
 */
export class EvaluationLineInfoDto {
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
}

/**
 * 성과 입력 정보 DTO
 */
export class PerformanceInputDto {
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
  inputCompletedCount: number;
}

/**
 * 자기평가 진행 정보 DTO
 */
export class SelfEvaluationInfoDto {
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
  totalMappingCount: number;

  @ApiProperty({
    description: '완료된 WBS 자기평가 수',
    example: 3,
  })
  completedMappingCount: number;

  @ApiProperty({
    description: '피평가자가 1차 평가자에게 자기평가 제출 완료 여부',
    example: true,
  })
  isSubmittedToEvaluator: boolean;

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
 * 하향평가 1차 정보 DTO
 */
export class PrimaryDownwardEvaluationDto {
  @ApiPropertyOptional({
    description: '1차 평가자 정보',
    type: () => EvaluatorInfoDto,
    nullable: true,
  })
  evaluator: EvaluatorInfoDto | null;

  @ApiProperty({
    description: '1차 하향평가 진행 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'in_progress',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '평가 대상 WBS 수',
    example: 5,
  })
  assignedWbsCount: number;

  @ApiProperty({
    description: '완료된 평가 수',
    example: 3,
  })
  completedEvaluationCount: number;

  @ApiPropertyOptional({
    description: '가중치 기반 1차 하향평가 총점 (0-100)',
    example: 85.5,
    nullable: true,
  })
  totalScore: number | null;

  @ApiPropertyOptional({
    description:
      '평가기간 등급 기준에 따른 1차 하향평가 등급 (예: S+, A-, B 등)',
    example: 'A-',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 2차 평가자 정보 DTO
 */
export class SecondaryEvaluatorDto {
  @ApiProperty({
    description: '2차 평가자 정보',
    type: () => EvaluatorInfoDto,
  })
  evaluator: EvaluatorInfoDto;

  @ApiProperty({
    description: '2차 하향평가 진행 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '평가 대상 WBS 수',
    example: 5,
  })
  assignedWbsCount: number;

  @ApiProperty({
    description: '완료된 평가 수',
    example: 5,
  })
  completedEvaluationCount: number;
}

/**
 * 하향평가 2차 정보 DTO
 */
export class SecondaryDownwardEvaluationDto {
  @ApiProperty({
    description: '2차 평가자 목록',
    type: () => [SecondaryEvaluatorDto],
  })
  evaluators: SecondaryEvaluatorDto[];

  @ApiPropertyOptional({
    description: '가중치 기반 2차 하향평가 총점 (0-100)',
    example: 82.3,
    nullable: true,
  })
  totalScore: number | null;

  @ApiPropertyOptional({
    description:
      '평가기간 등급 기준에 따른 2차 하향평가 등급 (예: S+, A-, B 등)',
    example: 'B+',
    nullable: true,
  })
  grade: string | null;
}

/**
 * 하향평가 진행 정보 DTO
 */
export class DownwardEvaluationInfoDto {
  @ApiProperty({
    description: '1차 하향평가 정보',
    type: () => PrimaryDownwardEvaluationDto,
  })
  primary: PrimaryDownwardEvaluationDto;

  @ApiProperty({
    description: '2차 하향평가 정보',
    type: () => SecondaryDownwardEvaluationDto,
  })
  secondary: SecondaryDownwardEvaluationDto;
}

/**
 * 동료평가 진행 정보 DTO
 */
export class PeerEvaluationInfoDto {
  @ApiProperty({
    description: '동료평가 진행 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'in_progress',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiProperty({
    description: '총 동료평가 요청 수',
    example: 3,
  })
  totalRequestCount: number;

  @ApiProperty({
    description: '완료된 동료평가 수',
    example: 1,
  })
  completedRequestCount: number;
}

/**
 * 최종평가 정보 DTO
 */
export class FinalEvaluationInfoDto {
  @ApiProperty({
    description: '최종평가 진행 상태',
    enum: ['complete', 'in_progress', 'none'],
    example: 'complete',
  })
  status: 'complete' | 'in_progress' | 'none';

  @ApiPropertyOptional({
    description: '평가등급 (S, A, B, C, D 등)',
    example: 'A',
    nullable: true,
  })
  evaluationGrade: string | null;

  @ApiPropertyOptional({
    description: '직무등급 (T1, T2, T3)',
    example: 'T2',
    nullable: true,
  })
  jobGrade: string | null;

  @ApiPropertyOptional({
    description: '직무 상세등급 (u, n, a)',
    example: 'n',
    nullable: true,
  })
  jobDetailedGrade: string | null;

  @ApiProperty({
    description: '확정 여부',
    example: true,
  })
  isConfirmed: boolean;

  @ApiPropertyOptional({
    description: '확정일시',
    type: 'string',
    format: 'date-time',
    example: '2024-06-30T15:00:00.000Z',
    nullable: true,
  })
  confirmedAt: Date | null;
}

/**
 * 평가 대상 제외 정보 DTO
 */
export class ExclusionInfoDto {
  @ApiProperty({
    description: '평가 대상 제외 여부',
    example: false,
  })
  isExcluded: boolean;

  @ApiPropertyOptional({
    description: '제외 사유',
    example: '휴직',
    nullable: true,
  })
  excludeReason?: string | null;

  @ApiPropertyOptional({
    description: '제외 처리 일시',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  excludedAt?: Date | null;
}

/**
 * 2차 평가자별 단계 승인 상태 정보 DTO
 */
export class SecondaryEvaluationStatusDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '평가자 이름',
    example: '홍길동',
  })
  evaluatorName: string;

  @ApiProperty({
    description: '평가자 사번',
    example: 'EMP001',
  })
  evaluatorEmployeeNumber: string;

  @ApiProperty({
    description: '평가자 이메일',
    example: 'hong@example.com',
  })
  evaluatorEmail: string;

  @ApiProperty({
    description: '확인 상태',
    enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'pending',
  })
  status: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';

  @ApiPropertyOptional({
    description: '승인자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  approvedBy: string | null;

  @ApiPropertyOptional({
    description: '승인 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  approvedAt: Date | null;

  @ApiPropertyOptional({
    description: '재작성 요청 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  revisionRequestId: string | null;

  @ApiPropertyOptional({
    description: '재작성 요청 코멘트',
    example: '평가 내용을 보완해 주세요.',
    nullable: true,
  })
  revisionComment: string | null;

  @ApiProperty({
    description: '재작성 완료 여부',
    example: false,
  })
  isRevisionCompleted: boolean;

  @ApiPropertyOptional({
    description: '재작성 완료 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  revisionCompletedAt: Date | null;

  @ApiPropertyOptional({
    description: '재작성 완료 응답 코멘트',
    example: '평가 완료했습니다.',
    nullable: true,
  })
  responseComment: string | null;
}

/**
 * 단계별 확인 상태 정보 DTO
 */
export class StepApprovalInfoDto {
  @ApiProperty({
    description: '평가기준 설정 확인 상태',
    enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'pending',
  })
  criteriaSettingStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed';

  @ApiPropertyOptional({
    description: '평가기준 설정 승인자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  criteriaSettingApprovedBy: string | null;

  @ApiPropertyOptional({
    description: '평가기준 설정 승인 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  criteriaSettingApprovedAt: Date | null;

  @ApiProperty({
    description: '자기평가 확인 상태',
    enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'pending',
  })
  selfEvaluationStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed';

  @ApiPropertyOptional({
    description: '자기평가 승인자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  selfEvaluationApprovedBy: string | null;

  @ApiPropertyOptional({
    description: '자기평가 승인 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  selfEvaluationApprovedAt: Date | null;

  @ApiProperty({
    description: '1차 하향평가 확인 상태',
    enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'pending',
  })
  primaryEvaluationStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed';

  @ApiPropertyOptional({
    description: '1차 하향평가 승인자 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  primaryEvaluationApprovedBy: string | null;

  @ApiPropertyOptional({
    description: '1차 하향평가 승인 일시',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  primaryEvaluationApprovedAt: Date | null;

  @ApiProperty({
    description: '2차 하향평가 확인 상태 (평가자별)',
    type: () => [SecondaryEvaluationStatusDto],
    isArray: true,
    example: [
      {
        evaluatorId: '123e4567-e89b-12d3-a456-426614174003',
        evaluatorName: '홍길동',
        evaluatorEmployeeNumber: 'EMP001',
        evaluatorEmail: 'hong@example.com',
        status: 'pending',
        approvedBy: null,
        approvedAt: null,
        revisionRequestId: null,
        revisionComment: null,
        isRevisionCompleted: false,
        revisionCompletedAt: null,
      },
    ],
  })
  @Type(() => SecondaryEvaluationStatusDto)
  secondaryEvaluationStatuses: SecondaryEvaluationStatusDto[];

  @ApiProperty({
    description:
      '2차 하향평가 확인 상태 (최종 상태, 모든 평가자 완료 여부 기반, 하위 호환성)',
    enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    example: 'pending',
  })
  secondaryEvaluationStatus:
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'revision_completed';

  @ApiPropertyOptional({
    description: '2차 하향평가 승인자 ID (하위 호환성)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  secondaryEvaluationApprovedBy: string | null;

  @ApiPropertyOptional({
    description: '2차 하향평가 승인 일시 (하위 호환성)',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  secondaryEvaluationApprovedAt: Date | null;
}

/**
 * 직원의 평가기간 현황 응답 DTO
 */
export class EmployeeEvaluationPeriodStatusResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  mappingId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가 대상 여부 (제외되지 않고 삭제되지 않은 경우)',
    example: true,
  })
  isEvaluationTarget: boolean;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: () => EvaluationPeriodInfoDto,
    nullable: true,
  })
  evaluationPeriod: EvaluationPeriodInfoDto | null;

  @ApiPropertyOptional({
    description: '직원 정보',
    type: () => EmployeeInfoDto,
    nullable: true,
  })
  employee: EmployeeInfoDto | null;

  @ApiProperty({
    description: '평가 대상 제외 정보',
    type: () => ExclusionInfoDto,
  })
  exclusionInfo: ExclusionInfoDto;

  @ApiProperty({
    description: '평가항목 설정 정보',
    type: () => EvaluationCriteriaInfoDto,
  })
  evaluationCriteria: EvaluationCriteriaInfoDto;

  @ApiProperty({
    description: 'WBS 평가기준 설정 정보',
    type: () => WbsCriteriaInfoDto,
  })
  wbsCriteria: WbsCriteriaInfoDto;

  @ApiProperty({
    description: '평가라인 지정 정보',
    type: () => EvaluationLineInfoDto,
  })
  evaluationLine: EvaluationLineInfoDto;

  @ApiProperty({
    description: '성과 입력 정보',
    type: () => PerformanceInputDto,
  })
  @Type(() => PerformanceInputDto)
  performanceInput: PerformanceInputDto;

  @ApiProperty({
    description: '자기평가 진행 정보',
    type: () => SelfEvaluationInfoDto,
  })
  selfEvaluation: SelfEvaluationInfoDto;

  @ApiProperty({
    description: '하향평가 진행 정보',
    type: () => DownwardEvaluationInfoDto,
  })
  downwardEvaluation: DownwardEvaluationInfoDto;

  @ApiProperty({
    description: '단계별 확인 상태 정보',
    type: () => StepApprovalInfoDto,
  })
  stepApproval: StepApprovalInfoDto;

  @ApiProperty({
    description: '동료평가 진행 정보',
    type: () => PeerEvaluationInfoDto,
  })
  peerEvaluation: PeerEvaluationInfoDto;

  @ApiProperty({
    description: '최종평가 정보',
    type: () => FinalEvaluationInfoDto,
  })
  finalEvaluation: FinalEvaluationInfoDto;
}
