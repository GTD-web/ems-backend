import { IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriodEmployeeMappingFilter } from '../../../../../domain/core/evaluation-period-employee-mapping/interfaces/evaluation-period-employee-mapping.interface';
export declare class GetEvaluationTargetsByFilterQuery {
    readonly filter: EvaluationPeriodEmployeeMappingFilter;
    constructor(filter: EvaluationPeriodEmployeeMappingFilter);
}
export declare class GetEvaluationTargetsByFilterHandler implements IQueryHandler<GetEvaluationTargetsByFilterQuery, EvaluationPeriodEmployeeMappingDto[]> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService);
    execute(query: GetEvaluationTargetsByFilterQuery): Promise<EvaluationPeriodEmployeeMappingDto[]>;
}
