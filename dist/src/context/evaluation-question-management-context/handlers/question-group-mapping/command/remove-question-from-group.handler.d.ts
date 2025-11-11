import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
export declare class RemoveQuestionFromGroupCommand {
    readonly mappingId: string;
    readonly deletedBy: string;
    constructor(mappingId: string, deletedBy: string);
}
export declare class RemoveQuestionFromGroupHandler implements ICommandHandler<RemoveQuestionFromGroupCommand, void> {
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService);
    execute(command: RemoveQuestionFromGroupCommand): Promise<void>;
}
