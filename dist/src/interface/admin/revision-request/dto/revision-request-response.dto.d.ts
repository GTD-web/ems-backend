export declare class EmployeeInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName?: string;
    rankName?: string;
}
export declare class EvaluationPeriodInfoDto {
    id: string;
    name: string;
}
export declare class RevisionRequestResponseDto {
    requestId: string;
    evaluationPeriodId: string;
    evaluationPeriod: EvaluationPeriodInfoDto;
    employeeId: string;
    employee: EmployeeInfoDto;
    step: string;
    comment: string;
    requestedBy: string;
    requestedAt: Date;
    recipientId: string;
    recipientType: string;
    isRead: boolean;
    readAt: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UnreadCountResponseDto {
    unreadCount: number;
}
