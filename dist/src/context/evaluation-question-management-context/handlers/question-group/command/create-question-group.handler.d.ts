import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { CreateQuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';
export declare class CreateQuestionGroupCommand {
    readonly data: CreateQuestionGroupDto;
    readonly createdBy: string;
    constructor(data: CreateQuestionGroupDto, createdBy: string);
}
export declare class CreateQuestionGroupHandler implements ICommandHandler<CreateQuestionGroupCommand, string> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(command: CreateQuestionGroupCommand): Promise<string>;
}
