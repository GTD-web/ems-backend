import { ProjectInfoDto } from '@/interface/admin/evaluation-criteria/dto/project-assignment.dto';
import type { EvaluationLineMappingDto } from '../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '../../../domain/core/evaluation-line/evaluation-line.types';
import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
} from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  UpdateEvaluationWbsAssignmentData,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
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
   * 특정 평가기간에 직원에게 할당된 프로젝트를 조회한다
   */
  특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{ projects: ProjectInfoDto[] }>;

  /**
   * 프로젝트 할당 상세를 조회한다
   */
  프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null>;

  /**
   * 특정 평가기간에 프로젝트에 할당된 직원을 조회한다
   */
  특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회한다
   */
  특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
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
   * 특정 평가기간에 직원에게 할당된 WBS를 조회한다
   */
  특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 특정 평가기간에 프로젝트의 WBS 할당을 조회한다
   */
  특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
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
   * 특정 평가기간에 WBS 항목에 할당된 직원을 조회한다
   */
  특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록을 조회한다
   */
  특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
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
   * 특정 직원의 평가라인 매핑을 조회한다
   */
  특정_직원의_평가라인_매핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationLineMappingDto[]>;

  /**
   * 특정 평가자가 평가해야 하는 피평가자 목록을 조회한다
   */
  특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
    evaluatorId: string,
  ): Promise<{
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
   * 특정 사용자가 수정한 평가라인 매핑을 조회한다
   */
  특정_사용자가_수정한_평가라인_매핑을_조회한다(
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
   * 특정 평가기간에 직원의 평가설정을 통합 조회한다 (MVP 버전)
   */
  특정_평가기간에_직원의_평가설정을_통합_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
  }>;
}
