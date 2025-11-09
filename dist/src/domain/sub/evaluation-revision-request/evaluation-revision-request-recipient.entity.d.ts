import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationRevisionRequestRecipient } from './interfaces/evaluation-revision-request-recipient.interface';
import { RecipientType, type EvaluationRevisionRequestRecipientDto, type CreateRecipientData } from './evaluation-revision-request.types';
import { EvaluationRevisionRequest } from './evaluation-revision-request.entity';
export declare class EvaluationRevisionRequestRecipient extends BaseEntity<EvaluationRevisionRequestRecipientDto> implements IEvaluationRevisionRequestRecipient {
    revisionRequestId: string;
    revisionRequest: EvaluationRevisionRequest;
    recipientId: string;
    recipientType: RecipientType;
    isRead: boolean;
    readAt: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    constructor(data?: CreateRecipientData);
    읽음처리한다(): void;
    읽지않음으로_변경한다(): void;
    읽음상태인가(): boolean;
    재작성완료_응답한다(responseComment: string): void;
    재작성완료_응답을_취소한다(): void;
    특정수신자의_요청인가(recipientId: string): boolean;
    DTO로_변환한다(): EvaluationRevisionRequestRecipientDto;
}
