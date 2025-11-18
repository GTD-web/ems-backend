import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import type { FinalEvaluationDetailDto } from '@interface/common/dto/performance-evaluation/final-evaluation.dto';
export declare class GetFinalEvaluationQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetFinalEvaluationHandler implements IQueryHandler<GetFinalEvaluationQuery> {
    private readonly finalEvaluationRepository;
    private readonly logger;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>);
    execute(query: GetFinalEvaluationQuery): Promise<FinalEvaluationDetailDto>;
}
