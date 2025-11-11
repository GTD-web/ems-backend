import { StepApprovalStatusEnum } from '@interface/admin/step-approval/dto/update-step-approval.dto';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
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
    evaluationPeriod: EvaluationPeriodInfoDto;
    employee: EmployeeInfoDto;
    step: string;
    comment: string;
    requestedBy: string;
    requestedAt: Date;
    recipientId: string;
    recipientType: RecipientType;
    isRead: boolean;
    readAt: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    approvalStatus: StepApprovalStatusEnum;
}
export declare class UnreadCountResponseDto {
    unreadCount: number;
}
