export interface CreateEvaluationResponseDto {
    questionId: string;
    evaluationId: string;
    evaluationType: EvaluationResponseType;
    answer?: string;
    score?: number;
}
export interface UpdateEvaluationResponseDto {
    answer?: string;
    score?: number;
}
export interface EvaluationResponseDto {
    id: string;
    questionId: string;
    evaluationId: string;
    evaluationType: EvaluationResponseType;
    answer?: string;
    score?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface EvaluationResponseFilter {
    questionId?: string;
    evaluationId?: string;
    evaluationType?: EvaluationResponseType;
    answerSearch?: string;
    minScore?: number;
    maxScore?: number;
}
export declare enum EvaluationResponseType {
    SELF = "self",
    PEER = "peer",
    ADDITIONAL = "additional",
    DOWNWARD = "downward"
}
export declare const EvaluationResponseTypeLabels: {
    readonly self: "자기평가";
    readonly peer: "동료평가";
    readonly additional: "추가평가";
    readonly downward: "하향평가";
};
export interface EvaluationResponseStats {
    totalCount: number;
    countByType: Record<EvaluationResponseType, number>;
    averageScore?: number;
    maxScore?: number;
    minScore?: number;
}
