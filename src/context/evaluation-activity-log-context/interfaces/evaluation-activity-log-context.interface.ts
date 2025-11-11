import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';

/**
 * 활동 내역 기록 요청
 */
export interface CreateEvaluationActivityLogRequest {
  periodId: string;
  employeeId: string;
  activityType: string;
  activityAction: string;
  activityTitle?: string;
  activityDescription?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  performedBy: string;
  performedByName?: string;
  activityMetadata?: Record<string, any>;
  activityDate?: Date;
}

/**
 * 평가기간 피평가자 활동 내역 조회 요청
 */
export interface GetEvaluationActivityLogListRequest {
  periodId: string;
  employeeId: string;
  activityType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * 평가기간 피평가자 활동 내역 조회 결과
 */
export interface GetEvaluationActivityLogListResult {
  items: EvaluationActivityLogDto[];
  total: number;
  page: number;
  limit: number;
}

