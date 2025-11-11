import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { EvaluationResponseDto, EvaluationResponseFilter } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';
export declare class GetEvaluationResponsesQuery {
    readonly filter: EvaluationResponseFilter;
    constructor(filter: EvaluationResponseFilter);
}
export declare class GetEvaluationResponsesHandler implements IQueryHandler<GetEvaluationResponsesQuery, EvaluationResponseDto[]> {
    private readonly evaluationResponseService;
    private readonly logger;
    constructor(evaluationResponseService: EvaluationResponseService);
    execute(query: GetEvaluationResponsesQuery): Promise<EvaluationResponseDto[]>;
}
