import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import type { DownwardEvaluationDto } from '@domain/core/downward-evaluation/downward-evaluation.types';
export declare class GetDownwardEvaluationListQuery {
    readonly evaluatorId?: string | undefined;
    readonly evaluateeId?: string | undefined;
    readonly periodId?: string | undefined;
    readonly wbsId?: string | undefined;
    readonly evaluationType?: string | undefined;
    readonly isCompleted?: boolean | undefined;
    readonly page: number;
    readonly limit: number;
    constructor(evaluatorId?: string | undefined, evaluateeId?: string | undefined, periodId?: string | undefined, wbsId?: string | undefined, evaluationType?: string | undefined, isCompleted?: boolean | undefined, page?: number, limit?: number);
}
export declare class GetDownwardEvaluationListHandler implements IQueryHandler<GetDownwardEvaluationListQuery> {
    private readonly downwardEvaluationRepository;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>);
    execute(query: GetDownwardEvaluationListQuery): Promise<{
        evaluations: DownwardEvaluationDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
