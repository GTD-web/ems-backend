import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import type { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class GetEmployeeSelfEvaluationsQuery {
    readonly employeeId: string;
    readonly periodId?: string | undefined;
    readonly projectId?: string | undefined;
    readonly page: number;
    readonly limit: number;
    constructor(employeeId: string, periodId?: string | undefined, projectId?: string | undefined, page?: number, limit?: number);
}
export declare class GetEmployeeSelfEvaluationsHandler implements IQueryHandler<GetEmployeeSelfEvaluationsQuery> {
    private readonly wbsSelfEvaluationRepository;
    private readonly logger;
    constructor(wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>);
    execute(query: GetEmployeeSelfEvaluationsQuery): Promise<{
        evaluations: WbsSelfEvaluationDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
