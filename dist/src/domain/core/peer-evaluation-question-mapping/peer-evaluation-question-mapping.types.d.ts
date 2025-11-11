export interface CreatePeerEvaluationQuestionMappingDto {
    peerEvaluationId: string;
    questionId: string;
    questionGroupId?: string;
    displayOrder: number;
}
export interface UpdatePeerEvaluationQuestionMappingDto {
    displayOrder?: number;
}
export interface PeerEvaluationQuestionMappingDto {
    id: string;
    peerEvaluationId: string;
    questionId: string;
    questionGroupId?: string;
    displayOrder: number;
    answer?: string;
    score?: number;
    answeredAt?: Date;
    answeredBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PeerEvaluationQuestionMappingFilter {
    peerEvaluationId?: string;
    questionId?: string;
    questionGroupId?: string;
}
