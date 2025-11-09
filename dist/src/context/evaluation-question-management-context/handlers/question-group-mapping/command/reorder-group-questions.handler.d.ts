import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';
export declare class ReorderGroupQuestionsCommand {
    readonly groupId: string;
    readonly questionIds: string[];
    readonly updatedBy: string;
    constructor(groupId: string, questionIds: string[], updatedBy: string);
}
export declare class ReorderGroupQuestionsHandler implements ICommandHandler<ReorderGroupQuestionsCommand, void> {
    private readonly questionGroupMappingRepository;
    private readonly logger;
    constructor(questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    execute(command: ReorderGroupQuestionsCommand): Promise<void>;
}
