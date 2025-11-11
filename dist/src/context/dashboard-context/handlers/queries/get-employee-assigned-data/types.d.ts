export interface DeliverableInfo {
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
export interface AssignedProjectWithWbs {
    projectId: string;
    projectName: string;
    projectCode: string;
    assignedAt: Date;
    projectManager?: {
        id: string;
        name: string;
    } | null;
    wbsList: AssignedWbsInfo[];
}
export interface WbsEvaluationCriterion {
    criterionId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
}
export interface WbsPerformance {
    performanceResult?: string;
    isCompleted: boolean;
    completedAt?: Date;
}
export interface WbsSelfEvaluationInfo {
    selfEvaluationId?: string;
    evaluationContent?: string;
    score?: number;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    submittedAt?: Date;
}
export interface WbsDownwardEvaluationInfo {
    downwardEvaluationId?: string;
    evaluatorId?: string;
    evaluatorName?: string;
    evaluationContent?: string;
    score?: number;
    isCompleted: boolean;
    submittedAt?: Date;
}
export interface AssignedWbsInfo {
    wbsId: string;
    wbsName: string;
    wbsCode: string;
    weight: number;
    assignedAt: Date;
    criteria: WbsEvaluationCriterion[];
    performance?: WbsPerformance | null;
    selfEvaluation?: WbsSelfEvaluationInfo | null;
    primaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
    secondaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
    deliverables: DeliverableInfo[];
}
export interface EvaluationPeriodInfo {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    description?: string;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    maxSelfEvaluationRate: number;
}
export interface EmployeeInfo {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    departmentId: string;
    departmentName?: string;
    status: string;
}
export interface EmployeeAssignedDataResult {
    evaluationPeriod: EvaluationPeriodInfo;
    employee: EmployeeInfo;
    projects: AssignedProjectWithWbs[];
    summary: {
        totalProjects: number;
        totalWbs: number;
        completedPerformances: number;
        completedSelfEvaluations: number;
        selfEvaluation: {
            totalScore: number | null;
            grade: string | null;
            totalSelfEvaluations: number;
            submittedToEvaluatorCount: number;
            submittedToManagerCount: number;
            isSubmittedToEvaluator: boolean;
            isSubmittedToManager: boolean;
        };
        primaryDownwardEvaluation: {
            totalScore: number | null;
            grade: string | null;
        };
        secondaryDownwardEvaluation: {
            totalScore: number | null;
            grade: string | null;
        };
    };
}
