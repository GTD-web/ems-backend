import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
export declare class DeleteQuestionGroupCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy: string);
}
export declare class DeleteQuestionGroupHandler implements ICommandHandler<DeleteQuestionGroupCommand, void> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(command: DeleteQuestionGroupCommand): Promise<void>;
}
