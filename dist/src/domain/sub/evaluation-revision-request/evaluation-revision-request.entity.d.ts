import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationRevisionRequest } from './interfaces/evaluation-revision-request.interface';
import type { RevisionRequestStepType, EvaluationRevisionRequestDto, CreateRevisionRequestData, RecipientType } from './evaluation-revision-request.types';
import { EvaluationRevisionRequestRecipient } from './evaluation-revision-request-recipient.entity';
export declare class EvaluationRevisionRequest extends BaseEntity<EvaluationRevisionRequestDto> implements IEvaluationRevisionRequest {
    evaluationPeriodId: string;
    employeeId: string;
    step: RevisionRequestStepType;
    comment: string;
    requestedBy: string;
    requestedAt: Date;
    recipients: EvaluationRevisionRequestRecipient[];
    constructor(data?: CreateRevisionRequestData);
    수신자를_추가한다(recipientId: string, recipientType: RecipientType, createdBy: string): void;
    DTO로_변환한다(): EvaluationRevisionRequestDto;
}
