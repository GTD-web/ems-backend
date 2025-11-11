import type { EvaluationActivityLogDto } from '@domain/core/evaluation-activity-log/evaluation-activity-log.types';
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
export interface GetEvaluationActivityLogListRequest {
    periodId: string;
    employeeId: string;
    activityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export interface GetEvaluationActivityLogListResult {
    items: EvaluationActivityLogDto[];
    total: number;
    page: number;
    limit: number;
}
