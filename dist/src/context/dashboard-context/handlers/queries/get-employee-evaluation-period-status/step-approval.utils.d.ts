import { Repository } from 'typeorm';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
export interface EvaluatorRevisionRequestStatus {
    evaluatorId: string;
    status: StepApprovalStatus;
    revisionRequestId: string | null;
    revisionComment: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    requestedAt: Date | null;
}
export declare function 평가자별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, revisionRequestRepository: Repository<EvaluationRevisionRequest>, revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>): Promise<EvaluatorRevisionRequestStatus>;
export declare function 일차평가_단계승인_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, revisionRequestRepository: Repository<EvaluationRevisionRequest>, revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>): Promise<EvaluatorRevisionRequestStatus>;
export declare function 평가자들별_2차평가_단계승인_상태를_조회한다(evaluationPeriodId: string, employeeId: string, evaluatorIds: string[], revisionRequestRepository: Repository<EvaluationRevisionRequest>, revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>): Promise<EvaluatorRevisionRequestStatus[]>;
export declare function 자기평가_단계승인_상태를_조회한다(evaluationPeriodId: string, employeeId: string, revisionRequestRepository: Repository<EvaluationRevisionRequest>, revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>): Promise<{
    status: StepApprovalStatus;
    revisionRequestId: string | null;
    revisionComment: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    requestedAt: Date | null;
}>;
