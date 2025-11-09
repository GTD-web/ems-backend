import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export declare class UpdatePeerEvaluationQuestionOrderCommand {
    readonly mappingId: string;
    readonly newDisplayOrder: number;
    readonly updatedBy: string;
    constructor(mappingId: string, newDisplayOrder: number, updatedBy: string);
}
export declare class UpdatePeerEvaluationQuestionOrderHandler implements ICommandHandler<UpdatePeerEvaluationQuestionOrderCommand, void> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: UpdatePeerEvaluationQuestionOrderCommand): Promise<void>;
}
