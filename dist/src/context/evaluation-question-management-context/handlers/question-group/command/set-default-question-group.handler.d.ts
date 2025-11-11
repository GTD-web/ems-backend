import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
export declare class SetDefaultQuestionGroupCommand {
    readonly groupId: string;
    readonly updatedBy: string;
    constructor(groupId: string, updatedBy: string);
}
export declare class SetDefaultQuestionGroupHandler implements ICommandHandler<SetDefaultQuestionGroupCommand, void> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(command: SetDefaultQuestionGroupCommand): Promise<void>;
}
