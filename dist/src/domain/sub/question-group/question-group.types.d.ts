export interface CreateQuestionGroupDto {
    name: string;
    isDefault?: boolean;
    isDeletable?: boolean;
}
export interface UpdateQuestionGroupDto {
    name?: string;
    isDefault?: boolean;
    isDeletable?: boolean;
}
export interface QuestionGroupDto {
    id: string;
    name: string;
    isDefault: boolean;
    isDeletable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface QuestionGroupFilter {
    nameSearch?: string;
    isDefault?: boolean;
    isDeletable?: boolean;
}
