import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { QuestionGroupMapping } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.entity';
export declare class MoveQuestionUpCommand {
    readonly mappingId: string;
    readonly updatedBy: string;
    constructor(mappingId: string, updatedBy: string);
}
export declare class MoveQuestionUpHandler implements ICommandHandler<MoveQuestionUpCommand, void> {
    private readonly questionGroupMappingRepository;
    private readonly logger;
    constructor(questionGroupMappingRepository: Repository<QuestionGroupMapping>);
    execute(command: MoveQuestionUpCommand): Promise<void>;
}
