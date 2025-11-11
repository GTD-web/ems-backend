import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
export declare class AddQuestionToPeerEvaluationCommand {
    readonly peerEvaluationId: string;
    readonly questionId: string;
    readonly displayOrder: number;
    readonly questionGroupId: string | undefined;
    readonly createdBy: string;
    constructor(peerEvaluationId: string, questionId: string, displayOrder: number, questionGroupId: string | undefined, createdBy: string);
}
export declare class AddQuestionToPeerEvaluationHandler implements ICommandHandler<AddQuestionToPeerEvaluationCommand, string> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService);
    execute(command: AddQuestionToPeerEvaluationCommand): Promise<string>;
}
