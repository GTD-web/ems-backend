import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export declare class AddMultipleQuestionsToPeerEvaluationCommand {
    readonly peerEvaluationId: string;
    readonly questionIds: string[];
    readonly startDisplayOrder: number;
    readonly createdBy: string;
    constructor(peerEvaluationId: string, questionIds: string[], startDisplayOrder: number, createdBy: string);
}
export declare class AddMultipleQuestionsToPeerEvaluationHandler implements ICommandHandler<AddMultipleQuestionsToPeerEvaluationCommand, string[]> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: AddMultipleQuestionsToPeerEvaluationCommand): Promise<string[]>;
}
