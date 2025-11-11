export declare class CreateQuestionGroupDto {
    name: string;
    isDefault?: boolean;
}
export declare class UpdateQuestionGroupDto {
    name?: string;
    isDefault?: boolean;
}
export declare class QuestionGroupResponseDto {
    id: string;
    name: string;
    isDefault: boolean;
    isDeletable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateEvaluationQuestionDto {
    text: string;
    minScore?: number;
    maxScore?: number;
    groupId?: string;
    displayOrder?: number;
}
export declare class UpdateEvaluationQuestionDto {
    text?: string;
    minScore?: number;
    maxScore?: number;
}
export declare class EvaluationQuestionResponseDto {
    id: string;
    text: string;
    minScore?: number;
    maxScore?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AddQuestionToGroupDto {
    groupId: string;
    questionId: string;
    displayOrder?: number;
}
export declare class AddMultipleQuestionsToGroupDto {
    groupId: string;
    questionIds: string[];
    startDisplayOrder?: number;
}
export declare class ReorderGroupQuestionsDto {
    groupId: string;
    questionIds: string[];
}
export declare class QuestionGroupMappingResponseDto {
    id: string;
    groupId: string;
    questionId: string;
    displayOrder: number;
    group?: QuestionGroupResponseDto;
    question?: EvaluationQuestionResponseDto;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SuccessResponseDto {
    id: string;
    message: string;
}
export declare class BatchSuccessResponseDto {
    ids: string[];
    message: string;
    successCount: number;
    totalCount: number;
}
