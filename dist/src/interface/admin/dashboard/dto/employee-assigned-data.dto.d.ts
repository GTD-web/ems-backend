import type { EvaluationPeriodInfo, EmployeeInfo, AssignedProjectWithWbs, AssignedWbsInfo, WbsEvaluationCriterion, WbsPerformance, WbsSelfEvaluationInfo, WbsDownwardEvaluationInfo, EmployeeAssignedDataResult, DeliverableInfo } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/types';
type AssignmentSummary = EmployeeAssignedDataResult['summary'];
type EvaluationScore = AssignmentSummary['primaryDownwardEvaluation'];
type SelfEvaluationSummary = AssignmentSummary['selfEvaluation'];
export declare class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
    id: string;
    name: string;
    startDate: Date;
    status: string;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    maxSelfEvaluationRate: number;
    endDate?: Date;
    description?: string;
}
export declare class EmployeeInfoDto implements EmployeeInfo {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    departmentId: string;
    departmentName?: string;
    status: string;
}
export declare class WbsEvaluationCriterionDto implements WbsEvaluationCriterion {
    criterionId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
}
export declare class WbsPerformanceDto implements WbsPerformance {
    performanceResult?: string;
    isCompleted: boolean;
    completedAt?: Date;
}
export declare class WbsSelfEvaluationDto implements WbsSelfEvaluationInfo {
    selfEvaluationId?: string;
    evaluationContent?: string;
    score?: number;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    submittedAt?: Date;
}
export declare class DeliverableInfoDto implements DeliverableInfo {
    id: string;
    name: string;
    description?: string;
    type: string;
    filePath?: string;
    employeeId?: string;
    mappedDate?: Date;
    mappedBy?: string;
    isActive: boolean;
    createdAt: Date;
}
export declare class WbsDownwardEvaluationDto implements WbsDownwardEvaluationInfo {
    downwardEvaluationId?: string;
    evaluatorId?: string;
    evaluatorName?: string;
    evaluationContent?: string;
    score?: number;
    isCompleted: boolean;
    submittedAt?: Date;
}
export declare class AssignedWbsInfoDto implements AssignedWbsInfo {
    wbsId: string;
    wbsName: string;
    wbsCode: string;
    weight: number;
    assignedAt: Date;
    criteria: WbsEvaluationCriterionDto[];
    performance?: WbsPerformanceDto | null;
    selfEvaluation?: WbsSelfEvaluationDto | null;
    primaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;
    secondaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;
    deliverables: DeliverableInfoDto[];
}
export declare class ProjectManagerDto {
    id: string;
    name: string;
}
export declare class EvaluationScoreDto implements EvaluationScore {
    totalScore: number | null;
    grade: string | null;
}
export declare class SelfEvaluationSummaryDto implements SelfEvaluationSummary {
    totalScore: number | null;
    grade: string | null;
    totalSelfEvaluations: number;
    submittedToEvaluatorCount: number;
    submittedToManagerCount: number;
    isSubmittedToEvaluator: boolean;
    isSubmittedToManager: boolean;
}
export declare class AssignmentSummaryDto implements AssignmentSummary {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
    selfEvaluation: SelfEvaluationSummaryDto;
    primaryDownwardEvaluation: EvaluationScoreDto;
    secondaryDownwardEvaluation: EvaluationScoreDto;
}
export declare class AssignedProjectWithWbsDto implements AssignedProjectWithWbs {
    projectId: string;
    projectName: string;
    projectCode: string;
    assignedAt: Date;
    projectManager?: ProjectManagerDto | null;
    wbsList: AssignedWbsInfoDto[];
}
export declare class EmployeeAssignedDataResponseDto implements EmployeeAssignedDataResult {
    evaluationPeriod: EvaluationPeriodInfoDto;
    employee: EmployeeInfoDto;
    projects: AssignedProjectWithWbsDto[];
    summary: AssignmentSummaryDto;
}
export declare class EvaluateeAssignedDataDto {
    employee: EmployeeInfoDto;
    projects: AssignedProjectWithWbsDto[];
    summary: AssignmentSummaryDto;
}
export declare class EvaluatorAssignedEmployeesDataResponseDto {
    evaluationPeriod: EvaluationPeriodInfoDto;
    evaluator: EmployeeInfoDto;
    evaluatee: EvaluateeAssignedDataDto;
}
export {};
