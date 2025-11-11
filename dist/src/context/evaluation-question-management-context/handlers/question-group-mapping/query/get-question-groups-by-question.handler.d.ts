import { IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { QuestionGroupMappingDto } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.types';
export declare class GetQuestionGroupsByQuestionQuery {
    readonly questionId: string;
    constructor(questionId: string);
}
export declare class GetQuestionGroupsByQuestionHandler implements IQueryHandler<GetQuestionGroupsByQuestionQuery, QuestionGroupMappingDto[]> {
    private readonly questionGroupMappingService;
    private readonly logger;
    constructor(questionGroupMappingService: QuestionGroupMappingService);
    execute(query: GetQuestionGroupsByQuestionQuery): Promise<QuestionGroupMappingDto[]>;
}
