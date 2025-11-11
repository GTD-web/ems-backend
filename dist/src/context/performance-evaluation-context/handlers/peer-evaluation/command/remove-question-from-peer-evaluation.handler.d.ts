import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export declare class RemoveQuestionFromPeerEvaluationCommand {
    readonly mappingId: string;
    readonly deletedBy: string;
    constructor(mappingId: string, deletedBy: string);
}
export declare class RemoveQuestionFromPeerEvaluationHandler implements ICommandHandler<RemoveQuestionFromPeerEvaluationCommand, void> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: RemoveQuestionFromPeerEvaluationCommand): Promise<void>;
}
