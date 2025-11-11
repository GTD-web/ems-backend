import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
export declare class GetWbsItemEvaluationCriteriaQuery {
    readonly wbsItemId: string;
    constructor(wbsItemId: string);
}
export declare class GetWbsItemEvaluationCriteriaHandler implements IQueryHandler<GetWbsItemEvaluationCriteriaQuery> {
    private readonly wbsEvaluationCriteriaRepository;
    private readonly logger;
    constructor(wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>);
    execute(query: GetWbsItemEvaluationCriteriaQuery): Promise<import("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types").WbsEvaluationCriteriaDto[]>;
}
