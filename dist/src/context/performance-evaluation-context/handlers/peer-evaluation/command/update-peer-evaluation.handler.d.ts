import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationService } from '../../../../../domain/core/peer-evaluation/peer-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class UpdatePeerEvaluationCommand {
    readonly evaluationId: string;
    readonly updatedBy: string;
    constructor(evaluationId: string, updatedBy?: string);
}
export declare class UpdatePeerEvaluationHandler implements ICommandHandler<UpdatePeerEvaluationCommand> {
    private readonly peerEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService, transactionManager: TransactionManagerService);
    execute(command: UpdatePeerEvaluationCommand): Promise<void>;
}
