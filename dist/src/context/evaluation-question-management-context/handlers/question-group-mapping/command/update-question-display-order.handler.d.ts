import { ICommandHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
export declare class UpdateQuestionDisplayOrderCommand {
    readonly mappingId: string;
    readonly displayOrder: number;
    readonly updatedBy: string;
    constructor(mappingId: string, displayOrder: number, updatedBy: string);
}
export declare class UpdateQuestionDisplayOrderHandler implements ICommandHandler<UpdateQuestionDisplayOrderCommand, void> {
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService);
    execute(command: UpdateQuestionDisplayOrderCommand): Promise<void>;
}
