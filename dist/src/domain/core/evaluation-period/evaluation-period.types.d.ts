export declare enum EvaluationPeriodStatus {
    WAITING = "waiting",
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed"
}
export declare enum EvaluationPeriodPhase {
    WAITING = "waiting",
    EVALUATION_SETUP = "evaluation-setup",
    PERFORMANCE = "performance",
    SELF_EVALUATION = "self-evaluation",
    PEER_EVALUATION = "peer-evaluation",
    CLOSURE = "closure"
}
export interface CreateEvaluationPeriodDto {
    name: string;
    startDate: Date;
    description?: string;
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
    maxSelfEvaluationRate?: number;
    gradeRanges?: CreateGradeRangeDto[];
}
export interface UpdateEvaluationPeriodDto {
    name?: string;
    startDate?: Date;
    description?: string;
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
    maxSelfEvaluationRate?: number;
    gradeRanges?: CreateGradeRangeDto[];
}
export interface EvaluationPeriodDto {
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
    gradeRanges: GradeRange[];
    createdAt: Date;
    updatedAt: Date;
}
export interface EvaluationPeriodFilter {
    status?: EvaluationPeriodStatus;
    currentPhase?: EvaluationPeriodPhase;
    startDateFrom?: Date;
    endDateTo?: Date;
    activeOnly?: boolean;
    maxSelfEvaluationRateFrom?: number;
    maxSelfEvaluationRateTo?: number;
}
export interface PhaseDeadlineDto {
    phase: EvaluationPeriodPhase;
    deadline: Date;
}
export interface PhaseDeadlineStatusDto {
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
    deadlineStatus: {
        evaluationSetupExpired: boolean;
        performanceExpired: boolean;
        selfEvaluationExpired: boolean;
        peerEvaluationExpired: boolean;
    };
}
export interface UpdatePhaseDeadlinesDto {
    evaluationSetupDeadline?: Date;
    performanceDeadline?: Date;
    selfEvaluationDeadline?: Date;
    peerEvaluationDeadline?: Date;
}
export declare enum GradeType {
    S = "S",
    A = "A",
    B = "B",
    C = "C",
    F = "F"
}
export declare enum SubGradeType {
    PLUS = "plus",
    NONE = "none",
    MINUS = "minus"
}
export interface SubGradeInfo {
    type: SubGradeType;
    minRange: number;
    maxRange: number;
}
export interface GradeRange {
    grade: string;
    minRange: number;
    maxRange: number;
    subGrades?: SubGradeInfo[];
}
export interface CreateGradeRangeDto {
    grade: string;
    minRange: number;
    maxRange: number;
    subGrades?: SubGradeInfo[];
}
export interface ScoreGradeMapping {
    score: number;
    grade: string;
    subGrade?: SubGradeType;
    finalGrade: string;
}
