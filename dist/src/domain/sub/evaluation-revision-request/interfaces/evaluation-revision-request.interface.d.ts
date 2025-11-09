import type { RevisionRequestStepType, EvaluationRevisionRequestDto, RecipientType } from '../evaluation-revision-request.types';
import type { EvaluationRevisionRequestRecipient } from '../evaluation-revision-request-recipient.entity';
export interface IEvaluationRevisionRequest {
    id: string;
    evaluationPeriodId: string;
    employeeId: string;
    step: RevisionRequestStepType;
    comment: string;
    requestedBy: string;
    requestedAt: Date;
    recipients: EvaluationRevisionRequestRecipient[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    수신자를_추가한다(recipientId: string, recipientType: RecipientType, createdBy: string): void;
    DTO로_변환한다(): EvaluationRevisionRequestDto;
}
