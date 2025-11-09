import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroup } from '../../../domain/sub/question-group/question-group.entity';
import { QuestionGroupDto } from '../../../domain/sub/question-group/question-group.types';
export declare class CreateTestQuestionGroupsCommand implements ICommand {
    readonly createdBy: string;
    constructor(createdBy: string);
}
export declare class CreateTestQuestionGroupsHandler implements ICommandHandler<CreateTestQuestionGroupsCommand, QuestionGroupDto[]> {
    private readonly questionGroupRepository;
    constructor(questionGroupRepository: Repository<QuestionGroup>);
    execute(command: CreateTestQuestionGroupsCommand): Promise<QuestionGroupDto[]>;
}
