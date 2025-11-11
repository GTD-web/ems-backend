import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
export declare class CancelPeerEvaluationCommand {
    readonly evaluationId: string;
    readonly cancelledBy: string;
    constructor(evaluationId: string, cancelledBy: string);
}
export declare class CancelPeerEvaluationHandler implements ICommandHandler<CancelPeerEvaluationCommand> {
    private readonly peerEvaluationService;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService);
    execute(command: CancelPeerEvaluationCommand): Promise<void>;
}
