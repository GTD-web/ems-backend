export declare class GetEmployeeEvaluationPeriodStatusDto {
    evaluationPeriodId: string;
    employeeId: string;
}
export declare class EvaluationPeriodManualSettingsDto {
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
}
export declare class EvaluationPeriodInfoDto {
    id: string;
    name: string;
    status: string;
    currentPhase: string;
    startDate: Date;
    endDate?: Date;
    manualSettings: EvaluationPeriodManualSettingsDto;
}
export declare class EmployeeInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
}
export declare class EvaluatorInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
}
export declare class EvaluationCriteriaInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    assignedProjectCount: number;
    assignedWbsCount: number;
}
export declare class WbsCriteriaInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    wbsWithCriteriaCount: number;
}
export declare class EvaluationLineInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    hasPrimaryEvaluator: boolean;
    hasSecondaryEvaluator: boolean;
}
export declare class CriteriaSetupDto {
    status: 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    evaluationCriteria: EvaluationCriteriaInfoDto;
    wbsCriteria: WbsCriteriaInfoDto;
    evaluationLine: EvaluationLineInfoDto;
}
export declare class PerformanceInputDto {
    status: 'complete' | 'in_progress' | 'none';
    totalWbsCount: number;
    inputCompletedCount: number;
}
export declare class SelfEvaluationInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    totalMappingCount: number;
    completedMappingCount: number;
    isSubmittedToEvaluator: boolean;
    isSubmittedToManager: boolean;
    totalScore: number | null;
    grade: string | null;
}
export declare class PrimaryDownwardEvaluationDto {
    evaluator: EvaluatorInfoDto | null;
    status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
    totalScore: number | null;
    grade: string | null;
}
export declare class SecondaryEvaluatorDto {
    evaluator: EvaluatorInfoDto;
    status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
}
export declare class SecondaryDownwardEvaluationDto {
    status: 'complete' | 'in_progress' | 'none' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    evaluators: SecondaryEvaluatorDto[];
    isSubmitted: boolean;
    totalScore: number | null;
    grade: string | null;
}
export declare class DownwardEvaluationInfoDto {
    primary: PrimaryDownwardEvaluationDto;
    secondary: SecondaryDownwardEvaluationDto;
}
export declare class PeerEvaluationInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    totalRequestCount: number;
    completedRequestCount: number;
}
export declare class FinalEvaluationInfoDto {
    status: 'complete' | 'in_progress' | 'none';
    evaluationGrade: string | null;
    jobGrade: string | null;
    jobDetailedGrade: string | null;
    isConfirmed: boolean;
    confirmedAt: Date | null;
}
export declare class ExclusionInfoDto {
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedAt?: Date | null;
}
export declare class SecondaryEvaluationStatusDto {
    evaluatorId: string;
    evaluatorName: string;
    evaluatorEmployeeNumber: string;
    evaluatorEmail: string;
    status: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    approvedBy: string | null;
    approvedAt: Date | null;
    revisionRequestId: string | null;
    revisionComment: string | null;
    isRevisionCompleted: boolean;
    revisionCompletedAt: Date | null;
    responseComment: string | null;
}
export declare class StepApprovalInfoDto {
    criteriaSettingStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    criteriaSettingApprovedBy: string | null;
    criteriaSettingApprovedAt: Date | null;
    selfEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    selfEvaluationApprovedBy: string | null;
    selfEvaluationApprovedAt: Date | null;
    primaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    primaryEvaluationApprovedBy: string | null;
    primaryEvaluationApprovedAt: Date | null;
    secondaryEvaluationStatuses: SecondaryEvaluationStatusDto[];
    secondaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    secondaryEvaluationApprovedBy: string | null;
    secondaryEvaluationApprovedAt: Date | null;
}
export declare class EmployeeEvaluationPeriodStatusResponseDto {
    mappingId: string;
    employeeId: string;
    isEvaluationTarget: boolean;
    evaluationPeriod: EvaluationPeriodInfoDto | null;
    employee: EmployeeInfoDto | null;
    exclusionInfo: ExclusionInfoDto;
    criteriaSetup: CriteriaSetupDto;
    performanceInput: PerformanceInputDto;
    selfEvaluation: SelfEvaluationInfoDto;
    downwardEvaluation: DownwardEvaluationInfoDto;
    stepApproval: StepApprovalInfoDto;
    peerEvaluation: PeerEvaluationInfoDto;
    finalEvaluation: FinalEvaluationInfoDto;
}
