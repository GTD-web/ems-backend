import type { DownwardEvaluationType } from '../downward-evaluation.types';
export interface IDownwardEvaluation {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsId: string;
    periodId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    evaluationDate: Date;
    evaluationType: DownwardEvaluationType;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
