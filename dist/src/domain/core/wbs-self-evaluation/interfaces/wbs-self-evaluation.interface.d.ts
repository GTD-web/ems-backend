export interface IWbsSelfEvaluation {
    id: string;
    evaluationDate: Date;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
