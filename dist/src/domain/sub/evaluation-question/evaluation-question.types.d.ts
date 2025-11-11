export interface CreateEvaluationQuestionDto {
    text: string;
    minScore?: number;
    maxScore?: number;
    groupId?: string;
    displayOrder?: number;
}
export interface UpdateEvaluationQuestionDto {
    text?: string;
    minScore?: number;
    maxScore?: number;
}
export interface EvaluationQuestionDto {
    id: string;
    text: string;
    minScore?: number;
    maxScore?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface EvaluationQuestionFilter {
    textSearch?: string;
}
