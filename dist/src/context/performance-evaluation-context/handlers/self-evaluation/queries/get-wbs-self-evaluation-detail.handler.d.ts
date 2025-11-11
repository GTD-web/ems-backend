import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
export declare class GetWbsSelfEvaluationDetailQuery {
    readonly evaluationId: string;
    constructor(evaluationId: string);
}
export declare class GetWbsSelfEvaluationDetailHandler implements IQueryHandler<GetWbsSelfEvaluationDetailQuery> {
    private readonly wbsSelfEvaluationRepository;
    private readonly logger;
    constructor(wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>);
    execute(query: GetWbsSelfEvaluationDetailQuery): Promise<any>;
}
