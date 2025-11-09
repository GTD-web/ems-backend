import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
export declare class RegisterEvaluationTargetCommand {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly createdBy: string;
    constructor(evaluationPeriodId: string, employeeId: string, createdBy: string);
}
export declare class RegisterEvaluationTargetHandler implements ICommandHandler<RegisterEvaluationTargetCommand, EvaluationPeriodEmployeeMappingDto> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly evaluationPeriodRepository;
    private readonly employeeRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>);
    execute(command: RegisterEvaluationTargetCommand): Promise<EvaluationPeriodEmployeeMappingDto>;
}
