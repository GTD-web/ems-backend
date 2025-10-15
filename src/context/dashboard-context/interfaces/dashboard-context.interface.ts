/**
 * 대시보드 컨텍스트 인터페이스
 */

/**
 * 평가항목 설정 상태
 * - complete: 프로젝트와 WBS 모두 할당됨 (존재)
 * - in_progress: 프로젝트나 WBS 중 하나만 할당됨 (설정중)
 * - none: 프로젝트와 WBS 모두 미할당 (미존재)
 */
export type EvaluationCriteriaStatus = 'complete' | 'in_progress' | 'none';

/**
 * WBS 평가기준 설정 상태
 * - complete: 모든 WBS에 평가기준이 설정됨 (완료)
 * - in_progress: 일부 WBS에만 평가기준이 설정됨 (설정중)
 * - none: 평가기준이 설정된 WBS가 없음 (미존재)
 */
export type WbsCriteriaStatus = 'complete' | 'in_progress' | 'none';

/**
 * 평가라인 지정 완료 상태
 * - complete: PRIMARY와 SECONDARY 라인 모두에 평가자가 지정됨 (존재)
 * - in_progress: PRIMARY나 SECONDARY 중 하나만 평가자가 지정됨 (설정중)
 * - none: PRIMARY와 SECONDARY 모두 평가자가 미지정 (미존재)
 */
export type EvaluationLineStatus = 'complete' | 'in_progress' | 'none';

/**
 * 자기평가 진행 상태
 * - complete: 모든 WBS 자기평가가 완료됨 (완료)
 * - in_progress: 일부 WBS 자기평가만 완료되거나 진행중 (입력중)
 * - none: WBS 자기평가 매핑이 없음 (미존재)
 */
export type SelfEvaluationStatus = 'complete' | 'in_progress' | 'none';

/**
 * 직원 평가 기간 현황 DTO
 * 특정 평가기간에서 특정 직원의 참여 현황 정보
 */
export interface EmployeeEvaluationPeriodStatusDto {
  /** 맵핑 ID */
  mappingId: string;

  /** 평가기간 ID */
  evaluationPeriodId: string;

  /** 직원 ID */
  employeeId: string;

  /** 평가 대상 여부 (제외되지 않고 삭제되지 않은 경우) */
  isEvaluationTarget: boolean;

  /** 평가기간 정보 */
  evaluationPeriod: {
    /** 평가기간 ID */
    id: string;
    /** 평가기간명 */
    name: string;
    /** 평가 기간 상태 */
    status: string;
    /** 현재 평가 단계 */
    currentPhase: string;
    /** 평가 시작일 */
    startDate: Date;
    /** 평가 종료일 */
    endDate?: Date;
  } | null;

  /** 직원 정보 */
  employee: {
    /** 직원 ID */
    id: string;
    /** 직원명 */
    name: string;
    /** 직원 사번 */
    employeeNumber: string;
    /** 이메일 */
    email: string;
    /** 부서명 */
    departmentName?: string;
    /** 직책명 */
    rankName?: string;
  } | null;

  /** 평가 대상 제외 정보 */
  exclusionInfo: {
    /** 평가 대상 제외 여부 */
    isExcluded: boolean;
    /** 제외 사유 */
    excludeReason?: string | null;
    /** 제외 처리 일시 */
    excludedAt?: Date | null;
  };

  /** 평가항목 설정 정보 */
  evaluationCriteria: {
    /** 평가항목 설정 상태 */
    status: EvaluationCriteriaStatus;
    /** 할당된 프로젝트 수 */
    assignedProjectCount: number;
    /** 할당된 WBS 수 */
    assignedWbsCount: number;
  };

  /** WBS 평가기준 설정 정보 */
  wbsCriteria: {
    /** WBS 평가기준 설정 상태 */
    status: WbsCriteriaStatus;
    /** 평가기준이 설정된 WBS 수 */
    wbsWithCriteriaCount: number;
  };

  /** 평가라인 지정 정보 */
  evaluationLine: {
    /** 평가라인 지정 완료 상태 */
    status: EvaluationLineStatus;
    /** PRIMARY 라인 평가자 지정 여부 */
    hasPrimaryEvaluator: boolean;
    /** SECONDARY 라인 평가자 지정 여부 */
    hasSecondaryEvaluator: boolean;
  };

  /** 자기평가 진행 정보 */
  selfEvaluation: {
    /** 자기평가 진행 상태 */
    status: SelfEvaluationStatus;
    /** 전체 WBS 자기평가 매핑 수 */
    totalMappingCount: number;
    /** 완료된 WBS 자기평가 수 */
    completedMappingCount: number;
  };
}

/**
 * 대시보드 컨텍스트 인터페이스
 */
export interface IDashboardContext {
  /**
   * 직원의 평가기간 현황을 조회한다
   */
  직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EmployeeEvaluationPeriodStatusDto | null>;
}
