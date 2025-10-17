/**
 * 직무등급
 * 직원의 직무 수준을 나타냅니다.
 * T1(낮음) → T2(중간) → T3(높음)
 */
export enum JobGrade {
  T1 = 'T1', // 낮음
  T2 = 'T2', // 중간
  T3 = 'T3', // 높음
}

/**
 * 직무 상세등급
 * 직무등급을 더 세분화한 등급입니다.
 * u(낮음) → n(중간) → a(높음)
 *
 * 조합 예시 (낮음 → 높음):
 * T1-u < T1-n < T1-a < T2-u < T2-n < T2-a < T3-u < T3-n < T3-a
 */
export enum JobDetailedGrade {
  U = 'u', // 낮음
  N = 'n', // 중간
  A = 'a', // 높음
}

/**
 * 최종평가 생성 데이터
 */
export interface CreateFinalEvaluationData {
  /** 피평가자(직원) ID */
  employeeId: string;
  /** 평가기간 ID */
  periodId: string;
  /** 평가등급 (문자열, 예: S, A, B, C, D 등) */
  evaluationGrade: string;
  /** 직무등급 */
  jobGrade: JobGrade;
  /** 직무 상세등급 */
  jobDetailedGrade: JobDetailedGrade;
  /** 최종 평가 의견 */
  finalComments?: string;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 최종평가 수정 데이터
 */
export interface UpdateFinalEvaluationData {
  /** 평가등급 (문자열) */
  evaluationGrade?: string;
  /** 직무등급 */
  jobGrade?: JobGrade;
  /** 직무 상세등급 */
  jobDetailedGrade?: JobDetailedGrade;
  /** 최종 평가 의견 */
  finalComments?: string;
}

/**
 * 최종평가 DTO
 */
export interface FinalEvaluationDto {
  /** 최종평가 고유 식별자 */
  id: string;
  /** 피평가자(직원) ID */
  employeeId: string;
  /** 평가기간 ID */
  periodId: string;
  /** 평가등급 (문자열, 예: S, A, B, C, D 등) */
  evaluationGrade: string;
  /** 직무등급 */
  jobGrade: JobGrade;
  /** 직무 상세등급 */
  jobDetailedGrade: JobDetailedGrade;
  /** 최종 평가 의견 */
  finalComments?: string;
  /** 확정 여부 */
  isConfirmed: boolean;
  /** 확정일시 */
  confirmedAt?: Date | null;
  /** 확정자 ID */
  confirmedBy?: string | null;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
  /** 삭제일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * 최종평가 상세 DTO (관련 정보 포함)
 */
export interface FinalEvaluationDetailDto extends FinalEvaluationDto {
  /** 피평가자 정보 */
  employee?: {
    id: string;
    name: string;
    position: string;
    department: string;
  };
  /** 평가기간 정보 */
  period?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  };
  /** 확정자 정보 */
  confirmer?: {
    id: string;
    name: string;
  };
  /** 승인자 정보 */
  approver?: {
    id: string;
    name: string;
  };
}

/**
 * 최종평가 필터
 */
export interface FinalEvaluationFilter {
  /** 피평가자 ID */
  employeeId?: string;
  /** 평가기간 ID */
  periodId?: string;
  /** 평가등급 (문자열) */
  evaluationGrade?: string;
  /** 직무등급 */
  jobGrade?: JobGrade;
  /** 직무 상세등급 */
  jobDetailedGrade?: JobDetailedGrade;
  /** 확정된 평가만 조회 */
  confirmedOnly?: boolean;
  /** 확정일 범위 - 시작 */
  confirmedDateFrom?: Date;
  /** 확정일 범위 - 종료 */
  confirmedDateTo?: Date;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * 최종평가 통계
 */
export interface FinalEvaluationStatistics {
  /** 전체 최종평가 수 */
  totalEvaluations: number;
  /** 평가등급별 통계 (등급 문자열을 키로 사용) */
  gradeDistribution: Record<string, number>;
  /** 직무등급별 통계 */
  jobGradeDistribution: Record<JobGrade, number>;
  /** 확정된 평가 수 */
  confirmedEvaluations: number;
}
