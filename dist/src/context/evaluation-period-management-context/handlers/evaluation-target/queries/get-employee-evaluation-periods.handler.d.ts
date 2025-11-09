import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodStatus, EvaluationPeriodPhase } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
export declare class GetEmployeeEvaluationPeriodsQuery {
    readonly employeeId: string;
    constructor(employeeId: string);
}
export interface EmployeeEvaluationPeriodMappingWithEmployeeDto extends Omit<EvaluationPeriodEmployeeMappingDto, 'evaluationPeriodId' | 'employeeId'> {
    employee: {
        id: string;
        employeeNumber: string;
        name: string;
        email: string;
        departmentName?: string;
        rankName?: string;
        status: string;
    };
    evaluationPeriod: {
        id: string;
        name: string;
        startDate: Date;
        endDate?: Date | null;
        status: EvaluationPeriodStatus;
        currentPhase?: EvaluationPeriodPhase | null;
    };
}
export declare class GetEmployeeEvaluationPeriodsHandler implements IQueryHandler<GetEmployeeEvaluationPeriodsQuery, EmployeeEvaluationPeriodMappingWithEmployeeDto[]> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly employeeRepository;
    private readonly evaluationPeriodRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, employeeRepository: Repository<Employee>, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(query: GetEmployeeEvaluationPeriodsQuery): Promise<EmployeeEvaluationPeriodMappingWithEmployeeDto[]>;
}
