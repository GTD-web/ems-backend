import { BaseEntity } from '@libs/database/base/base.entity';
import { ISecondaryEvaluationStepApproval } from './interfaces/secondary-evaluation-step-approval.interface';
import type { SecondaryEvaluationStepApprovalDto, CreateSecondaryEvaluationStepApprovalData } from './secondary-evaluation-step-approval.types';
import { StepApprovalStatus } from '../employee-evaluation-step-approval/employee-evaluation-step-approval.types';
export declare class SecondaryEvaluationStepApproval extends BaseEntity<SecondaryEvaluationStepApprovalDto> implements ISecondaryEvaluationStepApproval {
    evaluationPeriodEmployeeMappingId: string;
    evaluatorId: string;
    status: StepApprovalStatus;
    approvedBy: string | null;
    approvedAt: Date | null;
    revisionRequestId: string | null;
    constructor(data?: CreateSecondaryEvaluationStepApprovalData);
    승인한다(approvedBy: string): void;
    대기로_변경한다(updatedBy: string): void;
    재작성요청상태로_변경한다(updatedBy: string, revisionRequestId: string): void;
    재작성완료상태로_변경한다(updatedBy: string, revisionRequestId?: string | null): void;
    DTO로_변환한다(): SecondaryEvaluationStepApprovalDto;
}
