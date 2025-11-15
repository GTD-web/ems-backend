import { EvaluationPeriodStatus, EvaluationPeriodPhase, EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
export declare class GradeRangeResponseDto {
    grade: string;
    minRange: number;
    maxRange: number;
}
export declare class EvaluationPeriodResponseDto implements EvaluationPeriodDto {
    id: string;
    name: string;
    startDate: Date;
    description?: string;
    status: EvaluationPeriodStatus;
    currentPhase?: EvaluationPeriodPhase;
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
    completedDate?: Date;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    maxSelfEvaluationRate: number;
    gradeRanges: GradeRangeResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class EvaluationPeriodListResponseDto {
    items: EvaluationPeriodResponseDto[];
    total: number;
    page: number;
    limit: number;
}
