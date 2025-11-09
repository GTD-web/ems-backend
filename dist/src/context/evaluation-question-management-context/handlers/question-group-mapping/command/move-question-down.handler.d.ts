import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';
export declare class MoveQuestionDownCommand {
    readonly mappingId: string;
    readonly updatedBy: string;
    constructor(mappingId: string, updatedBy: string);
}
export declare class MoveQuestionDownHandler implements ICommandHandler<MoveQuestionDownCommand, void> {
    private readonly questionGroupMappingRepository;
    private readonly logger;
    constructor(questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    execute(command: MoveQuestionDownCommand): Promise<void>;
}
