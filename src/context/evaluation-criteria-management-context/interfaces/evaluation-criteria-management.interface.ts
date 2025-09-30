import type {
  CreateEvaluationLineMappingData,
  EvaluationLineMappingDto,
} from '../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  CreateEvaluationLineDto,
  EvaluationLineDto,
  EvaluationLineFilter,
  UpdateEvaluationLineDto,
} from '../../../domain/core/evaluation-line/evaluation-line.types';
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
  CreateWbsEvaluationCriteriaDto,
  UpdateWbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaDto,
} from '../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import type { ProjectAssignmentListResult } from '../queries/project-assignment.queries';

/**
 * 평가기준관리 서비스 인터페이스
 *
 * 평가 기준 설정과 관련된 모든 기능을 통합 관리하는 서비스입니다.
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 * - WBS 평가 기준 관리
 * - 평가 라인 관리
 * - 평가 라인 매핑 관리
 */
export interface IEvaluationCriteriaManagementService {
  // ============================================================================
  // 프로젝트 할당 관리
  // ============================================================================

  /**
   * 평가기간에 직원에게 프로젝트를 할당한다
   * @param data 프로젝트 할당 데이터
   * @param assignedBy 할당자 ID
   * @returns 생성된 프로젝트 할당 정보
   */
  프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당 정보를 수정한다
   * @param id 프로젝트 할당 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 할당 정보
   */
  프로젝트_할당을_수정한다(
    id: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 취소한다
   * @param id 프로젝트 할당 ID
   * @param cancelledBy 취소자 ID
   */
  프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * 프로젝트 할당 목록을 조회한다
   * @param filter 필터 조건
   * @returns 프로젝트 할당 목록
   */
  프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<ProjectAssignmentListResult>;

  /**
   * 특정 직원의 평가기간별 프로젝트 할당을 조회한다
   * @param employeeId 직원 ID
   * @param periodId 평가기간 ID
   * @returns 프로젝트 할당 목록
   */
  직원의_프로젝트_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  // ============================================================================
  // WBS 할당 관리
  // ============================================================================

  /**
   * 평가기간에 직원에게 WBS 항목을 할당한다
   * @param data WBS 할당 데이터
   * @param assignedBy 할당자 ID
   * @returns 생성된 WBS 할당 정보
   */
  WBS를_할당한다(
    data: CreateEvaluationWbsAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당 정보를 수정한다
   * @param id WBS 할당 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 WBS 할당 정보
   */
  WBS_할당을_수정한다(
    id: string,
    data: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당을 취소한다
   * @param id WBS 할당 ID
   * @param cancelledBy 취소자 ID
   */
  WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * WBS 할당 목록을 조회한다
   * @param filter 필터 조건
   * @returns WBS 할당 목록
   */
  WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
  ): Promise<
    import('../queries/wbs-assignment.queries').WbsAssignmentListResult
  >;

  /**
   * 특정 직원의 평가기간별 WBS 할당을 조회한다
   * @param employeeId 직원 ID
   * @param periodId 평가기간 ID
   * @returns WBS 할당 목록
   */
  직원의_WBS_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 프로젝트별 WBS 할당을 조회한다
   * @param projectId 프로젝트 ID
   * @param periodId 평가기간 ID
   * @returns WBS 할당 목록
   */
  프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  // ============================================================================
  // WBS 평가 기준 관리
  // ============================================================================

  /**
   * WBS 항목에 평가 기준을 설정한다
   * @param data WBS 평가 기준 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 WBS 평가 기준 정보
   */
  WBS_평가기준을_설정한다(
    data: CreateWbsEvaluationCriteriaDto,
    createdBy: string,
  ): Promise<WbsEvaluationCriteriaDto>;

  /**
   * WBS 평가 기준을 수정한다
   * @param id WBS 평가 기준 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 WBS 평가 기준 정보
   */
  WBS_평가기준을_수정한다(
    id: string,
    data: UpdateWbsEvaluationCriteriaDto,
    updatedBy: string,
  ): Promise<WbsEvaluationCriteriaDto>;

  /**
   * WBS 평가 기준을 삭제한다
   * @param id WBS 평가 기준 ID
   * @param deletedBy 삭제자 ID
   */
  WBS_평가기준을_삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * WBS 항목별 평가 기준을 조회한다
   * @param wbsItemId WBS 항목 ID
   * @returns WBS 평가 기준 목록
   */
  WBS_평가기준을_조회한다(
    wbsItemId: string,
  ): Promise<WbsEvaluationCriteriaDto[]>;

  // ============================================================================
  // 평가 라인 관리
  // ============================================================================

  /**
   * 평가 라인을 생성한다
   * @param data 평가 라인 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 평가 라인 정보
   */
  평가라인을_생성한다(
    data: CreateEvaluationLineDto,
    createdBy: string,
  ): Promise<EvaluationLineDto>;

  /**
   * 평가 라인을 수정한다
   * @param id 평가 라인 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 평가 라인 정보
   */
  평가라인을_수정한다(
    id: string,
    data: UpdateEvaluationLineDto,
    updatedBy: string,
  ): Promise<EvaluationLineDto>;

  /**
   * 평가 라인을 삭제한다
   * @param id 평가 라인 ID
   * @param deletedBy 삭제자 ID
   */
  평가라인을_삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * 평가 라인 목록을 조회한다
   * @param filter 필터 조건
   * @returns 평가 라인 목록
   */
  평가라인_목록을_조회한다(
    filter: EvaluationLineFilter,
  ): Promise<EvaluationLineDto[]>;

  // ============================================================================
  // 평가 라인 매핑 관리
  // ============================================================================

  /**
   * 평가 라인 매핑을 생성한다
   * @param data 평가 라인 매핑 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 평가 라인 매핑 정보
   */
  평가라인_매핑을_생성한다(
    data: CreateEvaluationLineMappingData,
    createdBy: string,
  ): Promise<EvaluationLineMappingDto>;

  /**
   * 평가 라인 매핑을 삭제한다
   * @param id 평가 라인 매핑 ID
   * @param deletedBy 삭제자 ID
   */
  평가라인_매핑을_삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * 직원별 평가 라인 매핑을 조회한다
   * @param employeeId 직원 ID
   * @param projectId 프로젝트 ID (선택적)
   * @returns 평가 라인 매핑 목록
   */
  직원의_평가라인_매핑을_조회한다(
    employeeId: string,
    projectId?: string,
  ): Promise<EvaluationLineMappingDto[]>;

  /**
   * 평가자별 평가 라인 매핑을 조회한다
   * @param evaluatorId 평가자 ID
   * @param projectId 프로젝트 ID (선택적)
   * @returns 평가 라인 매핑 목록
   */
  평가자의_평가라인_매핑을_조회한다(
    evaluatorId: string,
    projectId?: string,
  ): Promise<EvaluationLineMappingDto[]>;

  // ============================================================================
  // 통합 관리 기능
  // ============================================================================

  /**
   * 직원의 평가기간별 전체 평가 설정을 조회한다
   * @param employeeId 직원 ID
   * @param periodId 평가기간 ID
   * @returns 평가 설정 정보 (프로젝트, WBS, 평가라인 등)
   */
  직원의_평가설정을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLines: EvaluationLineMappingDto[];
  }>;
}
