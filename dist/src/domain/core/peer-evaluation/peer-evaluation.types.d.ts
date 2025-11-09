export declare enum PeerEvaluationStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface CreatePeerEvaluationData {
    evaluateeId: string;
    evaluatorId: string;
    periodId: string;
    status?: PeerEvaluationStatus;
    evaluationDate?: Date;
    isCompleted?: boolean;
    requestDeadline?: Date;
    mappedDate?: Date;
    mappedBy?: string;
    isActive?: boolean;
    createdBy: string;
}
export interface UpdatePeerEvaluationData {
    status?: PeerEvaluationStatus;
    isCompleted?: boolean;
    isActive?: boolean;
}
export interface PeerEvaluationDto {
    id: string;
    evaluateeId: string;
    evaluatorId: string;
    periodId: string;
    evaluationDate: Date;
    status: PeerEvaluationStatus;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    mappedDate: Date;
    mappedBy: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface PeerEvaluationFilter {
    evaluateeId?: string;
    evaluatorId?: string;
    periodId?: string;
    mappedBy?: string;
    status?: PeerEvaluationStatus;
    completedOnly?: boolean;
    uncompletedOnly?: boolean;
    pendingOnly?: boolean;
    inProgressOnly?: boolean;
    activeOnly?: boolean;
    inactiveOnly?: boolean;
    evaluationDateFrom?: Date;
    evaluationDateTo?: Date;
    mappedDateFrom?: Date;
    mappedDateTo?: Date;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export interface PeerEvaluationStatistics {
    totalEvaluations: number;
    statusCounts: Record<PeerEvaluationStatus, number>;
    completedEvaluations: number;
}
