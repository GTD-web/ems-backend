import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { EvaluationResponseStats } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';
export declare class GetEvaluationResponseStatsQuery {
    readonly evaluationId: string;
    constructor(evaluationId: string);
}
export declare class GetEvaluationResponseStatsHandler implements IQueryHandler<GetEvaluationResponseStatsQuery, EvaluationResponseStats> {
    private readonly evaluationResponseService;
    private readonly logger;
    constructor(evaluationResponseService: EvaluationResponseService);
    execute(query: GetEvaluationResponseStatsQuery): Promise<EvaluationResponseStats>;
}
