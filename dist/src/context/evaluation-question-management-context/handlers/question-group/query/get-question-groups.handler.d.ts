import { IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { QuestionGroupDto, QuestionGroupFilter } from '../../../../../domain/sub/question-group/question-group.types';
export declare class GetQuestionGroupsQuery {
    readonly filter?: QuestionGroupFilter | undefined;
    constructor(filter?: QuestionGroupFilter | undefined);
}
export declare class GetQuestionGroupsHandler implements IQueryHandler<GetQuestionGroupsQuery, QuestionGroupDto[]> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(query: GetQuestionGroupsQuery): Promise<QuestionGroupDto[]>;
}
