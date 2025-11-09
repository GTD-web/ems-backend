import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../domain/sub/question-group-mapping/question-group-mapping.entity';
import { QuestionGroupMappingDto } from '../../../domain/sub/question-group-mapping/question-group-mapping.types';
export declare class MapQuestionsToGroupCommand implements ICommand {
    readonly groupId: string;
    readonly questionIds: string[];
    readonly createdBy: string;
    constructor(groupId: string, questionIds: string[], createdBy: string);
}
export declare class MapQuestionsToGroupHandler implements ICommandHandler<MapQuestionsToGroupCommand, QuestionGroupMappingDto[]> {
    private readonly questionGroupMappingRepository;
    constructor(questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    execute(command: MapQuestionsToGroupCommand): Promise<QuestionGroupMappingDto[]>;
}
