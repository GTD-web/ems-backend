import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { QuestionGroupMappingService } from '@domain/sub/question-group-mapping/question-group-mapping.service';
export declare class AddQuestionGroupToPeerEvaluationCommand {
    readonly peerEvaluationId: string;
    readonly questionGroupId: string;
    readonly startDisplayOrder: number;
    readonly createdBy: string;
    constructor(peerEvaluationId: string, questionGroupId: string, startDisplayOrder: number, createdBy: string);
}
export declare class AddQuestionGroupToPeerEvaluationHandler implements ICommandHandler<AddQuestionGroupToPeerEvaluationCommand, string[]> {
    private readonly peerEvaluationQuestionMappingService;
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService, questionGroupMappingService: QuestionGroupMappingService);
    execute(command: AddQuestionGroupToPeerEvaluationCommand): Promise<string[]>;
}
