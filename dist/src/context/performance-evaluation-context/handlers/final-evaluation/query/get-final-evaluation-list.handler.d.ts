import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type { JobGrade, JobDetailedGrade } from '@domain/core/final-evaluation/final-evaluation.types';
import type { FinalEvaluationListItemDto } from '@/interface/common/dto/performance-evaluation/final-evaluation.dto';
export declare class GetFinalEvaluationListQuery {
    readonly employeeId?: string | undefined;
    readonly periodId?: string | undefined;
    readonly evaluationGrade?: string | undefined;
    readonly jobGrade?: JobGrade | undefined;
    readonly jobDetailedGrade?: JobDetailedGrade | undefined;
    readonly confirmedOnly?: boolean | undefined;
    readonly page: number;
    readonly limit: number;
    constructor(employeeId?: string | undefined, periodId?: string | undefined, evaluationGrade?: string | undefined, jobGrade?: JobGrade | undefined, jobDetailedGrade?: JobDetailedGrade | undefined, confirmedOnly?: boolean | undefined, page?: number, limit?: number);
}
export declare class GetFinalEvaluationListHandler implements IQueryHandler<GetFinalEvaluationListQuery> {
    private readonly finalEvaluationRepository;
    private readonly logger;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>);
    execute(query: GetFinalEvaluationListQuery): Promise<{
        evaluations: FinalEvaluationListItemDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
