import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { EvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class GetEvaluationQuestionQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetEvaluationQuestionHandler implements IQueryHandler<GetEvaluationQuestionQuery, EvaluationQuestionDto> {
    private readonly evaluationQuestionService;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService);
    execute(query: GetEvaluationQuestionQuery): Promise<EvaluationQuestionDto>;
}
