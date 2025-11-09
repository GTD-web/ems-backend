import type { EvaluationRevisionRequest } from '../evaluation-revision-request.entity';
import type { EvaluationRevisionRequestRecipient } from '../evaluation-revision-request-recipient.entity';
import type { CreateRevisionRequestData, RevisionRequestFilter, RevisionRequestRecipientFilter } from '../evaluation-revision-request.types';
export interface IEvaluationRevisionRequestService {
    ID로_조회한다(id: string): Promise<EvaluationRevisionRequest | null>;
    필터로_조회한다(filter: RevisionRequestFilter): Promise<EvaluationRevisionRequest[]>;
    생성한다(data: CreateRevisionRequestData): Promise<EvaluationRevisionRequest>;
    저장한다(request: EvaluationRevisionRequest): Promise<EvaluationRevisionRequest>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    수신자의_요청목록을_조회한다(recipientId: string, filter?: RevisionRequestRecipientFilter): Promise<EvaluationRevisionRequestRecipient[]>;
    수신자를_조회한다(requestId: string, recipientId: string): Promise<EvaluationRevisionRequestRecipient | null>;
    수신자를_저장한다(recipient: EvaluationRevisionRequestRecipient): Promise<EvaluationRevisionRequestRecipient>;
    읽지않은_요청수를_조회한다(recipientId: string): Promise<number>;
}
