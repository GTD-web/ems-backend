import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
export declare class GetActiveEvaluationPeriodsQuery {
    constructor();
}
export declare class GetActiveEvaluationPeriodsQueryHandler implements IQueryHandler<GetActiveEvaluationPeriodsQuery, EvaluationPeriodDto[]> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(query: GetActiveEvaluationPeriodsQuery): Promise<EvaluationPeriodDto[]>;
}
