import { IQueryHandler } from '@nestjs/cqrs';
import { QuestionGroupService } from '../../../../../domain/sub/question-group/question-group.service';
import type { QuestionGroupDto } from '../../../../../domain/sub/question-group/question-group.types';
export declare class GetQuestionGroupQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetQuestionGroupHandler implements IQueryHandler<GetQuestionGroupQuery, QuestionGroupDto> {
    private readonly questionGroupService;
    private readonly logger;
    constructor(questionGroupService: QuestionGroupService);
    execute(query: GetQuestionGroupQuery): Promise<QuestionGroupDto>;
}
