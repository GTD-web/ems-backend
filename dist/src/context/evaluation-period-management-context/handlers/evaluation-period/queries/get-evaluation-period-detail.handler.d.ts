import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
export declare class GetEvaluationPeriodDetailQuery {
    readonly periodId: string;
    constructor(periodId: string);
}
export declare class GetEvaluationPeriodDetailQueryHandler implements IQueryHandler<GetEvaluationPeriodDetailQuery, EvaluationPeriodDto | null> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(query: GetEvaluationPeriodDetailQuery): Promise<EvaluationPeriodDto | null>;
}
