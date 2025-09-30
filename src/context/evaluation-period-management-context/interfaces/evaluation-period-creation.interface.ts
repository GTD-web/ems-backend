import { GradeRange } from '../../../domain/core/evaluation-period/evaluation-period.types';

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
  /** 등급 구간 설정 */
  gradeRanges: GradeRange[];
}

/**
 * 평가 기간 일정 부분 업데이트 DTO
 */
export interface UpdateEvaluationPeriodScheduleDto {
  /** 평가 기간 시작일 */
  startDate?: Date;
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
 * 평가설정 단계 마감일 업데이트 DTO
 */
export interface UpdateEvaluationSetupDeadlineDto {
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline: Date;
}

/**
 * 업무 수행 단계 마감일 업데이트 DTO
 */
export interface UpdatePerformanceDeadlineDto {
  /** 업무 수행 단계 마감일 */
  performanceDeadline: Date;
}

/**
 * 자기 평가 단계 마감일 업데이트 DTO
 */
export interface UpdateSelfEvaluationDeadlineDto {
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline: Date;
}

/**
 * 하향/동료평가 단계 마감일 업데이트 DTO
 */
export interface UpdatePeerEvaluationDeadlineDto {
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline: Date;
}

/**
 * 평가 기간 시작일 업데이트 DTO
 */
export interface UpdateEvaluationPeriodStartDateDto {
  /** 평가 기간 시작일 */
  startDate: Date;
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
  /** 등급 구간 목록 */
  gradeRanges: GradeRange[];
}

/**
 * 평가 기준 설정 수동 허용 DTO
 */
export interface UpdateCriteriaSettingPermissionDto {
  /** 평가 기준 설정 수동 허용 여부 */
  enabled: boolean;
}

/**
 * 자기 평가 설정 수동 허용 DTO
 */
export interface UpdateSelfEvaluationSettingPermissionDto {
  /** 자기 평가 설정 수동 허용 여부 */
  enabled: boolean;
}

/**
 * 최종 평가 설정 수동 허용 DTO
 */
export interface UpdateFinalEvaluationSettingPermissionDto {
  /** 최종 평가 설정 수동 허용 여부 */
  enabled: boolean;
}

/**
 * 전체 수동 허용 설정 DTO
 */
export interface UpdateManualSettingPermissionsDto {
  /** 평가 기준 설정 수동 허용 여부 (선택) */
  criteriaSettingEnabled?: boolean;
  /** 자기 평가 설정 수동 허용 여부 (선택) */
  selfEvaluationSettingEnabled?: boolean;
  /** 최종 평가 설정 수동 허용 여부 (선택) */
  finalEvaluationSettingEnabled?: boolean;
}
