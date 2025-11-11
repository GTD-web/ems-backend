import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
export declare class RegisterBulkEvaluationTargetsCommand {
    readonly evaluationPeriodId: string;
    readonly employeeIds: string[];
    readonly createdBy: string;
    constructor(evaluationPeriodId: string, employeeIds: string[], createdBy: string);
}
export declare class RegisterBulkEvaluationTargetsHandler implements ICommandHandler<RegisterBulkEvaluationTargetsCommand, EvaluationPeriodEmployeeMappingDto[]> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly evaluationPeriodRepository;
    private readonly employeeRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>);
    execute(command: RegisterBulkEvaluationTargetsCommand): Promise<EvaluationPeriodEmployeeMappingDto[]>;
}
