import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluation } from '../../../../domain/core/final-evaluation/final-evaluation.entity';
import { Employee } from '../../../../domain/common/employee/employee.entity';
import { EvaluationPeriod } from '../../../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
export interface AllEmployeesFinalEvaluationResult {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    employeeEmail: string;
    departmentName: string | null;
    rankName: string | null;
    periodId: string;
    periodName: string;
    periodStartDate: Date;
    periodEndDate: Date | null;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments: string | null;
    isConfirmed: boolean;
    confirmedAt: Date | null;
    confirmedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class GetAllEmployeesFinalEvaluationsQuery {
    readonly startDate?: Date | undefined;
    readonly endDate?: Date | undefined;
    constructor(startDate?: Date | undefined, endDate?: Date | undefined);
}
export declare class GetAllEmployeesFinalEvaluationsHandler implements IQueryHandler<GetAllEmployeesFinalEvaluationsQuery, AllEmployeesFinalEvaluationResult[]> {
    private readonly finalEvaluationRepository;
    private readonly employeeRepository;
    private readonly evaluationPeriodRepository;
    private readonly evaluationPeriodEmployeeMappingRepository;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>, employeeRepository: Repository<Employee>, evaluationPeriodRepository: Repository<EvaluationPeriod>, evaluationPeriodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>);
    execute(query: GetAllEmployeesFinalEvaluationsQuery): Promise<AllEmployeesFinalEvaluationResult[]>;
}
