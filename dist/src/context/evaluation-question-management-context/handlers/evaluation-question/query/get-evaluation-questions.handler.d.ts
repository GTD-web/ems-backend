import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { EvaluationQuestionDto, EvaluationQuestionFilter } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class GetEvaluationQuestionsQuery {
    readonly filter?: EvaluationQuestionFilter | undefined;
    constructor(filter?: EvaluationQuestionFilter | undefined);
}
export declare class GetEvaluationQuestionsHandler implements IQueryHandler<GetEvaluationQuestionsQuery, EvaluationQuestionDto[]> {
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService);
    execute(query: GetEvaluationQuestionsQuery): Promise<EvaluationQuestionDto[]>;
}
