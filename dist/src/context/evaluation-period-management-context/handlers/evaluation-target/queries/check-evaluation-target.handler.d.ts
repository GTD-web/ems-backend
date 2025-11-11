import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import { EvaluationPeriodStatus, EvaluationPeriodPhase } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
export declare class CheckEvaluationTargetQuery {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    constructor(evaluationPeriodId: string, employeeId: string);
}
export type CheckEvaluationTargetResult = {
    isEvaluationTarget: boolean;
    evaluationPeriod: {
        id: string;
        name: string;
        startDate: Date;
        endDate?: Date | null;
        status: EvaluationPeriodStatus;
        currentPhase?: EvaluationPeriodPhase | null;
    };
    employee: {
        id: string;
        employeeNumber: string;
        name: string;
        email: string;
        departmentName?: string;
        rankName?: string;
        status: string;
    };
};
export declare class CheckEvaluationTargetHandler implements IQueryHandler<CheckEvaluationTargetQuery, CheckEvaluationTargetResult> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly evaluationPeriodRepository;
    private readonly employeeRepository;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>);
    execute(query: CheckEvaluationTargetQuery): Promise<CheckEvaluationTargetResult>;
}
