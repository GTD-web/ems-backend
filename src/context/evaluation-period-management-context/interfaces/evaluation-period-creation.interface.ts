import { GradeType } from '../../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가 기간 생성을 위한 최소 필수 데이터
 */
export interface CreateEvaluationPeriodMinimalDto {
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline: Date;
  /** 평가 기간 설명 (선택) */
  description?: string;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate: number;
  /** 평가 기준 목록 */
  evaluationCriteria: EvaluationCriteriaItem[];
}

/**
 * 평가 기준 항목
 */
export interface EvaluationCriteriaItem {
  /** 평가 기준명 */
  name: string;
  /** 평가 기준 설명 */
  description?: string;
  /** 가중치 (%) */
  weight: number;
  /** 등급별 점수 범위 */
  gradeRanges: GradeRangeItem[];
}

/**
 * 등급 구간 항목
 */
export interface GradeRangeItem {
  /** 등급 */
  grade: GradeType;
  /** 최소 점수 */
  minScore: number;
  /** 최대 점수 */
  maxScore: number;
}

/**
 * 평가 기간 일정 부분 업데이트 DTO
 */
export interface UpdateEvaluationPeriodScheduleDto {
  /** 평가 기간 종료일 */
  endDate?: Date;
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
}

/**
 * 평가 기간 기본 정보 업데이트 DTO
 */
export interface UpdateEvaluationPeriodBasicDto {
  /** 평가 기간명 */
  name?: string;
  /** 평가 기간 설명 */
  description?: string;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate?: number;
}

/**
 * 등급 구간 업데이트 DTO
 */
export interface UpdateGradeRangesDto {
  /** 평가 기준 목록 */
  evaluationCriteria: EvaluationCriteriaItem[];
}
