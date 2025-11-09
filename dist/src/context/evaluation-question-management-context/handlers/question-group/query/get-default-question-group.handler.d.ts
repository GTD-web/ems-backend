import { IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { QuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';
export declare class GetDefaultQuestionGroupQuery {
}
export declare class GetDefaultQuestionGroupHandler implements IQueryHandler<GetDefaultQuestionGroupQuery, QuestionGroupDto> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(query: GetDefaultQuestionGroupQuery): Promise<QuestionGroupDto>;
}
