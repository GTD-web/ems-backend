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
  프로젝트할당한다(
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
  프로젝트할당수정한다(
    id: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 취소한다
   * @param id 프로젝트 할당 ID
   * @param cancelledBy 취소자 ID
   */
  프로젝트할당취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * 프로젝트 할당 목록을 조회한다
   * @param filter 필터 조건
   * @returns 프로젝트 할당 목록
   */
  프로젝트할당목록조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 특정 직원의 평가기간별 프로젝트 할당을 조회한다
   * @param employeeId 직원 ID
   * @param periodId 평가기간 ID
   * @returns 프로젝트 할당 목록
   */
  직원프로젝트할당조회한다(
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
  WBS할당한다(
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
  WBS할당수정한다(
    id: string,
    data: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto>;

  /**
   * WBS 할당을 취소한다
   * @param id WBS 할당 ID
   * @param cancelledBy 취소자 ID
   */
  WBS할당취소한다(id: string, cancelledBy: string): Promise<void>;

  /**
   * WBS 할당 목록을 조회한다
   * @param filter 필터 조건
   * @returns WBS 할당 목록
   */
  WBS할당목록조회한다(
    filter: EvaluationWbsAssignmentFilter,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 특정 직원의 평가기간별 WBS 할당을 조회한다
   * @param employeeId 직원 ID
   * @param periodId 평가기간 ID
   * @returns WBS 할당 목록
   */
  직원WBS할당조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]>;

  /**
   * 프로젝트별 WBS 할당을 조회한다
   * @param projectId 프로젝트 ID
   * @param periodId 평가기간 ID
   * @returns WBS 할당 목록
   */
  프로젝트WBS할당조회한다(
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
  WBS평가기준설정한다(
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
  WBS평가기준수정한다(
    id: string,
    data: UpdateWbsEvaluationCriteriaDto,
    updatedBy: string,
  ): Promise<WbsEvaluationCriteriaDto>;

  /**
   * WBS 평가 기준을 삭제한다
   * @param id WBS 평가 기준 ID
   * @param deletedBy 삭제자 ID
   */
  WBS평가기준삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * WBS 항목별 평가 기준을 조회한다
   * @param wbsItemId WBS 항목 ID
   * @returns WBS 평가 기준 목록
   */
  WBS평가기준조회한다(wbsItemId: string): Promise<WbsEvaluationCriteriaDto[]>;

  // ============================================================================
  // 평가 라인 관리
  // ============================================================================

  /**
   * 평가 라인을 생성한다
   * @param data 평가 라인 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 평가 라인 정보
   */
  평가라인생성한다(
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
  평가라인수정한다(
    id: string,
    data: UpdateEvaluationLineDto,
    updatedBy: string,
  ): Promise<EvaluationLineDto>;

  /**
   * 평가 라인을 삭제한다
   * @param id 평가 라인 ID
   * @param deletedBy 삭제자 ID
   */
  평가라인삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * 평가 라인 목록을 조회한다
   * @param filter 필터 조건
   * @returns 평가 라인 목록
   */
  평가라인목록조회한다(
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
  평가라인매핑생성한다(
    data: CreateEvaluationLineMappingData,
    createdBy: string,
  ): Promise<EvaluationLineMappingDto>;

  /**
   * 평가 라인 매핑을 삭제한다
   * @param id 평가 라인 매핑 ID
   * @param deletedBy 삭제자 ID
   */
  평가라인매핑삭제한다(id: string, deletedBy: string): Promise<void>;

  /**
   * 직원별 평가 라인 매핑을 조회한다
   * @param employeeId 직원 ID
   * @param projectId 프로젝트 ID (선택적)
   * @returns 평가 라인 매핑 목록
   */
  직원평가라인매핑조회한다(
    employeeId: string,
    projectId?: string,
  ): Promise<EvaluationLineMappingDto[]>;

  /**
   * 평가자별 평가 라인 매핑을 조회한다
   * @param evaluatorId 평가자 ID
   * @param projectId 프로젝트 ID (선택적)
   * @returns 평가 라인 매핑 목록
   */
  평가자평가라인매핑조회한다(
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
  직원평가설정조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLines: EvaluationLineMappingDto[];
  }>;

  /**
   * 평가기간의 전체 평가 설정 현황을 조회한다
   * @param periodId 평가기간 ID
   * @returns 평가 설정 현황 통계
   */
  평가설정현황조회한다(periodId: string): Promise<{
    totalEmployees: number;
    assignedEmployees: number;
    completedSetupEmployees: number;
    setupProgress: number;
  }>;

  /**
   * 평가 설정이 완료되지 않은 직원 목록을 조회한다
   * @param periodId 평가기간 ID
   * @returns 설정 미완료 직원 목록
   */
  평가설정미완료직원조회한다(periodId: string): Promise<
    {
      employeeId: string;
      missingSetups: string[];
    }[]
  >;
}
