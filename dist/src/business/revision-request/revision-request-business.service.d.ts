import { CommandBus } from '@nestjs/cqrs';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import type { RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
export declare class RevisionRequestBusinessService {
    private readonly revisionRequestContextService;
    private readonly commandBus;
    private readonly logger;
    constructor(revisionRequestContextService: RevisionRequestContextService, commandBus: CommandBus);
    재작성완료_응답을_제출한다(requestId: string, recipientId: string, responseComment: string): Promise<void>;
    평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, step: RevisionRequestStepType, responseComment: string): Promise<void>;
}
