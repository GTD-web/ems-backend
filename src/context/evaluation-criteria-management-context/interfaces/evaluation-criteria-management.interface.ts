import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
  UpdateEvaluationProjectAssignmentData,
} from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  UpdateEvaluationWbsAssignmentData,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type {
  CreateEvaluationLineDto,
  EvaluationLineDto,
  EvaluationLineFilter,
  UpdateEvaluationLineDto,
} from '../../../domain/core/evaluation-line/evaluation-line.types';
import type {
  CreateEvaluationLineMappingData,
  EvaluationLineMappingDto,
  EvaluationLineMappingFilter,
  UpdateEvaluationLineMappingData,
} from '../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type { ProjectAssignmentListResult } from '../handlers/project-assignment/queries/get-project-assignment-list.handler';
import type { WbsAssignmentListResult } from '../handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';

/**
 * 평가기준관리 서비스 인터페이스 (MVP 버전)
 *
 * MVP에서는 핵심 기능만 제공합니다:
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 */
export interface IEvaluationCriteriaManagementService {
  // ============================================================================
  // 프로젝트 할당 관리
  // ============================================================================

  /**
   * 평가기간에 직원에게 프로젝트를 할당한다
   */
  프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당 정보를 수정한다
   */
  프로젝트_할당을_수정한다(
    id: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 취소한다
   */
  프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * 프로젝트 할당 목록을 조회한다
   */
  프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<ProjectAssignmentListResult>;

  /**
   * 직원의 프로젝트 할당을 조회한다
   */
  직원의_프로젝트_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 프로젝트 할당 상세를 조회한다
   */
  프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null>;

  /**
   * 프로젝트에 할당된 직원을 조회한다
   */
  프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 할당되지 않은 직원 목록을 조회한다
   */
  할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<string[]>;

  /**
   * 여러 프로젝트를 대량으로 할당한다
   */
  프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  // ============================================================================
  // WBS 할당 관리
  // ============================================================================

  /**
   * WBS 항목을 직원에게 할당한다
   */
  WBS를_할당한다(
    data: CreateEvaluationWbsAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당 정보를 수정한다
   */
  WBS_할당을_수정한다(
    id: string,
    data: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당을 취소한다
   */
  WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * WBS 할당 목록을 조회한다
   */
  WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
  ): Promise<WbsAssignmentListResult>;

  /**
   * 직원의 WBS 할당을 조회한다
   */
  직원의_WBS_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 프로젝트의 WBS 할당을 조회한다
   */
  프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * WBS 할당 상세를 조회한다
   */
  WBS_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationWbsAssignmentDto | null>;

  /**
   * WBS 항목의 할당을 조회한다
   */
  WBS_항목의_할당을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 할당되지 않은 WBS 항목 목록을 조회한다
   */
  할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<string[]>;

  /**
   * 여러 WBS를 대량으로 할당한다
   */
  WBS를_대량으로_할당한다(
    assignments: CreateEvaluationWbsAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 평가기간의 모든 WBS 할당을 초기화한다
   */
  평가기간의_WBS_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  /**
   * 프로젝트의 모든 WBS 할당을 초기화한다
   */
  프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  /**
   * 직원의 모든 WBS 할당을 초기화한다
   */
  직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void>;

  // ============================================================================
  // 평가라인 조회
  // ============================================================================

  /**
   * 평가라인 목록을 조회한다
   */
  평가라인_목록을_조회한다(
    filter: EvaluationLineFilter,
  ): Promise<EvaluationLineDto[]>;

  /**
   * 직원의 평가라인 매핑을 조회한다
   */
  직원의_평가라인_매핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationLineMappingDto[]>;

  /**
   * 평가자별 피평가자 목록을 조회한다
   */
  평가자별_피평가자_목록을_조회한다(evaluatorId: string): Promise<{
    evaluatorId: string;
    employees: {
      employeeId: string;
      wbsItemId?: string;
      evaluationLineId: string;
      createdBy?: string;
      updatedBy?: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }>;

  /**
   * 수정자별 평가라인 매핑을 조회한다
   */
  수정자별_평가라인_매핑을_조회한다(
    updatedBy: string,
  ): Promise<EvaluationLineMappingDto[]>;

  // ============================================================================
  // 평가라인 구성 관리 (핵심 기능)
  // ============================================================================

  /**
   * 직원-WBS별 평가라인을 구성한다
   */
  직원_WBS별_평가라인을_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
  }>;

  // ============================================================================
  // 통합 관리 기능 (MVP)
  // ============================================================================

  /**
   * 직원의 평가설정을 조회한다 (MVP 버전)
   */
  직원의_평가설정을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
  }>;
}
