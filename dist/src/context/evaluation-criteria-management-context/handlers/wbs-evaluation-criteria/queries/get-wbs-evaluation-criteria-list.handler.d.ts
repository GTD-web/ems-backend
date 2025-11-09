import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { WbsEvaluationCriteriaFilter } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import { WbsEvaluationCriteriaListResponseDto } from '@interface/admin/evaluation-criteria/dto/wbs-evaluation-criteria.dto';
export declare class GetWbsEvaluationCriteriaListQuery {
    readonly filter: WbsEvaluationCriteriaFilter;
    constructor(filter: WbsEvaluationCriteriaFilter);
}
export declare class GetWbsEvaluationCriteriaListHandler implements IQueryHandler<GetWbsEvaluationCriteriaListQuery> {
    private readonly wbsEvaluationCriteriaRepository;
    private readonly evaluationPeriodRepository;
    private readonly logger;
    constructor(wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(query: GetWbsEvaluationCriteriaListQuery): Promise<WbsEvaluationCriteriaListResponseDto>;
}
