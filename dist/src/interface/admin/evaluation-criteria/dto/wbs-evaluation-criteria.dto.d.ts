export declare class CreateWbsEvaluationCriteriaDto {
    wbsItemId: string;
    criteria: string;
    importance: number;
}
export declare class UpsertWbsEvaluationCriteriaBodyDto {
    criteria: string;
    importance: number;
}
export declare class UpdateWbsEvaluationCriteriaDto {
    criteria?: string;
    importance?: number;
}
export declare class WbsEvaluationCriteriaFilterDto {
    wbsItemId?: string;
    criteriaSearch?: string;
    criteriaExact?: string;
}
export declare class EvaluationPeriodManualSettingsDto {
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
}
export declare class WbsEvaluationCriteriaDto {
    id: string;
    wbsItemId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WbsEvaluationCriteriaListResponseDto {
    criteria: WbsEvaluationCriteriaDto[];
    evaluationPeriodSettings: EvaluationPeriodManualSettingsDto;
}
export declare class WbsEvaluationCriteriaDetailDto {
    id: string;
    criteria: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
    wbsItem?: {
        id: string;
        wbsCode: string;
        title: string;
        status: string;
        level: number;
        startDate: Date;
        endDate: Date;
        progressPercentage: string;
    } | null;
}
export declare class WbsItemEvaluationCriteriaResponseDto {
    wbsItemId: string;
    criteria: WbsEvaluationCriteriaDto[];
}
