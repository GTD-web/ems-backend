import { GradeRange } from '../../../domain/core/evaluation-period/evaluation-period.types';
export interface CreateEvaluationPeriodMinimalDto {
    name: string;
    startDate: Date;
    peerEvaluationDeadline: Date;
    description?: string;
    maxSelfEvaluationRate: number;
    gradeRanges: GradeRange[];
}
export interface UpdateEvaluationPeriodScheduleDto {
    startDate?: Date;
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
}
export interface UpdateEvaluationSetupDeadlineDto {
    evaluationSetupDeadline: Date;
}
export interface UpdatePerformanceDeadlineDto {
    performanceDeadline: Date;
}
export interface UpdateSelfEvaluationDeadlineDto {
    selfEvaluationDeadline: Date;
}
export interface UpdatePeerEvaluationDeadlineDto {
    peerEvaluationDeadline: Date;
}
export interface UpdateEvaluationPeriodStartDateDto {
    startDate: Date;
}
export interface UpdateEvaluationPeriodBasicDto {
    name?: string;
    description?: string;
    maxSelfEvaluationRate?: number;
}
export interface UpdateGradeRangesDto {
    gradeRanges: GradeRange[];
}
export interface UpdateCriteriaSettingPermissionDto {
    enabled: boolean;
}
export interface UpdateSelfEvaluationSettingPermissionDto {
    enabled: boolean;
}
export interface UpdateFinalEvaluationSettingPermissionDto {
    enabled: boolean;
}
export interface UpdateManualSettingPermissionsDto {
    criteriaSettingEnabled?: boolean;
    selfEvaluationSettingEnabled?: boolean;
    finalEvaluationSettingEnabled?: boolean;
}
