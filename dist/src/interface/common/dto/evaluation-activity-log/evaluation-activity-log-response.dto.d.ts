export declare class EvaluationActivityLogResponseDto {
    id: string;
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
    activityDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export declare class EvaluationActivityLogListResponseDto {
    items: EvaluationActivityLogResponseDto[];
    total: number;
    page: number;
    limit: number;
}
