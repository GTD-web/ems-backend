import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type { FinalEvaluationDetailDto } from '@interface/admin/performance-evaluation/dto/final-evaluation.dto';
export declare class GetFinalEvaluationByEmployeePeriodQuery {
    readonly employeeId: string;
    readonly periodId: string;
    constructor(employeeId: string, periodId: string);
}
export declare class GetFinalEvaluationByEmployeePeriodHandler implements IQueryHandler<GetFinalEvaluationByEmployeePeriodQuery> {
    private readonly finalEvaluationRepository;
    private readonly logger;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>);
    execute(query: GetFinalEvaluationByEmployeePeriodQuery): Promise<FinalEvaluationDetailDto | null>;
}
