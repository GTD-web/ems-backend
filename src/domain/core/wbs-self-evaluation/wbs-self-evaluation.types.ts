/**
 * WBS 자기평가 생성 DTO
 * 실제 자기평가 데이터만 포함합니다.
 */
export interface CreateWbsSelfEvaluationDto {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
}

/**
 * WBS 자기평가 업데이트 DTO
 */
export interface UpdateWbsSelfEvaluationDto {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
}

/**
 * WBS 자기평가 DTO
 * 실제 자기평가 데이터만 포함합니다.
 */
export interface WbsSelfEvaluationDto {
  /** WBS 자기평가 고유 식별자 */
  id: string;
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate?: Date;
  /** 제출 여부 */
  isSubmitted: boolean;
  /** 제출일시 */
  submittedAt?: Date;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * WBS 자기평가 필터
 * 실제 자기평가 데이터 기준 필터입니다.
 */
export interface WbsSelfEvaluationFilter {
  /** 제출된 평가만 조회 */
  submittedOnly?: boolean;
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
  /** 제출일 범위 - 시작 */
  submittedDateFrom?: Date;
  /** 제출일 범위 - 종료 */
  submittedDateTo?: Date;
}

/**
 * WBS 자기평가 통계
 */
export interface WbsSelfEvaluationStatistics {
  /** 전체 WBS 자기평가 수 */
  totalEvaluations: number;
  /** 제출된 평가 수 */
  submittedEvaluations: number;
  /** 미제출 평가 수 */
  unsubmittedEvaluations: number;
  /** 완료된 평가 수 */
  completedEvaluations: number;
  /** 미완료 평가 수 */
  incompleteEvaluations: number;
  /** 평균 점수 */
  averageScore: number;
  /** 최고 점수 */
  maxScore: number;
  /** 최저 점수 */
  minScore: number;
  /** 직원별 자기평가 수 */
  evaluationsByEmployee: Record<string, number>;
  /** WBS 항목별 자기평가 수 */
  evaluationsByWbsItem: Record<string, number>;
  /** 제출률 (%) */
  submissionRate: number;
}
