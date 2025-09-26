/**
 * 등급 타입
 */
export enum GradeType {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  F = 'F',
}

/**
 * 세부 등급 타입
 */
export enum SubGradeType {
  PLUS = 'plus',
  NONE = 'none',
  MINUS = 'minus',
}

/**
 * 세부 등급 정보
 */
export interface SubGradeInfo {
  /** 세부 등급 타입 */
  type: SubGradeType;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
}

/**
 * 등급 구간 생성 DTO
 */
export interface CreateGradeRangeDto {
  /** 평가 기간 ID */
  periodId: string;
  /** 등급 */
  grade: GradeType;
  /** 기준 점수 */
  score: number;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];
}

/**
 * 등급 구간 업데이트 DTO
 */
export interface UpdateGradeRangeDto {
  /** 등급 */
  grade?: GradeType;
  /** 기준 점수 */
  score?: number;
  /** 최소 범위 */
  minRange?: number;
  /** 최대 범위 */
  maxRange?: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];
}

/**
 * 등급 구간 DTO
 */
export interface GradeRangeDto {
  /** 등급 구간 고유 식별자 */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 등급 */
  grade: GradeType;
  /** 기준 점수 */
  score: number;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 등급 구간 필터
 */
export interface GradeRangeFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 등급별 필터 */
  grade?: GradeType;
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
}

/**
 * 등급 구간 통계
 */
export interface GradeRangeStatistics {
  /** 전체 등급 구간 수 */
  totalRanges: number;
  /** 등급별 통계 */
  gradeCounts: Record<GradeType, number>;
  /** 평균 기준 점수 */
  averageScore: number;
  /** 최고 점수 */
  maxScore: number;
  /** 최저 점수 */
  minScore: number;
}

/**
 * 점수 등급 매핑 결과
 */
export interface ScoreGradeMapping {
  /** 점수 */
  score: number;
  /** 등급 */
  grade: GradeType;
  /** 세부 등급 */
  subGrade?: SubGradeType;
  /** 최종 등급 문자열 (예: S+, A-, B) */
  finalGrade: string;
}
