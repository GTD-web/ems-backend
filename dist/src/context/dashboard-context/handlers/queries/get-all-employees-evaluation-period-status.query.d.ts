import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationPeriodStatusDto } from '../../interfaces/dashboard-context.interface';
import { GetEmployeeEvaluationPeriodStatusHandler } from './get-employee-evaluation-period-status';
export declare class GetAllEmployeesEvaluationPeriodStatusQuery implements IQuery {
    readonly evaluationPeriodId: string;
    readonly includeUnregistered: boolean;
    constructor(evaluationPeriodId: string, includeUnregistered?: boolean);
}
export declare class GetAllEmployeesEvaluationPeriodStatusHandler implements IQueryHandler<GetAllEmployeesEvaluationPeriodStatusQuery> {
    private readonly mappingRepository;
    private readonly singleStatusHandler;
    private readonly logger;
    constructor(mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, singleStatusHandler: GetEmployeeEvaluationPeriodStatusHandler);
    execute(query: GetAllEmployeesEvaluationPeriodStatusQuery): Promise<EmployeeEvaluationPeriodStatusDto[]>;
}
