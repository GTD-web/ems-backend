import type { PeerEvaluationStatus } from '../peer-evaluation.types';
export interface IPeerEvaluation {
    id: string;
    evaluateeId: string;
    evaluatorId: string;
    periodId: string;
    evaluationDate: Date;
    status: PeerEvaluationStatus;
    isCompleted: boolean;
    completedAt?: Date;
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
