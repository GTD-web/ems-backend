import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
export declare class CancelPeerEvaluationsByPeriodCommand {
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly cancelledBy: string;
    constructor(evaluateeId: string, periodId: string, cancelledBy: string);
}
export declare class CancelPeerEvaluationsByPeriodHandler implements ICommandHandler<CancelPeerEvaluationsByPeriodCommand> {
    private readonly peerEvaluationService;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService);
    execute(command: CancelPeerEvaluationsByPeriodCommand): Promise<{
        cancelledCount: number;
    }>;
}
