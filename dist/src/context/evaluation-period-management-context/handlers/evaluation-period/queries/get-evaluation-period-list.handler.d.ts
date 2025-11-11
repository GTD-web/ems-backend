import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
export declare class GetEvaluationPeriodListQuery {
    readonly page: number;
    readonly limit: number;
    constructor(page: number, limit: number);
}
export interface EvaluationPeriodListResult {
    items: EvaluationPeriodDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class GetEvaluationPeriodListQueryHandler implements IQueryHandler<GetEvaluationPeriodListQuery, EvaluationPeriodListResult> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(query: GetEvaluationPeriodListQuery): Promise<EvaluationPeriodListResult>;
}
