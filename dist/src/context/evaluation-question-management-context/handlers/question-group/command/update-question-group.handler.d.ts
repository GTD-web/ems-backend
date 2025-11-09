import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { UpdateQuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';
export declare class UpdateQuestionGroupCommand {
    readonly id: string;
    readonly data: UpdateQuestionGroupDto;
    readonly updatedBy: string;
    constructor(id: string, data: UpdateQuestionGroupDto, updatedBy: string);
}
export declare class UpdateQuestionGroupHandler implements ICommandHandler<UpdateQuestionGroupCommand, void> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(command: UpdateQuestionGroupCommand): Promise<void>;
}
