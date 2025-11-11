import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import { EvaluationTargetWithEmployeeDto } from './get-evaluation-targets.handler';
export declare class GetExcludedEvaluationTargetsQuery {
    readonly evaluationPeriodId: string;
    constructor(evaluationPeriodId: string);
}
export declare class GetExcludedEvaluationTargetsHandler implements IQueryHandler<GetExcludedEvaluationTargetsQuery, EvaluationTargetWithEmployeeDto[]> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly employeeRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, employeeRepository: Repository<Employee>);
    execute(query: GetExcludedEvaluationTargetsQuery): Promise<EvaluationTargetWithEmployeeDto[]>;
}
