/**
 * WBS 자가평가 관련 타입 정의
 */

/**
 * WBS 자가평가 DTO
 */
export interface WbsSelfEvaluationDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가일 */
  evaluationDate: Date;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
  /** 추가 의견 */
  additionalComments?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * WBS 자가평가 상세 DTO (관련 정보 포함)
 */
export interface WbsSelfEvaluationDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가일 */
  evaluationDate: Date;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
  /** 추가 의견 */
  additionalComments?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * WBS 자가평가 생성 데이터
 */
export interface CreateWbsSelfEvaluationData {
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
  /** 추가 의견 */
  additionalComments?: string;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * WBS 자가평가 수정 데이터
 */
export interface UpdateWbsSelfEvaluationData {
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore?: number;
  /** 추가 의견 */
  additionalComments?: string;
}

/**
 * WBS 자가평가 필터
 */
export interface WbsSelfEvaluationFilter {
  /** 평가일 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 종료 */
  evaluationDateTo?: Date;
  /** 점수 범위 시작 */
  scoreFrom?: number;
  /** 점수 범위 종료 */
  scoreTo?: number;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}
