import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class SubmitPeerEvaluationCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitPeerEvaluationHandler implements ICommandHandler<SubmitPeerEvaluationCommand> {
    private readonly peerEvaluationService;
    private readonly peerEvaluationQuestionMappingService;
    private readonly transactionManager;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService, peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService, transactionManager: TransactionManagerService);
    execute(command: SubmitPeerEvaluationCommand): Promise<void>;
}
