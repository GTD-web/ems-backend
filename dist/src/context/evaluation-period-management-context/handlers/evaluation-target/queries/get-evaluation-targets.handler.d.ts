import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
export declare class GetEvaluationTargetsQuery {
    readonly evaluationPeriodId: string;
    readonly includeExcluded: boolean;
    constructor(evaluationPeriodId: string, includeExcluded?: boolean);
}
export interface EvaluationTargetWithEmployeeDto extends EvaluationPeriodEmployeeMappingDto {
    employee: {
        id: string;
        employeeNumber: string;
        name: string;
        email: string;
        departmentName?: string;
        rankName?: string;
        status: string;
    };
}
export declare class GetEvaluationTargetsHandler implements IQueryHandler<GetEvaluationTargetsQuery, EvaluationTargetWithEmployeeDto[]> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly employeeRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, employeeRepository: Repository<Employee>);
    execute(query: GetEvaluationTargetsQuery): Promise<EvaluationTargetWithEmployeeDto[]>;
}
