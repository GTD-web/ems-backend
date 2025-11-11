export interface CreateQuestionGroupMappingDto {
    groupId: string;
    questionId: string;
    displayOrder?: number;
}
export interface UpdateQuestionGroupMappingDto {
    displayOrder?: number;
}
export interface QuestionGroupMappingDto {
    id: string;
    groupId: string;
    questionId: string;
    displayOrder: number;
    group?: {
        id: string;
        name: string;
        isDefault: boolean;
        isDeletable: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    question?: {
        id: string;
        text: string;
        minScore?: number;
        maxScore?: number;
        createdAt: Date;
        updatedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface QuestionGroupMappingFilter {
    groupId?: string;
    questionId?: string;
}
