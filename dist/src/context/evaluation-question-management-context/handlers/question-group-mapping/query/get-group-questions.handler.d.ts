import { IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { QuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';
export declare class GetGroupQuestionsQuery {
    readonly groupId: string;
    constructor(groupId: string);
}
export declare class GetGroupQuestionsHandler implements IQueryHandler<GetGroupQuestionsQuery, QuestionGroupMappingDto[]> {
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService);
    execute(query: GetGroupQuestionsQuery): Promise<QuestionGroupMappingDto[]>;
}
