export declare class RequestPeerEvaluationDto {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    comment?: string;
    requestedBy?: string;
}
export declare class RequestPeerEvaluationToMultipleEvaluatorsDto {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    comment?: string;
    requestedBy?: string;
}
export declare class RequestMultiplePeerEvaluationsDto {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    comment?: string;
    requestedBy?: string;
}
export declare class RequestPartLeaderPeerEvaluationsDto {
    periodId: string;
    evaluatorIds?: string[];
    evaluateeIds?: string[];
    requestDeadline?: Date;
    questionIds?: string[];
    comment?: string;
    requestedBy?: string;
}
export declare class CreatePeerEvaluationBodyDto {
    evaluatorId?: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    createdBy?: string;
}
export declare class UpdatePeerEvaluationDto {
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
}
export declare class SubmitPeerEvaluationDto {
}
export declare class PeerEvaluationFilterDto {
    evaluatorId?: string;
    evaluateeId?: string;
    periodId?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class PeerEvaluationResponseDto {
    id: string;
    message: string;
}
export declare class PeerEvaluationRequestResult {
    evaluatorId?: string;
    evaluateeId?: string;
    success: boolean;
    evaluationId?: string;
    error?: {
        code: string;
        message: string;
    };
}
export declare class BulkRequestSummary {
    total: number;
    success: number;
    failed: number;
    partLeaderCount?: number;
}
export declare class BulkPeerEvaluationRequestResponseDto {
    results: PeerEvaluationRequestResult[];
    summary: BulkRequestSummary;
    message: string;
    ids?: string[];
    count?: number;
}
export declare class PeerEvaluationBasicDto {
    id: string;
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    evaluationDate: Date;
    status: string;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EmployeeInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
    rankName?: string;
    roles?: string[];
}
export declare class DepartmentInfoDto {
    id: string;
    name: string;
    code: string;
}
export declare class GetEvaluatorAssignedEvaluateesQueryDto {
    periodId?: string;
    includeCompleted?: boolean;
}
export declare class AssignedEvaluateeDto {
    evaluationId: string;
    evaluateeId: string;
    periodId: string;
    status: string;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    mappedDate: Date;
    isActive: boolean;
    comment?: string;
    evaluatee: EmployeeInfoDto | null;
    evaluateeDepartment: DepartmentInfoDto | null;
    mappedBy: EmployeeInfoDto | null;
}
export declare class EvaluationQuestionInDetailDto {
    id: string;
    text: string;
    minScore?: number;
    maxScore?: number;
    displayOrder: number;
    answer?: string;
    score?: number;
    answeredAt?: Date;
    answeredBy?: string;
}
export declare class EvaluationPeriodInfoDto {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
}
export declare class PeerEvaluationDetailResponseDto {
    id: string;
    evaluationDate: Date;
    status: string;
    isCompleted: boolean;
    completedAt?: Date;
    requestDeadline?: Date;
    mappedDate: Date;
    isActive: boolean;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    version: number;
    period?: EvaluationPeriodInfoDto | null;
    evaluator?: EmployeeInfoDto | null;
    evaluatorDepartment?: DepartmentInfoDto | null;
    evaluatee?: EmployeeInfoDto | null;
    evaluateeDepartment?: DepartmentInfoDto | null;
    mappedBy?: EmployeeInfoDto | null;
    questions: EvaluationQuestionInDetailDto[];
}
export declare class PeerEvaluationListResponseDto {
    evaluations: PeerEvaluationDetailResponseDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class PeerEvaluationAnswerItemDto {
    questionId: string;
    answer: string;
    score?: number;
}
export declare class UpsertPeerEvaluationAnswersDto {
    peerEvaluationId: string;
    answers: PeerEvaluationAnswerItemDto[];
}
export declare class UpsertPeerEvaluationAnswersResponseDto {
    savedCount: number;
    message: string;
}
